import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import api from './services/api';
import QAChat from './components/QAChat';
import Summary from './components/Summary';
import MCQGenerator from './components/MCQGenerator';

function AppContent({ 
  uploadedDocument, 
  pdfPreviewUrl, 
  handleReset,
  // Chat state
  chatMessages,
  setChatMessages,
  chatSessionId,
  setChatSessionId,
  // Summary state
  summaryData,
  setSummaryData,
  // MCQ state
  mcqData,
  setMcqData
}) {
  const location = useLocation();
  const showPDF = !location.pathname.includes('/mcq') && !location.pathname.includes('/summary');

  return (
    <div className="workspace-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>📚 ScholarNet</h2>
        </div>
        
        <div className="doc-info">
          <span className="doc-icon">📄</span>
          <div className="doc-details">
            <p className="doc-name">{uploadedDocument.filename}</p>
            <p className="doc-meta">{uploadedDocument.chunks} chunks</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/chat" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span>💬</span> Ask Questions
          </NavLink>
          <NavLink to="/summary" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span>📝</span> Summarize
          </NavLink>
          <NavLink to="/mcq" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span>✅</span> Practice MCQs
          </NavLink>
        </nav>

        <button className="btn-new-doc" onClick={handleReset}>
          ↻ Upload New PDF
        </button>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${showPDF ? 'with-pdf' : 'full-width'}`}>
        {showPDF && (
          <div className="pdf-section">
            <div className="pdf-header">
              <h3>📄 {uploadedDocument.filename}</h3>
            </div>
            <div className="pdf-viewer">
              {pdfPreviewUrl && (
                <iframe src={pdfPreviewUrl} title="PDF Viewer" />
              )}
            </div>
          </div>
        )}

        <div className={`feature-section ${showPDF ? '' : 'centered'}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={
              <QAChat 
                documentId={uploadedDocument.document_id} 
                messages={chatMessages}
                setMessages={setChatMessages}
                sessionId={chatSessionId}
                setSessionId={setChatSessionId}
              />
            } />
            <Route path="/summary" element={
              <Summary 
                documentId={uploadedDocument.document_id}
                summaryData={summaryData}
                setSummaryData={setSummaryData}
              />
            } />
            <Route path="/mcq" element={
              <MCQGenerator 
                documentId={uploadedDocument.document_id}
                mcqData={mcqData}
                setMcqData={setMcqData}
              />
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

  // Persistent state for features
  const [chatMessages, setChatMessages] = useState([]);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [summaryData, setSummaryData] = useState({ type: 'concise', content: '' });
  const [mcqData, setMcqData] = useState({ mcqs: [], userAnswers: {}, submitted: false, showAnswers: {} });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      const fileUrl = URL.createObjectURL(file);
      setPdfPreviewUrl(fileUrl);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const result = await api.uploadPDF(selectedFile);
      setUploadedDocument(result);
    } catch (error) {
      alert('❌ Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setUploadedDocument(null);
    setSelectedFile(null);
    setPdfPreviewUrl(null);
    // Reset feature states
    setChatMessages([]);
    setChatSessionId(null);
    setSummaryData({ type: 'concise', content: '' });
    setMcqData({ mcqs: [], userAnswers: {}, submitted: false, showAnswers: {} });
  };

  return (
    <Router>
      <div className="App">
        {!uploadedDocument ? (
          <div className="upload-page">
            <header className="app-header">
              <h1>📚 ScholarNet</h1>
              <p>AI-Powered Learning Assistant</p>
            </header>
            
            <div className="upload-container">
              <div className="upload-card">
                <h2>Upload Your PDF Document</h2>
                <p className="upload-subtitle">Start learning smarter with AI-powered tools</p>
                
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  id="file-input"
                  style={{ display: 'none' }}
                />
                
                {!selectedFile ? (
                  <label htmlFor="file-input" className="upload-zone">
                    <div className="upload-icon">📄</div>
                    <h3>Click to select PDF</h3>
                    <p className="upload-hint">or drag and drop here</p>
                  </label>
                ) : (
                  <div className="file-selected">
                    <div className="file-info-box">
                      <span className="file-icon-large">📄</span>
                      <div className="file-details">
                        <p className="file-name">{selectedFile.name}</p>
                        <p className="file-size">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="upload-actions">
                      <button 
                        className="btn-upload-main" 
                        onClick={handleUpload}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <><span className="spinner"></span> Processing...</>
                        ) : (
                          '🚀 Upload & Start Learning'
                        )}
                      </button>
                      
                      <button 
                        className="btn-cancel"
                        onClick={() => {
                          setSelectedFile(null);
                          if (pdfPreviewUrl) {
                            URL.revokeObjectURL(pdfPreviewUrl);
                            setPdfPreviewUrl(null);
                          }
                        }}
                        disabled={uploading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="features-preview">
                <div className="feature-item">
                  <span>💬</span>
                  <div>
                    <h4>Ask Questions</h4>
                    <p>Chat with your document</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span>📝</span>
                  <div>
                    <h4>Smart Summaries</h4>
                    <p>Get concise or detailed summaries</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span>✅</span>
                  <div>
                    <h4>Practice MCQs</h4>
                    <p>Test your understanding</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AppContent 
            uploadedDocument={uploadedDocument}
            pdfPreviewUrl={pdfPreviewUrl}
            handleReset={handleReset}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            chatSessionId={chatSessionId}
            setChatSessionId={setChatSessionId}
            summaryData={summaryData}
            setSummaryData={setSummaryData}
            mcqData={mcqData}
            setMcqData={setMcqData}
          />
        )}
      </div>
    </Router>
  );
}

export default App;