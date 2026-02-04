import { useState, useEffect, useRef } from 'react';

const SessionHeader = ({
    session,
    saving,
    onBack,
    onToggleComments,
    onEndSession,
    onPlayback,
    currentUserId,
    githubConnected,
    onImportGitHub,
    onExportGitHub,
    onRunCode
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    if (!session) return null;

    const getLanguageColor = (lang) => {
        const colors = {
            javascript: '#f7a01eff',
            python: '#3776ab',
            java: '#007396',
            cpp: '#00599c',
            go: '#00add8',
            rust: '#000000',
            typescript: '#3178c6'
        };
        return colors[lang?.toLowerCase()] || '#6b7280';
    };

    const getStatusClass = (status) => {
        return status === 'ACTIVE' ? 'status-badge status-active' : 'status-badge status-ended';
    };

    return (
        <div className="session-header">
            <div className="hamburger-menu" ref={menuRef}>
                <button
                    className="hamburger-btn"
                    onClick={() => setShowMenu(!showMenu)}
                    title="Menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {showMenu && (
                    <div className="hamburger-dropdown">
                        <button
                            className="dropdown-item"
                            onClick={() => {
                                onToggleComments();
                                setShowMenu(false);
                            }}
                        >
                            <span className="dropdown-icon">💬</span>
                            <span>Comments</span>
                        </button>

                        {githubConnected && session.status === 'ACTIVE' && (
                            <>
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        onImportGitHub();
                                        setShowMenu(false);
                                    }}
                                >
                                    <span className="dropdown-icon">⬇️</span>
                                    <span>Import from GitHub</span>
                                </button>
                                <button
                                    className="dropdown-item"
                                    onClick={() => {
                                        onExportGitHub();
                                        setShowMenu(false);
                                    }}
                                >
                                    <span className="dropdown-icon">⬆️</span>
                                    <span>Export to GitHub</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <button onClick={onBack} className="btn btn-secondary btn-sm back-btn" style={{ width: '10%' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>

            <h1 className="session-header-title" style={{ textAlign: 'center', marginLeft: '0' }}>{session.title}</h1>

            <span
                className="language-badge"
                style={{ backgroundColor: getLanguageColor(session.language) }}
            >
                {session.language}
            </span>

            <span className={getStatusClass(session.status)}>
                {session.status}
            </span>

            {/* Run button - visible when session is ACTIVE */}
            {session.status === 'ACTIVE' && onRunCode && (
                <button
                    onClick={onRunCode}
                    className="btn btn-success btn-sm"
                    style={{ marginLeft: '10px' }}
                    title="Run code"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '4px' }}>
                        <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
                    </svg>
                    Run
                </button>
            )}

            {saving && (
                <div className="saving-indicator">
                    <span className="spinner-small"></span>
                    Saving...
                </div>
            )}

            {/* End Session button - visible to owner when session is ACTIVE */}
            {session.status === 'ACTIVE' && session.creator_id === currentUserId && onEndSession && (
                <button
                    onClick={onEndSession}
                    className="btn btn-danger btn-sm"
                    style={{ marginLeft: '10px' }}
                >
                    End Session
                </button>
            )}

            {/* Playback button - visible to all when session is ENDED */}
            {session.status === 'ENDED' && onPlayback && (
                <button
                    onClick={onPlayback}
                    className="btn btn-primary btn-sm"
                    style={{ marginLeft: '10px' }}
                >
                    ▶ Playback
                </button>
            )}
        </div>
    );
};

export default SessionHeader;
