import config from '../config';

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';

const chatModel = new ChatGoogleGenerativeAI({
  model: config.geminiModelName,
  maxOutputTokens: 2048,
  temperature: 0.1,
});

// --- PROMPT: For initial image validation ---
const imageValidationSystemPrompt = SystemMessagePromptTemplate.fromTemplate(
  `You are a strict image classifier. Your sole purpose is to determine if an uploaded document (image or PDF) is a clearly readable grocery receipt.
  Respond with "TRUE" if it is a readable grocery receipt.
  Respond with "FALSE" if it is not a readable grocery receipt (e.g., blurry, too dark, a picture of something else, a document that is not a receipt).
  Output ONLY "TRUE" or "FALSE". Do NOT include any other text or markdown.`
);

const imageValidationHumanPrompt = HumanMessagePromptTemplate.fromTemplate(
  `Does this document appear to be a receipt with grocery items? 
  If yes, respond with "TRUE". If not, respond with "FALSE".
  Document data: {image_data}`
);

const IMAGE_VALIDATION_PROMPT = ChatPromptTemplate.fromMessages([
  imageValidationSystemPrompt,
  imageValidationHumanPrompt
]);

// const EXPECTED_JSON_SCHEMA = `{
//   "purchaseDate": "YYYY-MM-DD",
//   "totalAmount": "number",
//   "currency": "string",
//   "originalRawText": "string",
//   "items": [
//     {
//       "originalBillLabel": "string",
//       "aiSuggestedName": "string",
//       "price": "number",
//       "isFoodItem": "boolean",
//       "nutritionDetails": {},
//       "classification": "string"
//     }
//   ]
// }`;

const receiptAnalysisSystemPrompt = SystemMessagePromptTemplate.fromTemplate(
  `You are an expert grocery receipt analyst. Your task is to accurately extract structured information from a grocery receipt document (image or PDF).
  **Important:** The receipt might be in German. Translate all extracted textual values (except 'originalBillLabel') into English.
  Return the data as a single JSON object.
  Mandatory extraction rules:
  1. 'originalRawText': Extract the complete and exact raw text from the entire receipt document. Translate this raw text into English.
  2. For each item in the 'items' array:
    a. 'originalBillLabel': This MUST be the precise grocery item name as it appears on the receipt (keep original language, e.g., "Milch" for milk).
    b. 'aiSuggestedName': This should be your intelligent prediction and standardization of the 'originalBillLabel', translated into English. For example, if 'originalBillLabel' is "LAYS CHIPS", 'aiSuggestedName' should be "Potato Chips". If 'originalBillLabel' is "ORGANIC APPLES", 'aiSuggestedName' should be "Apples". If 'originalBillLabel' is "Milch", 'aiSuggestedName' should be "Milk".
    c. 'price': Extract the exact price for each individual item as listed on the receipt.
    d. 'isFoodItem': Determine if the item is a food item (true) or not (false). This MUST be strictly boolean.
    e. 'nutritionDetails' and 'classification': These fields should ONLY be populated if 'isFoodItem' is true. If 'isFoodItem' is false, set 'nutritionDetails' to an empty object ({}) and 'classification' to "Other".
    f. For 'classification' (if isFoodItem is true), categorize each item as "Fresh Food", "Processed", "High Sugar", "Good Nutri-Score", or "Other" based on common understanding.
  General rules:
  - If 'purchaseDate', 'totalAmount', or 'currency' are not explicitly visible, make a reasonable guess or set to null/empty string. Translate 'currency' to its English abbreviation (e.g., "EUR" for "Euro").
  - Output ONLY the JSON object. Do NOT include any other text or markdown formatting outside the JSON.`
);
const receiptAnalysisHumanPrompt = HumanMessagePromptTemplate.fromTemplate(
  `Analyze this grocery receipt document: {image_data}`
);

const RECEIPT_ANALYSIS_PROMPT = ChatPromptTemplate.fromMessages([
  receiptAnalysisSystemPrompt,
  receiptAnalysisHumanPrompt,
]);

