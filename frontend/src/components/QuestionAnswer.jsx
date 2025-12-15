import { useState } from 'react';
import api from '../services/api';

function QuestionAnswer({ documentId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.askQuestion(question);
      setAnswer(result.answer);
      setSources(result.sources || []);
      
      // Add to history
      setHistory([...history, { question, answer: result.answer }]);
      setQuestion('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="question-answer">
      <h2>Ask Questions</h2>

      {/* Question Input */}
      <div className="question-input">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the document..."
          rows={3}
        />
        <button 
          onClick={handleAsk} 
          disabled={!question.trim() || loading}
          className="btn-primary"
        >
          {loading ? '⏳ Thinking...' : '🤔 Ask'}
        </button>
      </div>

      {/* Answer Display */}
      {answer && (
        <div className="answer-result">
          <h3>Answer</h3>
          <div className="answer-text">{answer}</div>
          
          {sources && sources.length > 0 && (
            <div className="sources">
              <h4>Sources:</h4>
              {sources.map((source, idx) => (
                <div key={idx} className="source-item">
                  {source}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="qa-history">
          <h3>Previous Questions</h3>
          {history.map((item, idx) => (
            <div key={idx} className="history-item">
              <p className="history-question"><strong>Q:</strong> {item.question}</p>
              <p className="history-answer"><strong>A:</strong> {item.answer}</p>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default QuestionAnswer;