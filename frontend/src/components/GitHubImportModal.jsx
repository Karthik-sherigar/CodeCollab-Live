import { useState, useEffect } from 'react';
import { BASE_URL } from '../services/api';


const GitHubImportModal = ({ isOpen, onClose, onImport }) => {
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [branch, setBranch] = useState('main');
    const [filePath, setFilePath] = useState('');

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
                setRepos(data.repos);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch repositories');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedRepo || !filePath) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/github/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    owner: selectedRepo.owner,
                    repo: selectedRepo.name,
                    branch,
                    filePath
                })
            });

            const data = await response.json();
            if (data.success) {
                onImport(data.content);
                onClose();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Import failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content github-modal">
                <div className="modal-header">
                    <h2>Import from GitHub</h2>
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
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleImport}
                        disabled={loading || !selectedRepo || !filePath}
                    >
                        {loading ? 'Importing...' : 'Import Code'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GitHubImportModal;
