import { useState } from 'react';

const CreateWorkspaceModal = ({ isOpen, onClose, onCreate }) => {
    const [workspaceName, setWorkspaceName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (workspaceName.trim().length < 3) {
            setError('Workspace name must be at least 3 characters');
            return;
        }

        setLoading(true);
        try {
            await onCreate(workspaceName.trim());
            setWorkspaceName('');
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create workspace');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setWorkspaceName('');
            setError('');
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !loading) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose} onKeyDown={handleKeyDown}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Create New Workspace</h2>
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
                        <label htmlFor="workspaceName" className="form-label">
                            Workspace Name
                        </label>
                        <input
                            type="text"
                            id="workspaceName"
                            className="form-input"
                            placeholder="e.g., Team Project, Personal Workspace"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            disabled={loading}
                            autoFocus
                            required
                        />
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
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating...
                                </>
                            ) : (
                                'Create Workspace'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkspaceModal;
