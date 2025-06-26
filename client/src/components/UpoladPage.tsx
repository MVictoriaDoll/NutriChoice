// src/components/UploadPage.tsx
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadReceipt } from '../api/receipts'
import './UploadPage.css'

const UploadPage: FC = () => {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleFile = async (file: File) => {
  setLoading(true)
  setError(null)
  try {
    const { url } = await uploadReceipt(file) // call the API service to upload
    console.log('The file has been uploaded to:', url)
    console.log('🚀 Next is to navigate to /verify, state = fileUrl:', url)
    // The url can be saved to context or state, and then navigate
    navigate('/verify', { state: { fileUrl: url } })
  } catch (err: unknown) {
    if (err instanceof Error) {
      setError(err.message)
    } else {
      setError(String(err))
    }
  } finally {
    setLoading(false)
  }
}


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="uploadPageWrapper">
      <h2 className="uploadPageTitle">Upload Your Receipt</h2>

      {error && <p className="errorText">{error}</p>}
      {loading ? (
        <p>Uploading…</p>
      ) : (
        <>
          <label htmlFor="file-input" className="uploadButton">
            Upload your grocery bill here
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div
            className={`drop-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <p>Or drag and drop your bill here</p>
          </div>
        </>
      )}
    </div>
  )
}

export default UploadPage
