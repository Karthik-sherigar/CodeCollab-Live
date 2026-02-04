import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspacePage from './pages/WorkspacePage';
import SessionPage from './pages/SessionPage';
import PlaybackPage from './pages/PlaybackPage';
import SessionAnalyticsPage from './pages/SessionAnalyticsPage';
import SessionsPage from './pages/SessionsPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingDock from './components/FloatingDock';
import { authAPI } from './services/api';

// Google Client ID - will be configured in .env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

function AppContent() {
    const location = useLocation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const isAuthenticated = authAPI.isAuthenticated();
    const hideDock = ['/login', '/register'].includes(location.pathname);

    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard
                                showCreateModal={showCreateModal}
                                setShowCreateModal={setShowCreateModal}
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspace/:id"
                    element={
                        <ProtectedRoute>
                            <WorkspacePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/session/:id"
                    element={
                        <ProtectedRoute>
                            <SessionPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/session/:id/playback"
                    element={
                        <ProtectedRoute>
                            <PlaybackPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/session/:id/analytics"
                    element={
                        <ProtectedRoute>
                            <SessionAnalyticsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sessions"
                    element={
                        <ProtectedRoute>
                            <SessionsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>

            {isAuthenticated && !hideDock && (
                <FloatingDock onCreateWorkspace={() => setShowCreateModal(true)} />
            )}
        </>
    );
}

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </GoogleOAuthProvider>
    );
}

export default App;
