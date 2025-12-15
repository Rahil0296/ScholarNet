import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import api from './services/api';
import QAChat from './components/QAChat';
import Summary from './components/Summary';
import MCQGenerator from './components/MCQGenerator';
import ReadAloud from './components/ReadAloud';
import PDFPreview from './components/PDFPreview';

function App() {
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // State for each feature (persisted across tab switches)
  const [chatMessages, setChatMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [mcqData, setMcqData] = useState({ mcqs: [], userAnswers: {}, submitted: false, showAnswers: {} });
  const [readAloudData, setReadAloudData] = useState({ chunks: [], sentences: [], text: '' });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Create a URL for the PDF preview
      const fileUrl = URL.createObjectURL(selectedFile);
      setPdfUrl(fileUrl);
      
      const result = await api.uploadPDF(selectedFile);
      console.log('Upload successful:', result);
      setUploadedDocument(result);
      // Reset all feature states for new document
      setChatMessages([]);
      setSessionId(null);
      setMcqData({ mcqs: [], userAnswers: {}, submitted: false, showAnswers: {} });
      setReadAloudData({ chunks: [], sentences: [], text: '' });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
      setPdfUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleBackToUpload = () => {
    // Revoke the PDF URL to free memory
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setUploadedDocument(null);
    setSelectedFile(null);
    setChatMessages([]);
    setSessionId(null);
    setMcqData({ mcqs: [], userAnswers: {}, submitted: false, showAnswers: {} });
    setReadAloudData({ chunks: [], sentences: [], text: '' });
  };

  // If document is uploaded, show workspace
  if (uploadedDocument) {
    return (
      <Router>
        <div className="App">
          <div className="workspace">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
              <div className="sidebar-header">
                <h2 className="sidebar-title">ScholarNet</h2>
                <button 
                  className="sidebar-toggle"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? '→' : '←'}
                </button>
              </div>
              
              <div className="doc-info-section">
                <p className="doc-name" title={uploadedDocument.filename}>
                  <span className="doc-icon">📄</span>
                  <span className="doc-name-text">{uploadedDocument.filename}</span>
                </p>
                <p className="doc-info">{uploadedDocument.chunks} chunks indexed</p>
              </div>

              <nav className="sidebar-nav">
                <button 
                  className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                  title="Ask Questions"
                >
                  <span className="nav-icon">💬</span>
                  <span className="nav-text">Ask Questions</span>
                </button>
                <button 
                  className={`nav-item ${activeTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('summary')}
                  title="Summary"
                >
                  <span className="nav-icon">📝</span>
                  <span className="nav-text">Summary</span>
                </button>
                <button 
                  className={`nav-item ${activeTab === 'mcq' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mcq')}
                  title="Practice MCQs"
                >
                  <span className="nav-icon">✅</span>
                  <span className="nav-text">Practice MCQs</span>
                </button>
                <button 
                  className={`nav-item ${activeTab === 'readaloud' ? 'active' : ''}`}
                  onClick={() => setActiveTab('readaloud')}
                  title="Read Aloud"
                >
                  <span className="nav-icon">🎧</span>
                  <span className="nav-text">Read Aloud</span>
                </button>
              </nav>

              <div className="sidebar-footer">
                <button className="btn-back" onClick={handleBackToUpload} title="Upload New PDF">
                  <span className="back-icon">←</span>
                  <span className="back-text">Upload New PDF</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
              {activeTab === 'chat' && (
                <div className="chat-with-preview">
                  <PDFPreview 
                    pdfUrl={pdfUrl} 
                    filename={uploadedDocument.filename}
                  />
                  <QAChat 
                    documentId={uploadedDocument.document_id}
                    messages={chatMessages}
                    setMessages={setChatMessages}
                    sessionId={sessionId}
                    setSessionId={setSessionId}
                  />
                </div>
              )}
              {activeTab === 'summary' && (
                <Summary documentId={uploadedDocument.document_id} />
              )}
              {activeTab === 'mcq' && (
                <MCQGenerator 
                  documentId={uploadedDocument.document_id}
                  mcqData={mcqData}
                  setMcqData={setMcqData}
                />
              )}
              {activeTab === 'readaloud' && (
                <ReadAloud 
                  documentId={uploadedDocument.document_id}
                  readAloudData={readAloudData}
                  setReadAloudData={setReadAloudData}
                />
              )}
            </div>
          </div>
        </div>
      </Router>
    );
  }

  // Upload page
  return (
    <Router>
      <div className="App">
        <div className="upload-page">
          <header className="app-header">
            <h1>ScholarNet</h1>
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
              
              <label htmlFor="file-input" className="upload-zone">
                <div className="upload-zone-icon">📄</div>
                {selectedFile ? (
                  <>
                    <p className="selected-file-name">{selectedFile.name}</p>
                    <p className="selected-file-size">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p>Click to select PDF</p>
                    <p>or drag and drop here</p>
                  </>
                )}
              </label>

              {selectedFile && (
                <button 
                  className="btn-upload"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner"></span>
                      Uploading & Processing...
                    </>
                  ) : (
                    '🚀 Upload & Start Learning'
                  )}
                </button>
              )}
            </div>

            <div className="features-preview">
              <div className="feature-item">
                <div className="feature-item-icon">💬</div>
                <div className="feature-item-content">
                  <h4>Ask Questions</h4>
                  <p>Chat with your document</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">📝</div>
                <div className="feature-item-content">
                  <h4>Smart Summaries</h4>
                  <p>Get concise or detailed summaries</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">✅</div>
                <div className="feature-item-content">
                  <h4>Practice MCQs</h4>
                  <p>Test your understanding</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-item-icon">🎧</div>
                <div className="feature-item-content">
                  <h4>Read Aloud</h4>
                  <p>Listen to your document</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;