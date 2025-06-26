export async function uploadReceipt(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('receipt', file)

  const resp = await fetch('/api/receipts/upload', {
    method: 'POST',
    body: formData,
  })

  if (!resp.ok) {
    throw new Error(`Upload failed: ${resp.statusText}`)
  }
  return resp.json()  // we assume it would return { url: 'https://...' }
}



