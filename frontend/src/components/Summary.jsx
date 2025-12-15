import { useState, useEffect } from 'react';
import api from '../services/api';

function Summary({ documentId }) {
  const [summaryType, setSummaryType] = useState('concise');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
 
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleGenerate = async () => {
    // ✅ Stop any ongoing reading when generating new summary
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);

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

  
  const startReadAloud = () => {
    if (!summary) return;

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    setTimeout(() => {
    
      const utterance = new SpeechSynthesisUtterance(summary);
      
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsReading(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsReading(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.error('TTS Error:', event);
        setIsReading(false);
        setIsPaused(false);
      };

      // ✅ Start reading from beginning
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const pauseReadAloud = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeReadAloud = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopReadAloud = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
  };

  return (
    <div className="summary-page">
      <div className="summary-header">
        <div className="summary-icon">📄</div>
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

            
            <div className="read-aloud-controls">
              {!isReading || isPaused ? (
                <button 
                  className="btn-read-aloud"
                  onClick={isPaused ? resumeReadAloud : startReadAloud}
                >
                  {isPaused ? '▶️ Resume Reading' : '🔊 Read Aloud'}
                </button>
              ) : (
                <button 
                  className="btn-pause"
                  onClick={pauseReadAloud}
                >
                  ⏸️ Pause
                </button>
              )}
              
              {(isReading || isPaused) && (
                <button 
                  className="btn-stop"
                  onClick={stopReadAloud}
                >
                  ⏹️ Stop
                </button>
              )}
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