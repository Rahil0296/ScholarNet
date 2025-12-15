import { useState } from 'react';
import api from '../services/api';

function Summarizer({ documentId }) {
  const [summaryType, setSummaryType] = useState('learning');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const summaryTypes = [
    { value: 'learning', label: '📖 Learning', icon: '🎓' },
    { value: 'concise', label: '⚡ Concise', icon: '📝' },
    { value: 'explanatory', label: '📚 Explanatory', icon: '💡' },
    { value: 'formal', label: '🎯 Formal', icon: '📋' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.generateSummary(documentId, summaryType, 500);
      setSummary(result.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="summarizer">
      <h2>Generate Summary</h2>

      {/* Summary Type Buttons */}
      <div className="summary-types">
        {summaryTypes.map((type) => (
          <button
            key={type.value}
            className={`type-btn ${summaryType === type.value ? 'active' : ''}`}
            onClick={() => setSummaryType(type.value)}
          >
            <span className="icon">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>

      <button 
        onClick={handleGenerate} 
        disabled={loading}
        className="btn-primary"
      >
        {loading ? '⏳ Generating...' : '✨ Generate Summary'}
      </button>

      {/* Summary Display */}
      {summary && (
        <div className="summary-result">
          <h3>Summary ({summaryType})</h3>
          <div className="summary-text">{summary}</div>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default Summarizer;