console.log(RECEIPT_ANALYSIS_PROMPT);

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
  validateDocument: async (
    base64Image: string,
    mimeType: string
  ): Promise<boolean> => {
    try {
      const formattedValidationPrompt = await IMAGE_VALIDATION_PROMPT.formatMessages({
        image_data: `data:${mimeType};base64,${base64Image}`,
      });

      console.log("✅ Prompt formatting succeeded.");

      const validationResponse = await chatModel.invoke(formattedValidationPrompt);
      console.log("🧠 Raw Gemini validation output:", validationResponse);

      const content = validationResponse?.content;
      const isValidReceiptText = typeof content === 'string'
        ? content.trim().toUpperCase()
        : '';

      console.log("🧠 Gemini validation response:", isValidReceiptText);

      return isValidReceiptText.includes('TRUE') || isValidReceiptText.includes('YES');
    } catch (err) {
      console.error("❌ Gemini validation error:", err);
      throw new Error("Validation failed: prompt formatting or AI error");
    }
  },

  analyzeReceipt: async (
    base64Image: string,
    mimeType: string
  ): Promise<AIReceiptData> => {
    try {
      const formattedAnalysisPrompt = await RECEIPT_ANALYSIS_PROMPT.formatMessages({
        image_data: `data:${mimeType};base64,${base64Image}`,
      });

      const aiResponse = await chatModel.invoke(formattedAnalysisPrompt);
      const aiParsedDataText = aiResponse.content as string;

      console.log("📦 Gemini analysis raw output:", aiParsedDataText);

      const cleanJsonString = aiParsedDataText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedReceiptData: AIReceiptData = JSON.parse(cleanJsonString);

      if (!parsedReceiptData.items || !Array.isArray(parsedReceiptData.items)) {
        throw new Error('AI response did not contain a valid "items" array.');
      }

      return parsedReceiptData;
    } catch (err) {
      console.error("❌ Gemini analysis error:", err);
      throw new Error("Failed to analyze receipt with Gemini.");
    }
  }
};


/*export const aiService = {
  validateDocument: async (
    base64Image: string,
    mimeType: string
  ): Promise<boolean> => {
    const formattedValidationPrompt = await IMAGE_VALIDATION_PROMPT.formatMessages({
      image_data: `data:${mimeType};base64,${base64Image}`,

      /*image_data: {
        type: 'image_url',
        mime_type: mimeType,
        url: `data:${mimeType};base64,${base64Image}`,
      },
    });

    const validationResponse = await chatModel.invoke(formattedValidationPrompt);
    //const isValidReceiptText = (validationResponse.content as string).trim().toUpperCase();
    // Gemini responses are not always plain strings.
    // This check ensures that we only call `.trim()` if `content` is actually a string.
    // Prevents runtime errors like "trim is not a function" when the model returns an object or undefined.
    const content = validationResponse?.content;
    const isValidReceiptText = typeof content === 'string'
      ? content.trim().toUpperCase()
      : '';


    return isValidReceiptText.includes('TRUE');

    //return isValidReceiptText === 'TRUE';
  },

  analyzeReceipt: async (
    base64Image: string,
    mimeType: string
  ): Promise<AIReceiptData> => {
    const formattedAnalysisPrompt = await RECEIPT_ANALYSIS_PROMPT.formatMessages({
      image_data: `data:${mimeType};base64,${base64Image}`,
      // json_schema: EXPECTED_JSON_SCHEMA,
      /*image_data: {
        type: 'image_url',
        mime_type: mimeType,
        url: `data:${mimeType};base64,${base64Image}`,
      },
    });

    const aiResponse = await chatModel.invoke(formattedAnalysisPrompt);

    const aiParsedDataText = aiResponse.content as string;
    const cleanJsonString = (aiParsedDataText)
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedReceiptData: AIReceiptData = JSON.parse(cleanJsonString);
    if (!parsedReceiptData.items || !Array.isArray(parsedReceiptData.items)) {
      throw new Error('AI response did not contain a valid "items" array.');
    }
    return parsedReceiptData;
  },
};*/
