import { useState } from 'react';
import api from '../services/api';

function MCQGenerator({ documentId, mcqData, setMcqData }) {
  const [loading, setLoading] = useState(false);

  const mcqs = mcqData.mcqs;
  const userAnswers = mcqData.userAnswers;
  const submitted = mcqData.submitted;
  const showAnswers = mcqData.showAnswers;

  const setMcqs = (mcqs) => setMcqData(prev => ({ ...prev, mcqs }));
  const setUserAnswers = (userAnswers) => setMcqData(prev => ({ ...prev, userAnswers }));
  const setSubmitted = (submitted) => setMcqData(prev => ({ ...prev, submitted }));
  const setShowAnswers = (showAnswers) => setMcqData(prev => ({ ...prev, showAnswers }));

  const handleGenerate = async () => {
    setLoading(true);
    setMcqData({ mcqs: [], userAnswers: {}, submitted: false, showAnswers: {} });

    try {
      const result = await api.generateMCQs(documentId);
      setMcqs(result.questions || []);
    } catch (error) {
      alert('❌ Failed to generate MCQs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    if (submitted) return;
    setMcqData(prev => ({ ...prev, userAnswers: { ...prev.userAnswers, [qIdx]: optIdx } }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const toggleAnswer = (idx) => {
    setMcqData(prev => ({ ...prev, showAnswers: { ...prev.showAnswers, [idx]: !prev.showAnswers[idx] } }));
  };

  const calculateScore = () => {
    let correct = 0;
    mcqs.forEach((mcq, idx) => {
      const selectedIdx = userAnswers[idx];
      if (selectedIdx !== undefined && mcq.options[selectedIdx]?.is_correct) {
        correct++;
      }
    });
    return correct;
  };

  const resetQuiz = () => {
    setMcqData(prev => ({ ...prev, userAnswers: {}, submitted: false, showAnswers: {} }));
  };

  return (
    <div className="mcq-page">
      {mcqs.length === 0 ? (
        <div className="mcq-start">
          <div className="mcq-start-icon">✅</div>
          <h1>Practice MCQs</h1>
          <p>Test your understanding of the document with AI-generated questions</p>
          
          <button 
            className="btn-start-quiz"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner"></span> Generating Questions...</>
            ) : (
              '🎯 Start Quiz'
            )}
          </button>
        </div>
      ) : (
        <div className="mcq-quiz-container">
          {submitted && (
            <div className="score-banner">
              <div className="score-content">
                <span className="score-emoji">
                  {calculateScore() === mcqs.length ? '🏆' : calculateScore() >= mcqs.length / 2 ? '👏' : '📚'}
                </span>
                <div>
                  <h2>Quiz Complete!</h2>
                  <p className="score-text">
                    You scored <strong>{calculateScore()}</strong> out of <strong>{mcqs.length}</strong>
                  </p>
                </div>
              </div>
              <div className="score-actions">
                <button onClick={resetQuiz}>🔄 Retry</button>
                <button onClick={handleGenerate}>✨ New Quiz</button>
              </div>
            </div>
          )}

          <div className="mcq-grid">
            {mcqs.map((mcq, qIdx) => {
              const userAnswer = userAnswers[qIdx];
              
              return (
                <div key={qIdx} className={`mcq-card ${submitted ? 'submitted' : ''}`}>
                  <div className="mcq-q-header">
                    <span className="q-badge">Question {qIdx + 1}</span>
                  </div>
                  
                  <p className="q-text">{mcq.question}</p>

                  <div className="options-grid">
                    {mcq.options.map((opt, optIdx) => {
                      let optClass = 'option-card';
                      
                      if (submitted) {
                        if (opt.is_correct) optClass += ' correct';
                        else if (userAnswer === optIdx) optClass += ' incorrect';
                      } else if (userAnswer === optIdx) {
                        optClass += ' selected';
                      }

                      return (
                        <div 
                          key={optIdx}
                          className={optClass}
                          onClick={() => handleOptionSelect(qIdx, optIdx)}
                        >
                          <span className="option-letter">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="option-text">{opt.option}</span>
                          {submitted && opt.is_correct && <span className="result-icon">✓</span>}
                          {submitted && userAnswer === optIdx && !opt.is_correct && <span className="result-icon">✗</span>}
                        </div>
                      );
                    })}
                  </div>

                  {mcq.explanation && submitted && (
                    <div className="explanation-box">
                      <button onClick={() => toggleAnswer(qIdx)}>
                        💡 {showAnswers[qIdx] ? 'Hide' : 'Show'} Explanation
                      </button>
                      {showAnswers[qIdx] && (
                        <p>{mcq.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!submitted && (
            <div className="quiz-footer">
              <p className="progress-text">
                {Object.keys(userAnswers).length} of {mcqs.length} answered
              </p>
              <button 
                className="btn-submit-quiz"
                onClick={handleSubmit}
                disabled={Object.keys(userAnswers).length < mcqs.length}
              >
                📊 Submit Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MCQGenerator;