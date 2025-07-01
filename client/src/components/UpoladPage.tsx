import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadReceipt } from '../services/apiService';
import axios from 'axios';
import './UploadPage.css';

const UploadPage: FC = () => {
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Reset state before new upload
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadReceipt(file);

      console.log('Upload successful: ', result);
      if (result.receipt && result.receipt.id) {
        navigate(`/verify/${result.receipt.id}`);
      } else {
        throw new Error('Receipt ID not found in the server response');
      }
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred.';

      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message ?? errorMessage;
      }

      setUploadError(errorMessage);
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('The file you selected to upload is:', file);
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      console.log('Drag and drop to upload:', file);
      handleFileUpload(file);
    }
  };

  return (
    <div className="uploadPageWrapper">
      <h2 className="uploadPageTitle">Upload Your Receipt</h2>

      <label
        htmlFor="file-input"
        className={`uploadButton ${isUploading ? 'disabled' : ''}`}
      >
        {isUploading ? 'Processing...' : 'Upload your grocery bill here'}
      </label>
      <input
        id="file-input"
        type="file"
        accept="image/*,.pdf"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      <div
        className={`drop-zone ${dragging ? 'dragging' : ''} ${
          isUploading ? 'disabled' : ''
        }`}
        onDragOver={(e) => {
          if (!isUploading) {
            e.preventDefault();
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <p>Or drag and drop your bill here</p>
      </div>

      {uploadError && <p className="upload-error">Error: {uploadError}</p>}
    </div>
  );
};

export default UploadPage;
