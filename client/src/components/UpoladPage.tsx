import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UploadPage.css'

const UploadPage: FC = () => {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleFileUpload = async () => {
    setLoading(true)
    setError(null)


    try {
      console.log('Starting upload...')

      const res = await fetch('/api/receipts/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': '68613d982ab9f1d60d54d2b6',
        },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Upload failed: ${res.status} ${errorText}`)
      }

      const data = await res.json()
      console.log('Upload successful, receiptId:', data.receiptId)

      // Redirigir a /verify con el receiptId

      navigate(`/verify/${data.receiptId}`);
      //navigate('/verify', { state: { receiptId: '68613d990af1ad05fdc6aa4b2' } });



    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📄 File selected (fake upload triggered)')
    handleFileUpload()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    console.log('📄 File dropped (fake upload triggered)')
    handleFileUpload()
  }


  /*const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('File selected:', file)
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      console.log('File dropped:', file)
      handleFileUpload(file)
    }
  }*/

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
