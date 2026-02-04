import { useState, useEffect } from 'react';
import { BASE_URL } from '../services/api';

const GitHubExportModal = ({ isOpen, onClose, onExport, currentContent, sessionTitle }) => {
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [branch, setBranch] = useState('main');
    const [filePath, setFilePath] = useState('');
    const [message, setMessage] = useState(`Collab Session: ${sessionTitle || 'Update'}`);

    useEffect(() => {
        if (isOpen) {
            fetchRepos();
        }
    }, [isOpen]);

    const fetchRepos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/github/repos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setRepos(data.repos.filter(r => !r.private || true)); // Show all for now
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch repositories');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!selectedRepo || !filePath || !message) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/github/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    owner: selectedRepo.owner,
                    repo: selectedRepo.name,
                    branch,
                    filePath,
                    content: currentContent,
                    message
                })
            });

            const data = await response.json();
            if (data.success) {
                onExport(data.commitUrl);
                onClose();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Export failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content github-modal">
                <div className="modal-header">
                    <h2>Export to GitHub</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {error && <div className="message message-error">{error}</div>}

                    <div className="form-group">
                        <label>Select Repository</label>
                        <select
                            className="form-input"
                            onChange={(e) => {
                                const repo = repos.find(r => r.id === parseInt(e.target.value));
                                setSelectedRepo(repo);
                                setBranch(repo?.defaultBranch || 'main');
                            }}
                        >
                            <option value="">Choose a repo...</option>
                            {repos.map(repo => (
                                <option key={repo.id} value={repo.id}>{repo.fullName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label>Branch</label>
                            <input
                                type="text"
                                className="form-input"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                placeholder="main"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>File Path</label>
                        <input
                            type="text"
                            className="form-input"
                            value={filePath}
                            onChange={(e) => setFilePath(e.target.value)}
                            placeholder="src/index.js"
                        />
                    </div>

                    <div className="form-group">
                        <label>Commit Message</label>
                        <textarea
                            className="form-input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows="2"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={loading || !selectedRepo || !filePath || !message}
                    >
                        {loading ? 'Exporting...' : 'Push to GitHub'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GitHubExportModal;
