import { BillItem } from '../models/receipt'

/**
here is the mock OCR data
 */
export async function recognizeReceipt(fileUrl: string): Promise<BillItem[]> {
  await new Promise(r => setTimeout(r, 800))
  return [
    {
      id: '1',
      originalBillLabel: 'Chocapic',
      aiSuggestedName: 'Cereal',
      price: 4.5,
      isFoodItem: true,
      classification: 'High Sugar'
    },
    {
      id: '2',
      originalBillLabel: 'Pepsi Max',
      aiSuggestedName: 'Soda',
      price: 3.0,
      isFoodItem: false,
      classification: 'Processed'
    }
  ]
}
