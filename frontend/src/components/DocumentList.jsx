import { useState, useEffect } from 'react';
import api from '../services/api';

function DocumentList({ onSelectDocument }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const result = await api.listDocuments();
      setDocuments(result.documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.deleteDocument(documentId);
      setDocuments(documents.filter(doc => doc.document_id !== documentId));
    } catch (err) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  if (loading) return <div>Loading documents...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="document-list">
      <h2>My Documents</h2>

      {documents.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <div className="documents-grid">
          {documents.map((doc) => (
            <div key={doc.document_id} className="document-card">
              <h3>📄 {doc.filename}</h3>
              <div className="document-actions">
                <button 
                  onClick={() => onSelectDocument(doc)}
                  className="btn-secondary"
                >
                  Open
                </button>
                <button 
                  onClick={() => handleDelete(doc.document_id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentList;