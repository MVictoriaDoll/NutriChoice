export interface BillItem {
  id: string
  originalBillLabel: string
  aiSuggestedName: string
  price: number
  isFoodItem: boolean
  classification: string
}


export const confirmedReceipts: { fileUrl: string; items: BillItem[] }[] = []