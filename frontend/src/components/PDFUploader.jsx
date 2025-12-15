import { useState } from 'react';
import api from '../services/api';

function PDFUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await api.uploadPDF(file);
      console.log('Upload successful:', result);
      onUploadSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pdf-uploader">
      <h2>Upload PDF Document</h2>
      
      <div className="upload-area">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        {file && (
          <div className="file-info">
            <p>📄 {file.name}</p>
            <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="btn-primary"
        >
          {uploading ? '⏳ Uploading...' : '📤 Upload PDF'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default PDFUploader;