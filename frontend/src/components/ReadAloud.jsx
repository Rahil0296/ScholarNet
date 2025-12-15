import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

function ReadAloud({ documentId, readAloudData, setReadAloudData }) {
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  
  const utteranceRef = useRef(null);
  const chunksContainerRef = useRef(null);

  const chunks = readAloudData.chunks;

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
      setVoices(englishVoices);
      if (englishVoices.length > 0 && !voice) {
        // Prefer a natural sounding voice
        const preferred = englishVoices.find(v => 
          v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
        ) || englishVoices[0];
        setVoice(preferred);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  // Auto-scroll to current chunk
  useEffect(() => {
    if (chunksContainerRef.current && isPlaying) {
      const activeChunk = chunksContainerRef.current.querySelector('.chunk-card.active');
      if (activeChunk) {
        activeChunk.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentChunkIndex, isPlaying]);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      // First get the document text and sentences
      const docData = await api.getDocumentText(documentId);
      
      if (!docData.sentences || docData.sentences.length < 5) {
        alert('Document is too short for read aloud feature');
        return;
      }

      // Then get semantic chunks
      const result = await api.getReadAloudChunks(docData.sentences, 8);
      
      setReadAloudData({
        chunks: result.chunks || [],
        sentences: docData.sentences,
        text: docData.text
      });
    } catch (error) {
      alert('❌ Failed to process document: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const speakChunk = useCallback((index) => {
    if (index >= chunks.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentChunkIndex(0);
      return;
    }

    const chunk = chunks[index];
    const utterance = new SpeechSynthesisUtterance(chunk.text);
    
    utterance.rate = speed;
    utterance.pitch = 1;
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      if (!isPaused) {
        setCurrentChunkIndex(index + 1);
        speakChunk(index + 1);
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [chunks, speed, voice, isPaused]);

  const handlePlay = () => {
    if (chunks.length === 0) return;

    speechSynthesis.cancel();
    setIsPlaying(true);
    setIsPaused(false);
    speakChunk(currentChunkIndex);
  };

  const handlePause = () => {
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentChunkIndex(0);
  };

  const handleChunkClick = (index) => {
    speechSynthesis.cancel();
    setCurrentChunkIndex(index);
    if (isPlaying) {
      speakChunk(index);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (isPlaying && !isPaused) {
      speechSynthesis.cancel();
      speakChunk(currentChunkIndex);
    }
  };

  const formatTime = (text) => {
    // Rough estimate: 150 words per minute at 1x speed
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / (150 * speed));
    return minutes < 1 ? '< 1 min' : `~${minutes} min`;
  };

  const getTotalTime = () => {
    if (chunks.length === 0) return '0 min';
    const totalWords = chunks.reduce((acc, chunk) => acc + chunk.text.split(/\s+/).length, 0);
    const minutes = Math.ceil(totalWords / (150 * speed));
    return `~${minutes} min`;
  };

  return (
    <div className="read-aloud-page">
      {chunks.length === 0 ? (
        <div className="read-aloud-start">
          <div className="start-icon">🎧</div>
          <h1>Read Aloud</h1>
          <p>Listen to your document with AI-powered semantic chunking</p>
          
          <div className="feature-highlights">
            <div className="highlight-item">
              <span>🧠</span>
              <div>
                <h4>Smart Chunking</h4>
                <p>AI groups related sentences together</p>
              </div>
            </div>
            <div className="highlight-item">
              <span>🎛️</span>
              <div>
                <h4>Speed Control</h4>
                <p>Adjust playback speed to your preference</p>
              </div>
            </div>
            <div className="highlight-item">
              <span>📍</span>
              <div>
                <h4>Visual Tracking</h4>
                <p>Follow along with highlighted text</p>
              </div>
            </div>
          </div>

          <button 
            className="btn-start-reading"
            onClick={fetchChunks}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner"></span> Processing Document...</>
            ) : (
              '🎯 Start Read Aloud'
            )}
          </button>
        </div>
      ) : (
        <div className="read-aloud-player">
          {/* Controls Bar */}
          <div className="player-controls">
            <div className="controls-left">
              <div className="playback-buttons">
                {!isPlaying ? (
                  <button className="btn-play" onClick={handlePlay}>
                    ▶️ Play
                  </button>
                ) : isPaused ? (
                  <button className="btn-play" onClick={handleResume}>
                    ▶️ Resume
                  </button>
                ) : (
                  <button className="btn-pause" onClick={handlePause}>
                    ⏸️ Pause
                  </button>
                )}
                <button className="btn-stop" onClick={handleStop} disabled={!isPlaying && !isPaused}>
                  ⏹️ Stop
                </button>
              </div>

              <div className="speed-control">
                <label>Speed:</label>
                <div className="speed-buttons">
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      className={speed === s ? 'active' : ''}
                      onClick={() => handleSpeedChange(s)}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="controls-right">
              <div className="voice-select">
                <label>Voice:</label>
                <select 
                  value={voice?.name || ''} 
                  onChange={(e) => {
                    const selected = voices.find(v => v.name === e.target.value);
                    setVoice(selected);
                  }}
                >
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name.replace('Microsoft ', '').replace('Google ', '')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="progress-info">
                <span className="chunk-progress">
                  Chunk {currentChunkIndex + 1} / {chunks.length}
                </span>
                <span className="time-estimate">{getTotalTime()}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${((currentChunkIndex + 1) / chunks.length) * 100}%` }}
            />
          </div>

          {/* Chunks Display */}
          <div className="chunks-container" ref={chunksContainerRef}>
            {chunks.map((chunk, index) => (
              <div
                key={chunk.chunk_id}
                className={`chunk-card ${index === currentChunkIndex ? 'active' : ''} ${index < currentChunkIndex ? 'completed' : ''}`}
                onClick={() => handleChunkClick(index)}
              >
                <div className="chunk-header">
                  <span className="chunk-number">Section {index + 1}</span>
                  <span className="chunk-meta">
                    {chunk.num_sentences} sentences • {formatTime(chunk.text)}
                  </span>
                </div>
                <p className="chunk-text">{chunk.text}</p>
                {index === currentChunkIndex && isPlaying && !isPaused && (
                  <div className="playing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reset Button */}
          <div className="player-footer">
            <button 
              className="btn-reset-chunks"
              onClick={() => {
                handleStop();
                setReadAloudData({ chunks: [], sentences: [], text: '' });
              }}
            >
              ↻ Process Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReadAloud;