import { useState } from 'react';
import './OutputPanel.css';

const OutputPanel = ({ output, isRunning, onClear, onClose, height, onResize }) => {
    const [isResizing, setIsResizing] = useState(false);

    const handleMouseDown = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (isResizing) {
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight >= 100 && newHeight <= 600) {
                onResize(newHeight);
            }
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
    };

    // Add global mouse event listeners when resizing
    if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    } else {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    return (
        <div className="output-panel" style={{ height: `${height}px` }}>
            <div
                className="output-panel-resize-handle"
                onMouseDown={handleMouseDown}
            >
                <div className="resize-indicator"></div>
            </div>

            <div className="output-panel-header">
                <div className="output-panel-title">
                    <span className="output-icon">▶</span>
                    <span>Output</span>
                    {isRunning && <span className="running-indicator">Running...</span>}
                </div>
                <div className="output-panel-actions">
                    <button
                        className="output-btn output-btn-clear"
                        onClick={onClear}
                        title="Clear output"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <button
                        className="output-btn output-btn-close"
                        onClick={onClose}
                        title="Close output panel"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M6 18L18 6M6 6l12 12"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="output-panel-content">
                {output.length === 0 ? (
                    <div className="output-empty">
                        <p>No output yet. Click the Run button to execute your code.</p>
                    </div>
                ) : (
                    <pre className="output-text">{output}</pre>
                )}
            </div>
        </div>
    );
};

export default OutputPanel;
