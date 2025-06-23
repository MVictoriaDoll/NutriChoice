import type { FC } from 'react'
import { useState } from 'react'
import './UploadPage.css'

interface UploadContentProps {
  // call the handling functions when users upload or drag files
  onFileUpload: (file: File) => void
}

const UploadFile: FC<UploadContentProps> = ({ onFileUpload }) => {
  // set defalut to false since the dragging area only displays on web, not the mobile version
  const [dragging, setDragging] = useState(false)

  // when users upload using button
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] // get the 1st file that users select
    if (file) onFileUpload(file) // if file exists, call onFileUpload()
  }

  // when users upload using the drop zone (for web version)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault() // to prevent the default action (opening the file)
    setDragging(false) // cancel the drag-and-drop status
    const file = e.dataTransfer.files?.[0] // get the file being dragged, for now we can only drag 1 file
    if (file) onFileUpload(file) // upload that file
  }

  // dragging through the area
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault() // prevent defalut before dragging
    setDragging(true)
  }

  // dragging over the area
  const handleDragLeave = () => {
    setDragging(false)
  }


  return (
    <div className="uploadPageContainer">
      {/* choose file by clicking button */}
      <label htmlFor="file-input" className="uploadButton">
        Upload your grocery bill here
      </label>

      {/* the hidden text input space */}
      <input
        type="file"
        id="file-input"
        accept="image/*,.pdf" // the format should only be image or PDF
        capture="environment" // for mobile version to call the camera
        onChange={handleFileChange}
        style={{ display: 'none' }} // to hide the input，using only label to control
      />

      {/* dragging area only for web version */}
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`} // add the dragging style
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p>Or drag and drop your bill here</p>
      </div>
    </div>
  )
}

export default UploadFile