import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, BASE_URL } from '../services/api';

const ProfilePage = () => {
    const navigate = useNavigate();
    const user = authAPI.getCurrentUser();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });

    useEffect(() => {
        if (user) {
            setProfile(user);
            setFormData({
                name: user.name || '',
                email: user.email || ''
            });
            setLoading(false);
        }
    }, [user]);

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                setProfile(data.user);
                setIsEditing(false);
                // Update local storage
                localStorage.setItem('user', JSON.stringify(data.user));
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="welcome-header">
                <h1 className="welcome-title">Profile</h1>
                <p className="welcome-subtitle">Manage your account settings</p>
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="workspace-card" style={{ padding: 'var(--spacing-xl)' }}>
                    {/* Profile Avatar */}
                    <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            color: 'white',
                            margin: '0 auto var(--spacing-md)'
                        }}>
                            {profile?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {profile?.name}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{profile?.email}</p>
                    </div>

                    {/* Profile Information */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
                            Account Information
                        </h3>

                        {isEditing ? (
                            <div>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                                    <button className="btn btn-primary" onClick={handleSave}>
                                        Save Changes
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                name: profile.name || '',
                                                email: profile.email || ''
                                            });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        Name
                                    </p>
                                    <p style={{ color: 'var(--text-primary)' }}>{profile?.name}</p>
                                </div>
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        Email
                                    </p>
                                    <p style={{ color: 'var(--text-primary)' }}>{profile?.email}</p>
                                </div>
                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        Member Since
                                    </p>
                                    <p style={{ color: 'var(--text-primary)' }}>
                                        {profile?.created_at
                                            ? new Date(profile.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : 'Not available'
                                        }
                                    </p>
                                </div>
                                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </button>
                            </div>
                        )}
                    </div>

                    {/* GitHub Connection Status */}
                    {profile?.github_id && (
                        <div style={{
                            padding: 'var(--spacing-md)',
                            background: 'var(--bg-hover)',
                            borderRadius: 'var(--radius-md)',
                            marginTop: 'var(--spacing-lg)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <span style={{ fontSize: '1.5rem' }}>✓</span>
                                <div>
                                    <p style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                                        GitHub Connected
                                    </p>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        @{profile.github_username}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
