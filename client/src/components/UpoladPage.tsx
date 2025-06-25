import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './UploadPage.css'

const UploadPage: FC = () => {
  const [dragging, setDragging] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('The file you selected to upload is:', file)
      navigate('/verify')
    }
  }


  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      console.log('Drag and drop to upload:', file)
      navigate('/verify')
    }
  }

  return (
    <div className="uploadPageWrapper">
      <h2 className="uploadPageTitle">Upload Your Receipt</h2>

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
    </div>
  )
}

export default UploadPage
