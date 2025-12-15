import { useState } from 'react';
import api from '../services/api';

function MCQGenerator({ documentId, mcqData, setMcqData }) {
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const [evaluation, setEvaluation] = useState(null);

  const mcqs = mcqData.mcqs;
  const userAnswers = mcqData.userAnswers;
  const submitted = mcqData.submitted;
  const showAnswers = mcqData.showAnswers;

  const setMcqs = (mcqs) => setMcqData(prev => ({ ...prev, mcqs }));
  const setSubmitted = (submitted) => setMcqData(prev => ({ ...prev, submitted }));
  const setShowAnswers = (showAnswers) => setMcqData(prev => ({ ...prev, showAnswers }));

  const handleGenerate = async () => {
    setLoading(true);
    setMcqData({ mcqs: [], userAnswers: {}, submitted: false, showAnswers: {} });
    setEvaluation(null);

    try {
      const result = await api.generateMCQs(documentId, numQuestions);
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

  const handleSubmit = async () => {
    setEvaluating(true);
    
    try {
      // Convert userAnswers keys to integers for backend
      const answersForBackend = {};
      Object.keys(userAnswers).forEach(key => {
        answersForBackend[parseInt(key)] = userAnswers[key];
      });
      
      // Call backend to evaluate answers
      const result = await api.evaluateMCQs(mcqs, answersForBackend);
      setEvaluation(result);
      setSubmitted(true);
      
      // Auto-expand all explanations
      const allExpanded = {};
      mcqs.forEach((_, idx) => { allExpanded[idx] = true; });
      setShowAnswers(allExpanded);
    } catch (error) {
      console.error('Evaluation error:', error);
      alert('❌ Failed to evaluate answers: ' + error.message);
    } finally {
      setEvaluating(false);
    }
  };

  const toggleAnswer = (idx) => {
    setMcqData(prev => ({ ...prev, showAnswers: { ...prev.showAnswers, [idx]: !prev.showAnswers[idx] } }));
  };

  const getPerformanceStyle = (performance) => {
    const styles = {
      excellent: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', emoji: '🏆' },
      strong: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', emoji: '💪' },
      good: { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', emoji: '👍' },
      needs_practice: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', emoji: '📚' },
      weak: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', emoji: '⚠️' }
    };
    return styles[performance] || styles.good;
  };

  const getPerformanceLabel = (performance) => {
    const labels = {
      excellent: 'Excellent',
      strong: 'Strong',
      good: 'Good',
      needs_practice: 'Needs Practice',
      weak: 'Weak'
    };
    return labels[performance] || 'Unknown';
  };

  const resetQuiz = () => {
    setMcqData(prev => ({ ...prev, userAnswers: {}, submitted: false, showAnswers: {} }));
    setEvaluation(null);
  };

  return (
    <div className="mcq-page">
      {mcqs.length === 0 ? (
        <div className="mcq-start">
          <div className="mcq-start-icon">✅</div>
          <h1>Practice MCQs</h1>
          <p>Test your understanding of the document with AI-generated questions</p>
          
          <div className="mcq-options">
            <label className="mcq-option-label">Number of Questions</label>
            <div className="question-count-selector">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  className={`count-btn ${numQuestions === count ? 'active' : ''}`}
                  onClick={() => setNumQuestions(count)}
                  disabled={loading}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            className="btn-start-quiz"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner"></span> Generating {numQuestions} Questions...</>
            ) : (
              `🎯 Start Quiz (${numQuestions} Questions)`
            )}
          </button>
        </div>
      ) : (
        <div className="mcq-quiz-container">
          {/* Topic-wise Performance Analysis from Backend */}
          {submitted && evaluation && (
            <div className="results-section">
              <div className="results-header">
                <h2>📊 Your Performance Report</h2>
                <div className="results-actions">
                  <button className="btn-retry" onClick={resetQuiz}>🔄 Retry Quiz</button>
                  <button className="btn-new-quiz" onClick={handleGenerate}>✨ New Quiz</button>
                </div>
              </div>

              {/* Overall Summary */}
              <div className="overall-summary">
                <div className="summary-stat">
                  <span className="stat-value">{evaluation.total_correct}/{evaluation.total_questions}</span>
                  <span className="stat-label">Questions Correct</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">{evaluation.overall_percentage}%</span>
                  <span className="stat-label">Overall Score</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">{evaluation.strong_topics.length}</span>
                  <span className="stat-label">Strong Topics</span>
                </div>
                <div className="summary-stat highlight-weak">
                  <span className="stat-value">{evaluation.weak_topics.length}</span>
                  <span className="stat-label">Need Improvement</span>
                </div>
              </div>

              {/* Topic Cards from Backend */}
              <div className="topic-results-grid">
                {evaluation.topic_analysis.map((topic, idx) => {
                  const perf = getPerformanceStyle(topic.performance);
                  return (
                    <div 
                      key={idx} 
                      className="topic-result-card"
                      style={{ borderLeftColor: perf.color }}
                    >
                      <div className="topic-result-header">
                        <div className="topic-info">
                          <span className="topic-emoji">{perf.emoji}</span>
                          <h3>{topic.topic}</h3>
                        </div>
                        <span 
                          className="performance-badge"
                          style={{ backgroundColor: perf.bg, color: perf.color }}
                        >
                          {getPerformanceLabel(topic.performance)}
                        </span>
                      </div>

                      <div className="topic-score-display">
                        <div className="score-circle" style={{ borderColor: perf.color }}>
                          <span className="score-value" style={{ color: perf.color }}>
                            {topic.percentage}%
                          </span>
                        </div>
                        <div className="score-details">
                          <div className="score-row correct">
                            <span className="score-icon">✓</span>
                            <span>{topic.correct} correct</span>
                          </div>
                          <div className="score-row incorrect">
                            <span className="score-icon">✗</span>
                            <span>{topic.incorrect} incorrect</span>
                          </div>
                        </div>
                      </div>

                      <div className="topic-questions-list">
                        <span className="questions-label">Questions:</span>
                        <div className="question-badges">
                          {topic.questions.map((q, qIdx) => (
                            <span 
                              key={qIdx}
                              className={`question-badge ${q.correct ? 'correct' : 'incorrect'}`}
                              title={q.question}
                            >
                              Q{q.index + 1}
                            </span>
                          ))}
                        </div>
                      </div>

                      {topic.performance === 'weak' || topic.performance === 'needs_practice' ? (
                        <div className="topic-recommendation">
                          💡 Review this topic in your document for better understanding
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Recommendations from Backend */}
              {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                <div className="recommendations-section">
                  <h3>📖 Study Recommendations</h3>
                  <ul className="recommendations-list">
                    {evaluation.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weak Topics Summary */}
              {evaluation.weak_topics.length > 0 && (
                <div className="weak-topics-summary">
                  <h3>📚 Focus Areas for Improvement</h3>
                  <div className="weak-topics-list">
                    {evaluation.weak_topics.map((topic, idx) => (
                      <div key={idx} className="weak-topic-item">
                        <span className="weak-topic-name">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strong Topics Summary */}
              {evaluation.strong_topics.length > 0 && (
                <div className="strong-topics-summary">
                  <h3>💪 Your Strong Areas</h3>
                  <div className="strong-topics-list">
                    {evaluation.strong_topics.map((topic, idx) => (
                      <span key={idx} className="strong-topic-tag">{topic}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Questions Grid */}
          <div className="mcq-grid">
            {mcqs.map((mcq, qIdx) => {
              const userAnswer = userAnswers[qIdx];
              const isCorrect = userAnswer !== undefined && mcq.options[userAnswer]?.is_correct;
              
              return (
                <div key={qIdx} className={`mcq-card ${submitted ? 'submitted' : ''} ${submitted ? (isCorrect ? 'correct-card' : 'incorrect-card') : ''}`}>
                  <div className="mcq-q-header">
                    <span className="q-badge">Question {qIdx + 1}</span>
                    {mcq.topic && (
                      <span className="q-topic">{mcq.topic}</span>
                    )}
                    {submitted && (
                      <span className={`q-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    )}
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

                  {/* Explanation Section */}
                  {submitted && (
                    <div className="explanation-section">
                      <button 
                        className="btn-explanation"
                        onClick={() => toggleAnswer(qIdx)}
                      >
                        💡 {showAnswers[qIdx] ? 'Hide' : 'Show'} Explanation
                      </button>
                      
                      {showAnswers[qIdx] && mcq.explanation && (
                        <div className="explanation-content">
                          <p>{mcq.explanation}</p>
                          
                          <div className="correct-answer-box">
                            <strong>Correct Answer:</strong>{' '}
                            {mcq.options.map((opt, idx) => 
                              opt.is_correct ? `${String.fromCharCode(65 + idx)}. ${opt.option}` : null
                            ).filter(Boolean)[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          {!submitted && (
            <div className="quiz-footer">
              <p className="progress-text">
                {Object.keys(userAnswers).length} of {mcqs.length} answered
              </p>
              <button 
                className="btn-submit-quiz"
                onClick={handleSubmit}
                disabled={Object.keys(userAnswers).length < mcqs.length || evaluating}
              >
                {evaluating ? (
                  <><span className="spinner"></span> Evaluating...</>
                ) : (
                  '📊 Submit & View Results'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MCQGenerator;