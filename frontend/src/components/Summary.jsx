import { useState } from 'react';
import api from '../services/api';

function Summary({ documentId }) {
  const [summaryType, setSummaryType] = useState('concise');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setSummary('');

    try {
      const result = await api.generateSummary(documentId, summaryType, 500);
      setSummary(result.summary);
    } catch (error) {
      alert('❌ Failed to generate summary: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="summary-page">
      <div className="summary-header">
        <div className="summary-icon">📝</div>
        <h1>Document Summary</h1>
        <p>Generate AI-powered summaries of your document</p>
      </div>

      <div className="summary-content">
        <div className="summary-options-row">
          <div 
            className={`summary-type-card ${summaryType === 'concise' ? 'active' : ''}`}
            onClick={() => setSummaryType('concise')}
          >
            <span className="type-icon">⚡</span>
            <h3>Concise</h3>
            <p>Brief overview of key points</p>
          </div>

          <div 
            className={`summary-type-card ${summaryType === 'explanatory' ? 'active' : ''}`}
            onClick={() => setSummaryType('explanatory')}
          >
            <span className="type-icon">📚</span>
            <h3>Explanatory</h3>
            <p>Detailed explanation with context</p>
          </div>
        </div>

        <button 
          className="btn-generate-summary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <><span className="spinner"></span> Generating Summary...</>
          ) : (
            '✨ Generate Summary'
          )}
        </button>

        {summary && (
          <div className="summary-result">
            <div className="result-toolbar">
              <span className="result-type">
                {summaryType === 'concise' ? '⚡ Concise' : '📚 Explanatory'} Summary
              </span>
              <button className="btn-copy" onClick={handleCopy}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div className="result-text">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Summary;