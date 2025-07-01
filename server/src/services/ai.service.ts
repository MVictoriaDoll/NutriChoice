import config from '../config';

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'

const chatModel = new ChatGoogleGenerativeAI({
  model: config.geminiModelName,
  maxOutputTokens: 2048,
  temperature: 0.1,
});

// --- PROMPT: For initial image validation ---
const textValidationSystemPrompt = SystemMessagePromptTemplate.fromTemplate(
  `You are a strict text classifier. Your sole purpose is to determine if the following text, extracted from a PDF, is from a grocery receipt.
  Respond with "TRUE" if it is from a grocery receipt.
  Respond with "FALSE" if it is not.
  Output ONLY "TRUE" or "FALSE".`
);

const textValidationHumanPrompt = HumanMessagePromptTemplate.fromTemplate(
 'Does the following text appear to be from a grocery receipt?\n\nText: "{raw_text}"'
);

const TEXT_VALIDATION_PROMPT = ChatPromptTemplate.fromMessages([
  textValidationSystemPrompt,
  textValidationHumanPrompt
]);

const metadataExtractionSystemPrompt = SystemMessagePromptTemplate.fromTemplate(
 `From the provided text, extract only the purchaseDate, totalAmount, and currency. Format it on separate lines like the example.`
);
const metadataExtractionHumanPrompt = HumanMessagePromptTemplate.fromTemplate(
  `INSTRUCTIONS:
- purchaseDate: Find the exact date of purchase (next to "Datum"/"Date").
- totalAmount: Find the total bill amount (next to "Summe"/"Total").
- currency: Find the currency (e.g., "EUR").

EXAMPLE:
purchaseDate: 2025-02-08
totalAmount: 60.70
currency: EUR

TEXT TO ANALYZE:
"{raw_text}"`
);

const METADATA_EXTRACTION_PROMPT = ChatPromptTemplate.fromMessages([
  metadataExtractionSystemPrompt,
  metadataExtractionHumanPrompt
]);

const singleItemAnalysisSystemPrompt = SystemMessagePromptTemplate.fromTemplate(
  `You are an expert grocery receipt analyst. Your task is to extract details for a single item line. The text may be in German; translate relevant values into English.
IMPORTANT: Do NOT return JSON. Return a single line with values separated by a pipe character (|) in the specified order.
**CRITICAL RULE:** If the provided line is clearly NOT a purchased grocery item (e.g., it is a subtotal, a discount, a tax line, an address, or just a price), you MUST return the single word "IGNORE".`
);

const singleItemAnalysisHumanPrompt = HumanMessagePromptTemplate.fromTemplate(
  `From the provided item line, extract the following details in this exact order, separated by a pipe (|):
  originalBillLabel|aiSuggestedName|price|isFoodItem|classification|nutritionDetails

  TASK DETAILS FOR EACH ITEM:
  - originalBillLabel: The exact product name from the line.
  - aiSuggestedName: A clean, recognizable English name for the product.
  - price: The final numeric price for the line item.
  - isFoodItem: A boolean ('true' or 'false').
  - classification: If not a food item, must be 'Other'. Otherwise, categorize as "Fresh Food", "Processed", "High Sugar", or "Good NutriScore". before categorizing "Processed" first check for "Good NutriScore".
  - nutritionDetails: If not a food item, must be "EMPTY". Otherwise, provide a comma-separated list of 5-6 key nutritional benefits.

  EXAMPLE 1:
  Input: "K.Eier 1,99 B"
  Output: K.Eier|Eggs|1.99|true|Fresh Food|Complete Protein,Supports Good Cholesterol,Heart Health

  EXAMPLE 2:
  Input: "Summe 60,70"
  Output: IGNORE

  ITEM LINE TO ANALYZE:
  "{item_line}"`
);

const SINGLE_ITEM_ANALYSIS_PROMPT = ChatPromptTemplate.fromMessages([
  singleItemAnalysisSystemPrompt,
  singleItemAnalysisHumanPrompt
]);


