import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

function QAChat({ documentId, messages, setMessages, sessionId, setSessionId }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await api.askQuestion(input, documentId, sessionId);
      
      // Store session ID from first response
      if (result.session_id && !sessionId) {
        setSessionId(result.session_id);
      }
      
      const assistantMessage = { 
        role: 'assistant', 
        content: result.answer
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: '❌ Sorry, I encountered an error. Please try again.',
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h2>💬 Ask Questions</h2>
          <p>Chat with your document</p>
        </div>
        {messages.length > 0 && (
          <button className="btn-clear" onClick={clearChat}>
            Clear
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="empty-icon">💬</div>
            <h3>Start a conversation</h3>
            <p>Ask any question about your document and I'll help you find the answer.</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-role">
                    {msg.role === 'user' ? 'You' : 'ScholarNet AI'}
                  </div>
                  <div className={`message-text ${msg.isError ? 'error' : ''}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="message-role">ScholarNet AI</div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your document..."
            rows={1}
            disabled={loading}
          />
          <button 
            className="btn-send" 
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            {loading ? <span className="spinner-small"></span> : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QAChat;