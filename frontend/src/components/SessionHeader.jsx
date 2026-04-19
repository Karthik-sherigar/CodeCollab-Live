import { useState, useEffect, useRef } from 'react';

const LANG_COLORS = {
    javascript: '#f59e0b', typescript: '#3b82f6', python:  '#10b981',
    java:       '#f97316', cpp:        '#8b5cf6', go:      '#06b6d4',
    rust:       '#ef4444',
};

const getLangColor = (lang = '') => LANG_COLORS[(lang || '').toLowerCase()] || '#6b7280';

const SessionHeader = ({
    session, saving, onBack, onToggleComments, onEndSession,
    onPlayback, currentUserId, githubConnected,
    onImportGitHub, onExportGitHub, onRunCode
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    if (!session) return null;

    const isActive = session.status === 'ACTIVE';
    const isOwner = session.creator_id === currentUserId;
    const langColor = getLangColor(session.language);

    return (
        <header className="sp-header">
            {/* Left: back + title */}
            <div className="sp-header-left">
                <button onClick={onBack} className="sp-hdr-btn sp-hdr-btn--back" title="Back to workspace">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <span className="sp-hdr-back-label">Back</span>
                </button>

                <div className="sp-header-identity">
                    <h1 className="sp-header-title">{session.title}</h1>
                    <div className="sp-header-chips">
                        <span className="sp-lang-chip" style={{ background: `${langColor}18`, color: langColor, borderColor: `${langColor}44` }}>
                            <span className="sp-lang-dot" style={{ background: langColor }} />
                            {session.language?.toUpperCase()}
                        </span>
                        <span className={`sp-status-chip ${isActive ? 'sp-status-chip--active' : 'sp-status-chip--ended'}`}>
                            {isActive ? '● Live' : '■ Ended'}
                        </span>
                        {saving && (
                            <span className="sp-saving-chip">
                                <span className="sp-saving-dot" />
                                Saving…
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: action buttons */}
            <div className="sp-header-right">
                {/* Comments toggle */}
                <button
                    className="sp-hdr-btn sp-hdr-btn--ghost"
                    onClick={onToggleComments}
                    title="Toggle comments"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className="sp-hdr-btn-label">Comments</span>
                </button>

                {/* Run button */}
                {isActive && onRunCode && (
                    <button className="sp-hdr-btn sp-hdr-btn--run" onClick={onRunCode} title="Run code">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 3l14 9-14 9V3z"/>
                        </svg>
                        <span className="sp-hdr-btn-label">Run</span>
                    </button>
                )}

                {/* Playback (ended sessions) */}
                {!isActive && onPlayback && (
                    <button className="sp-hdr-btn sp-hdr-btn--playback" onClick={onPlayback} title="Watch playback">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 3l14 9-14 9V3z"/>
                        </svg>
                        <span className="sp-hdr-btn-label">Playback</span>
                    </button>
                )}

                {/* End Session */}
                {isActive && isOwner && onEndSession && (
                    <button className="sp-hdr-btn sp-hdr-btn--end" onClick={onEndSession} title="End session">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                        </svg>
                        <span className="sp-hdr-btn-label">End Session</span>
                    </button>
                )}

                {/* ⋮ More menu */}
                <div className="sp-menu-wrap" ref={menuRef}>
                    <button
                        className="sp-hdr-btn sp-hdr-btn--ghost sp-hdr-btn--icon"
                        onClick={() => setShowMenu(v => !v)}
                        title="More options"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                        </svg>
                    </button>

                    {showMenu && (
                        <div className="sp-dropdown">
                            {githubConnected && isActive && (
                                <>
                                    <button className="sp-dropdown-item" onClick={() => { onImportGitHub(); setShowMenu(false); }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M12 5v14M5 12l7 7 7-7"/>
                                        </svg>
                                        Import from GitHub
                                    </button>
                                    <button className="sp-dropdown-item" onClick={() => { onExportGitHub(); setShowMenu(false); }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M12 19V5M5 12l7-7 7 7"/>
                                        </svg>
                                        Export to GitHub
                                    </button>
                                    <div className="sp-dropdown-divider"/>
                                </>
                            )}
                            <button className="sp-dropdown-item" onClick={() => { onToggleComments(); setShowMenu(false); }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                Comments
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default SessionHeader;
