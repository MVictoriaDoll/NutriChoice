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

const itemListExtractionSystemPrompt = SystemMessagePromptTemplate.fromTemplate(
  `From the provided text, extract only the lines that represent purchased items. Do not include sums, taxes, discounts, or any other information.`
);

const itemListExtractionHumanPrompt = HumanMessagePromptTemplate.fromTemplate(
  `Please list all the individual item lines from this text, one per line:\n\n"{raw_text}"`
);

const ITEM_LIST_EXTRACTION_PROMPT = ChatPromptTemplate.fromMessages([
  itemListExtractionSystemPrompt,
  itemListExtractionHumanPrompt
]);

const BulkItemAnalysisSystemPrompt = SystemMessagePromptTemplate.fromTemplate(
  `You are an expert grocery receipt analyst. Your task is to analyze a list of item lines and provide details for each one. The text may be in German; translate relevant values into English.
  IMPORTANT: Do NOT return JSON. Return a list where each item is on a new line, with details separated by a pipe character (|) in the specified order.`
);

const BulkItemAnalysisHumanPrompt = HumanMessagePromptTemplate.fromTemplate(
  `For each item line in the list provided below, extract the following details in this exact order, separated by a pipe (|):
  originalBillLabel|aiSuggestedName|price|isFoodItem|classification|nutritionDetails

  TASK DETAILS FOR EACH ITEM:
  - originalBillLabel: The exact product name from the line.
  - aiSuggestedName: A clean, recognizable English name for the product.
  - price: The final numeric price for the line item.
  - isFoodItem: A boolean ('true' or 'false').
  - classification: If not a food item, must be 'Other'. Otherwise, categorize as "Fresh Food", "Processed", "High Sugar", etc.
  - nutritionDetails: If not a food item, must be "EMPTY". Otherwise, provide a comma-separated list of 5-6 key nutritional benefits.

  EXAMPLE:
  Input List:
  K.Eier 1,99 B
  Cunchips Cheese 0,99 B

  Expected Output:
  K.Eier|Eggs|1.99|true|Fresh Food|Complete Protein,Supports Good Cholesterol,Heart Health
  Cunchips Cheese|Cheese Chips|0.99|true|Processed|EMPTY

  ITEM LIST TO ANALYZE:
  "{item_list}"`
);

const BULK_ITEM_ANALYSIS_PROMPT = ChatPromptTemplate.fromMessages([
  BulkItemAnalysisSystemPrompt,
  BulkItemAnalysisHumanPrompt
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
        purchaseDate: null, totalAmount: null, currency: null,
        originalRawText: rawText, items: [],
    };

    const metadataChain = METADATA_EXTRACTION_PROMPT.pipe(chatModel);
    const metadataPromise = metadataChain.invoke({ raw_text: rawText });

    const itemListChain = ITEM_LIST_EXTRACTION_PROMPT.pipe(chatModel);
    const itemListPromise = itemListChain.invoke({raw_text: rawText});

    const [metadataResponse, itemListResponse] = await Promise.all([metadataPromise, itemListPromise]);

    (metadataResponse.content as string).split('\n').forEach(line => {
      if (line.toLowerCase().startsWith('purchasedate:')) result.purchaseDate = line.substring(line.indexOf(':') + 1).trim();
        else if (line.toLowerCase().startsWith('totalamount:')) result.totalAmount = parseFloat(line.substring(line.indexOf(':') + 1).trim());
        else if (line.toLowerCase().startsWith('currency:')) result.currency = line.substring(line.indexOf(':') + 1).trim();
    });

    const itemListContent = itemListResponse.content;
    let itemLinesAsString: string;

    if (typeof itemListContent === 'string') {
        itemLinesAsString = itemListContent;
    } else if (Array.isArray(itemListContent) && itemListContent.length > 0 && typeof itemListContent[0] === 'object' && 'text' in itemListContent[0]) {
        itemLinesAsString = (itemListContent[0] as { text: string }).text;
    } else {
        itemLinesAsString = ''; // Default to an empty string if the format is unexpected or empty
    }

    if (!itemLinesAsString || itemLinesAsString.trim() === '') {
        console.warn('[DEBUG] No items found by AI to analyze.');
        return result;
    }

    const bulkAnalysisChain = BULK_ITEM_ANALYSIS_PROMPT.pipe(chatModel);
    const bulkAnalysisResponse = await bulkAnalysisChain.invoke({ item_list: itemLinesAsString });

    const bulkAnalysisContent = bulkAnalysisResponse.content;
    let analyzedItemLinesAsString: string;

    if (typeof bulkAnalysisContent === 'string') {
        analyzedItemLinesAsString = bulkAnalysisContent;
    } else if (Array.isArray(bulkAnalysisContent) && bulkAnalysisContent.length > 0 && typeof bulkAnalysisContent[0] === 'object' && 'text' in bulkAnalysisContent[0]) {
        analyzedItemLinesAsString = (bulkAnalysisContent[0] as { text: string }).text;
    } else {
        console.warn('[DEBUG] Bulk analysis returned unexpected format, cannot process items:', bulkAnalysisContent);
        analyzedItemLinesAsString = ''; // Default to empty string to prevent crash
    }

    const analyzedItemLines = (analyzedItemLinesAsString).split('\n').filter(line => line.trim() !== '');

    // Parse the final, detailed item lines
    for (const line of analyzedItemLines) {
        const parts = line.split('|');
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
            console.warn(`Skipping malformed item detail line: ${line}`);
        }
    }

    console.log('Step 3 successful: Data parsed and structured in code.');
    return result;

  },
};
