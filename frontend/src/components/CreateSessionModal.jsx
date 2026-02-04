import { useState } from 'react';

const CreateSessionModal = ({ isOpen, onClose, onCreateSession }) => {
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [filename, setFilename] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const languages = [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'cpp', label: 'C++' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
        { value: 'typescript', label: 'TypeScript' }
    ];

    const getFileExtension = (lang) => {
        const extensions = {
            javascript: '.js',
            python: '.py',
            java: '.java',
            cpp: '.cpp',
            go: '.go',
            rust: '.rs',
            typescript: '.ts'
        };
        return extensions[lang] || '.txt';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Session title is required');
            return;
        }

        if (!filename.trim()) {
            setError('Filename is required');
            return;
        }

        // Auto-add extension if not present
        const extension = getFileExtension(language);
        let finalFilename = filename.trim();
        if (!finalFilename.endsWith(extension)) {
            finalFilename += extension;
        }

        setLoading(true);
        try {
            await onCreateSession(title.trim(), language, finalFilename);
            setTitle('');
            setLanguage('javascript');
            setFilename('');
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setTitle('');
            setLanguage('javascript');
            setFilename('');
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Create Coding Session</h2>
                    <button
                        className="modal-close"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="message message-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="session-title" className="form-label">
                            Session Title *
                        </label>
                        <input
                            type="text"
                            id="session-title"
                            className="form-input"
                            placeholder="e.g., Auth Refactor, Bug Fix Session"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="language" className="form-label">
                            Programming Language
                        </label>
                        <select
                            id="language"
                            className="form-input"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            disabled={loading}
                        >
                            {languages.map((lang) => (
                                <option key={lang.value} value={lang.value}>
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="filename" className="form-label">
                            Filename *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                id="filename"
                                className="form-input"
                                placeholder={`e.g., main, solution, index`}
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <span style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#888',
                                fontSize: '14px',
                                pointerEvents: 'none'
                            }}>
                                {getFileExtension(language)}
                            </span>
                        </div>
                        <small style={{ color: '#888', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            Extension will be added automatically
                        </small>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !title.trim() || !filename.trim()}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating...
                                </>
                            ) : (
                                'Create Session'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSessionModal;
