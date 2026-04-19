import { useEffect, useRef } from 'react';

const OutputPanel = ({ output, isRunning, onClear, onClose, height, onResize }) => {
    const isResizingRef = useRef(false);
    const contentRef = useRef(null);

    // Auto-scroll output to bottom
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [output]);

    const handleMouseDown = (e) => {
        isResizingRef.current = true;
        e.preventDefault();
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingRef.current) return;
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight >= 80 && newHeight <= 600) onResize(newHeight);
        };
        const handleMouseUp = () => {
            isResizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onResize]);

    // Colorize output lines (errors red, normal white)
    const renderOutput = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            const isError = /error|Error|ERROR|exception|Exception|traceback|Traceback/i.test(line);
            const isWarn  = /warn|WARN|warning/i.test(line);
            const isInfo  = /^\s*\[info\]|\[log\]|info:/i.test(line);
            return (
                <span
                    key={i}
                    className={`sp-out-line ${isError ? 'sp-out-line--error' : isWarn ? 'sp-out-line--warn' : isInfo ? 'sp-out-line--info' : ''}`}
                >
                    {line}
                    {'\n'}
                </span>
            );
        });
    };

    return (
        <div className="sp-output-panel" style={{ height: `${height}px` }}>
            {/* Drag handle */}
            <div className="sp-output-resize" onMouseDown={handleMouseDown}>
                <div className="sp-output-resize-grip" />
            </div>

            {/* Header */}
            <div className="sp-output-header">
                <div className="sp-output-header-left">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                    </svg>
                    <span>Output</span>
                    {isRunning && (
                        <span className="sp-output-running">
                            <span className="sp-out-spinner" />
                            Running…
                        </span>
                    )}
                </div>
                <div className="sp-output-header-right">
                    <button className="sp-out-hdr-btn" onClick={onClear} title="Clear output" disabled={isRunning}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                        </svg>
                        Clear
                    </button>
                    <button className="sp-out-hdr-btn sp-out-hdr-btn--close" onClick={onClose} title="Close output">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="sp-output-content" ref={contentRef}>
                {!output || output.trim() === '' ? (
                    <div className="sp-output-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                        </svg>
                        <p>No output yet. Click <strong>Run</strong> to execute your code.</p>
                    </div>
                ) : (
                    <pre className="sp-output-pre">{renderOutput(output)}</pre>
                )}
            </div>
        </div>
    );
};

export default OutputPanel;
