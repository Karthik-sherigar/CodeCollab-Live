import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, BASE_URL } from '../services/api';
import MetricCard from '../components/MetricCard';
import ContributionChart from '../components/ContributionChart';

const SessionAnalyticsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${BASE_URL}/api/sessions/${id}/analytics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();

                if (!data.success) {
                    setError(data.message);
                    setLoading(false);
                    return;
                }

                setAnalytics(data.analytics);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError('Failed to load analytics');
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [id]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate(-1)} className="btn btn-secondary">
                    Go Back
                </button>
            </div>
        );
    }

    if (!analytics) return null;

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">
                    ← Back
                </button>
                <h1>Session Analytics</h1>
                <p className="session-title">{analytics.sessionTitle}</p>
            </div>

            <div className="metrics-grid">
                <MetricCard
                    icon="⏱️"
                    value={analytics.sessionDuration}
                    label="Session Duration"
                    color="#a855f7"
                />
                <MetricCard
                    icon="✏️"
                    value={analytics.totalEdits}
                    label="Total Edits"
                    color="#ec4899"
                />
                <MetricCard
                    icon="💬"
                    value={analytics.totalComments}
                    label="Total Comments"
                    color="#f59e0b"
                />
                <MetricCard
                    icon="👥"
                    value={analytics.activeCollaborators}
                    label="Active Collaborators"
                    color="#10b981"
                />
            </div>

            {analytics.contributors.length > 0 ? (
                <ContributionChart contributors={analytics.contributors} />
            ) : (
                <div className="no-data">
                    <p>No contribution data available for this session.</p>
                </div>
            )}
        </div>
    );
};

export default SessionAnalyticsPage;
