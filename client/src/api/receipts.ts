/* export async function uploadReceipt(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('receiptFile', file)

  const resp = await fetch('/api/receipts/upload', {
    method: 'POST',
    headers: {
      'X-User-Id': '614b37296a124db40ae74d21',
    },
    body: formData,
  })

  if (!resp.ok) {
    throw new Error(`Upload failed: ${resp.statusText}`)
  }
  return resp.json()  // we assume it would return { url: 'https://...' }
} */

// src/api/receipts.ts
export async function uploadReceipt(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('receiptFile', file)
  const resp = await fetch('/api/receipts/upload', {
    method: 'POST',
    headers: { 'X-User-Id': '507f1f77bcf86cd799439011' },
    body: formData,
  })
  if (!resp.ok) {
    // Read the text/JSON returned by the back end
    const text = await resp.text()
    console.error('Upload failed:', resp.status, text)
    throw new Error(`Upload failed: ${resp.status} ${text}`)
  }
  return resp.json()
}