export interface AIReceiptData {
  purchaseDate: string | null;
  totalAmount: number | null;
  currency: string | null;
  originalRawText: string;
  items: Array<{
    originalBillLabel: string;
    aiSuggestedName: string;
    price: number;
    isFoodItem: boolean;
    nutritionDetails: Record<string, unknown>;
    classification: string;
  }>;
}

export const aiService = {
    processReceipt: async (filePath: string): Promise<AIReceiptData> => {
    console.log('[AI_SERVICE] Starting receipt processing chain...');

    const rawText = await aiService.extractTextFromPdf(filePath);
    const isValid = await aiService.validateReceiptText(rawText);
    if (!isValid) {
      throw new Error('AI_VALIDATION_FAILED');
    }
    const structuredData = await aiService.analyzeReceiptInChunks(rawText);

    console.log('[AI_SERVICE] Receipt processing chain finished successfully.');
    return structuredData;
  },

  extractTextFromPdf: async (filePath: string): Promise<string> => {
    console.log('Step 1: Extracting text from PDF file...');
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    const rawText = docs.map(doc => doc.pageContent).join('\n\n');
    if (!rawText || rawText.trim() === '') throw new Error('PDF_PARSING_FAILED');

    console.log('Step 1 successful.');
    return rawText.trim();
  },

  validateReceiptText: async (rawText: string): Promise<boolean> => {
    console.log('Step 2: Validating extracted text...');
    const validationChain = TEXT_VALIDATION_PROMPT.pipe(chatModel);
    const response = await validationChain.invoke({ raw_text: rawText });
    const isValidText = (response.content as string).trim().toUpperCase();

    if (isValidText !== 'TRUE') {
        console.warn(`Text validation failed. AI response: ${isValidText}`);
        return false;
    }
    console.log('Step 2 successful.');
    return true;
  },
  analyzeReceiptInChunks: async (rawText: string): Promise<AIReceiptData> => {
  console.log('Step 3: Analyzing receipt in chunks...');
  const result: AIReceiptData = {
    purchaseDate: null,
    totalAmount: null,
    currency: null,
    originalRawText: rawText,
    items: [],
  };

  const metadataChain = METADATA_EXTRACTION_PROMPT.pipe(chatModel);
  const metadataResponse = await metadataChain.invoke({ raw_text: rawText });
  (metadataResponse.content as string).split('\n').forEach(line => {
    if (line.toLowerCase().startsWith('purchasedate:')) {
      result.purchaseDate = line.substring(line.indexOf(':') + 1).trim();
    } else if (line.toLowerCase().startsWith('totalamount:')) {
      result.totalAmount = parseFloat(line.substring(line.indexOf(':') + 1).trim());
    } else if (line.toLowerCase().startsWith('currency:')) {
      result.currency = line.substring(line.indexOf(':') + 1).trim();
    }
  });

  const allLines = rawText.split('\n').filter(line => line.trim() !== '');
  const chunkSize = 5;
  console.log(`[DEBUG] Analyzing all ${allLines.length} lines in batches of ${chunkSize}...`);

  const itemDetailChain = SINGLE_ITEM_ANALYSIS_PROMPT.pipe(chatModel);

  for (let i = 0; i < allLines.length; i += chunkSize) {
    const chunk = allLines.slice(i, i + chunkSize);
    console.log(`[DEBUG] Processing batch ${i / chunkSize + 1}...`);

    const itemAnalysisPromises = chunk.map(line => itemDetailChain.invoke({ item_line: line }));
    const analyzedItemResponses = await Promise.all(itemAnalysisPromises);

    for (const detailResponse of analyzedItemResponses) {
      const itemDetailString = detailResponse.content;

      if (typeof itemDetailString !== 'string') {
        console.warn('[AI WARNING] Expected string from Gemini, but got:', itemDetailString);
        continue;
      }

      if (itemDetailString.trim().toUpperCase() === 'IGNORE') {
        continue;
      }

      const parts = itemDetailString.trim().split('|');
      if (parts.length === 6) {
        const price = parseFloat(parts[2]?.trim());
        const nutritionString = parts[5]?.trim();
        let nutritionData: Record<string, unknown> = {};
        if (nutritionString && nutritionString.toUpperCase() !== 'EMPTY') {
          nutritionData = {
            benefits: nutritionString.split(',').map(benefit => benefit.trim()),
          };
        }
        result.items.push({
          originalBillLabel: parts[0]?.trim(),
          aiSuggestedName: parts[1]?.trim(),
          price: isNaN(price) ? 0 : price,
          isFoodItem: parts[3]?.trim().toLowerCase() === 'true',
          classification: parts[4]?.trim(),
          nutritionDetails: nutritionData,
        });
      } else {
        console.warn(`[AI WARNING] Malformed item response skipped: ${itemDetailString}`);
      }
    }
  }

  console.log('Step 3 successful: Data parsed and structured in code.');
  return result;
},


  /*analyzeReceiptInChunks: async (rawText: string): Promise<AIReceiptData> => {
    console.log('Step 3: Analyzing receipt in chunks...');
    const result: AIReceiptData = {
        purchaseDate: null, totalAmount: null, currency: null,
        originalRawText: rawText, items: [],
    };

    const metadataChain = METADATA_EXTRACTION_PROMPT.pipe(chatModel);
    const metadataResponse = await metadataChain.invoke({ raw_text: rawText });
    (metadataResponse.content as string).split('\n').forEach(line => {
      if (line.toLowerCase().startsWith('purchasedate:')) result.purchaseDate = line.substring(line.indexOf(':') + 1).trim();
        else if (line.toLowerCase().startsWith('totalamount:')) result.totalAmount = parseFloat(line.substring(line.indexOf(':') + 1).trim());
        else if (line.toLowerCase().startsWith('currency:')) result.currency = line.substring(line.indexOf(':') + 1).trim();
    });


    const allLines = rawText.split('\n').filter(line => line.trim() !== '');
    const chunkSize = 5; // Process 5 items at a time to stay under the free tier limit
    console.log(`[DEBUG] Analyzing all ${allLines.length} lines in batches of ${chunkSize}...`);

    const itemDetailChain = SINGLE_ITEM_ANALYSIS_PROMPT.pipe(chatModel);

    for (let i = 0; i < allLines.length; i += chunkSize) {
        const chunk = allLines.slice(i, i + chunkSize);
        console.log(`[DEBUG] Processing batch ${i / chunkSize + 1}...`);

        const itemAnalysisPromises = chunk.map(line => itemDetailChain.invoke({ item_line: line }));
        const analyzedItemResponses = await Promise.all(itemAnalysisPromises);

        // --- Process the results of the current batch ---
        for (const detailResponse of analyzedItemResponses) {
            const itemDetailString = detailResponse.content as string;

            if (itemDetailString.trim().toUpperCase() === 'IGNORE') {
                continue; // Skip this line as it's not an item
            }

            const parts = itemDetailString.split('|');
            if (parts.length === 6) {
                const price = parseFloat(parts[2]?.trim());
                const nutritionString = parts[5]?.trim();
                let nutritionData: Record<string, unknown> = {};
                if (nutritionString && nutritionString.toUpperCase() !== 'EMPTY') {
                    nutritionData = { benefits: nutritionString.split(',').map(benefit => benefit.trim()) };
                }
                result.items.push({
                    originalBillLabel: parts[0]?.trim(),
                    aiSuggestedName: parts[1]?.trim(),
                    price: isNaN(price) ? 0 : price,
                    isFoodItem: parts[3]?.trim().toLowerCase() === 'true',
                    classification: parts[4]?.trim(),
                    nutritionDetails: nutritionData,
                });
            } else {
                console.warn(`Skipping malformed item detail line from AI: ${itemDetailString}`);
            }
        }
    }

    console.log('Step 3 successful: Data parsed and structured in code.');
    return result;

  },*/
};
