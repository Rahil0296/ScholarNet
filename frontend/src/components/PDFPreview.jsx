import { useState, useEffect } from 'react';

function PDFPreview({ pdfUrl, filename }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(100);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If you have the original PDF file, you can use PDF.js or an iframe
  // For now, we'll use an iframe with the PDF URL or a placeholder

  if (isCollapsed) {
    return (
      <div className="pdf-preview-collapsed">
        <button 
          className="pdf-expand-btn"
          onClick={() => setIsCollapsed(false)}
          title="Show PDF Preview"
        >
          📄
        </button>
      </div>
    );
  }

  return (
    <div className="pdf-preview-panel">
      <div className="pdf-preview-header">
        <div className="pdf-header-left">
          <button 
            className="pdf-collapse-btn"
            onClick={() => setIsCollapsed(true)}
            title="Hide PDF Preview"
          >
            ✕
          </button>
          <h3 title={filename}>📄 {filename}</h3>
        </div>
        <div className="pdf-controls">
          <button 
            className="pdf-control-btn"
            onClick={() => setScale(s => Math.max(50, s - 10))}
            title="Zoom Out"
          >
            −
          </button>
          <span className="zoom-level">{scale}%</span>
          <button 
            className="pdf-control-btn"
            onClick={() => setScale(s => Math.min(200, s + 10))}
            title="Zoom In"
          >
            +
          </button>
          <button 
            className="pdf-control-btn fit-btn"
            onClick={() => setScale(100)}
            title="Reset Zoom"
          >
            ⟲
          </button>
        </div>
      </div>
      
      <div className="pdf-preview-content">
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#zoom=${scale}&toolbar=0&navpanes=0`}
            className="pdf-iframe"
            title="PDF Preview"
          />
        ) : (
          <div className="pdf-placeholder">
            <div className="pdf-placeholder-icon">📄</div>
            <p>PDF Preview</p>
            <span className="pdf-placeholder-hint">
              Document loaded and indexed
            </span>
          </div>
        )}
      </div>

      <div className="pdf-preview-footer">
        <div className="page-navigation">
          <button 
            className="page-nav-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            ‹
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="page-nav-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

export default PDFPreview;