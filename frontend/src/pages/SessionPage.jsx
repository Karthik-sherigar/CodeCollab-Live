import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI, BASE_URL } from '../services/api';
import SessionHeader from '../components/SessionHeader';
import CodeEditor from '../components/CodeEditor';
import CommentModal from '../components/CommentModal';
import CommentPanel from '../components/CommentPanel';
import CommentSidebar from '../components/CommentSidebar';
import ConfirmModal from '../components/ConfirmModal';
import OutputPanel from '../components/OutputPanel';
import { socket } from '../socket';
import { generateUserColor, injectCursorStyles, removeCursorStyles } from '../utils/colorGenerator';
import GitHubImportModal from '../components/GitHubImportModal';
import GitHubExportModal from '../components/GitHubExportModal';

const SessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authAPI.getCurrentUser();

  const [session, setSession] = useState(null);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [comments, setComments] = useState([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteThreadId, setDeleteThreadId] = useState(null);
  const [showComments, setShowComments] = useState(true);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubStatus, setGithubStatus] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [outputHeight, setOutputHeight] = useState(250);

  const saveTimeoutRef = useRef(null);
  const isRemoteChange = useRef(false);
  const editorRef = useRef(null);

  // Generate user color (deterministic)
  const userColor = useMemo(() => {
    if (!user) return '#6b7280';
    return generateUserColor(user.id);
  }, [user]);

  // Fetch session data
  useEffect(() => {
    const user = authAPI.getCurrentUser();

    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSession = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BASE_URL}/api/sessions/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load session');
        }

        if (data.success) {
          setSession(data.session);
          setCode(data.session.code || '');
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, navigate]);

  // Fetch comments for session
  useEffect(() => {
    if (!session) return;

    const fetchComments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/sessions/${id}/comments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setComments(data.comments);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    };

    const fetchGithubStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/github/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setGithubConnected(data.connected);
          setGithubStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch github status:', err);
      }
    };

    fetchComments();
    fetchGithubStatus();
  }, [id, session]);

  // Connect to socket and join session room
  useEffect(() => {
    if (!session) return;

    console.log('🔌 Connecting socket for session:', id);

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Handler functions
    const handleConnect = () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      socket.emit('join-session', { sessionId: id });
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    };

    const handleUserJoined = ({ userId }) => {
      console.log('👤 User joined:', userId);
    };

    // Register listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('user-joined', handleUserJoined);

    // If already connected, join immediately
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      // Clean up listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('user-joined', handleUserJoined);
      socket.disconnect();
    };
  }, [id, session]); // Removed 'user' from dependencies

  // Listen for code updates from other users
  useEffect(() => {
    socket.on('code-update', (newCode) => {
      console.log('📥 Received code update');
      isRemoteChange.current = true;
      setCode(newCode);
    });

    // Listen for cursor updates
    socket.on('cursor-update', (data) => {
      console.log('👆 Received cursor update:', data);
      const { userId, userName, userColor, position } = data;

      // Inject CSS for this user's cursor color
      injectCursorStyles(userId, userColor);
      console.log('💅 Injected styles for user:', userId, userColor);

      setRemoteCursors(prev => {
        const updated = {
          ...prev,
          [userId]: {
            userName,
            userColor,
            position,
            lastUpdate: Date.now()
          }
        };
        console.log('📍 Updated remoteCursors:', updated);
        return updated;
      });
    });

    // Listen for comment events
    socket.on('comment-added', (data) => {
      console.log('💬 Comment added:', data);
      setComments(prev => [...prev, data]);
    });

    socket.on('reply-added', (data) => {
      console.log('💬 Reply added:', data);
      setComments(prev => prev.map(thread =>
        thread._id === data._id ? data : thread
      ));
    });

    socket.on('comment-resolved', (data) => {
      console.log('✅ Comment resolved:', data);
      setComments(prev => prev.map(thread =>
        thread._id === data._id ? data : thread
      ));
    });

    socket.on('comment-reopened', (data) => {
      console.log('🔄 Comment reopened:', data);
      setComments(prev => prev.map(thread =>
        thread._id === data._id ? data : thread
      ));
    });

    socket.on('comment-deleted', (data) => {
      console.log('🗑️ Comment deleted:', data);
      setComments(prev => prev.filter(thread => thread._id !== data.threadId));
    });

    // Listen for session end
    socket.on('session-ended', () => {
      console.log('🛑 Session ended by another user');
      setSession(prev => ({ ...prev, status: 'ENDED' }));
    });

    return () => {
      socket.off('code-update');
      socket.off('cursor-update');
      socket.off('user-left');
      socket.off('comment-added');
      socket.off('reply-added');
      socket.off('comment-resolved');
      socket.off('session-ended');
      socket.off('comment-reopened');
      socket.off('comment-deleted');
    };
  }, []);

  // Monaco Editor Decorations for Comments
  useEffect(() => {
    if (!editorRef.current || comments.length === 0) return;

    const editor = editorRef.current;
    const decorations = [];

    comments.forEach(thread => {
      const isResolved = thread.status === 'RESOLVED';
      const lineNumber = thread.startLine;

      // Glyph margin decoration (comment icon)
      decorations.push({
        range: new window.monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: isResolved ? 'comment-glyph-resolved' : 'comment-glyph-open',
          glyphMarginHoverMessage: {
            value: `💬 ${thread.comments.length} comment(s) - Click to view`
          }
        }
      });

      // Line highlight decoration
      decorations.push({
        range: new window.monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: isResolved ? 'comment-line-resolved' : 'comment-line-open',
          hoverMessage: {
            value: `**${thread.createdBy.name}**: ${thread.comments[0].text}`
          }
        }
      });
    });

    // Apply decorations
    const decorationIds = editor.deltaDecorations([], decorations);

    // Cleanup
    return () => {
      if (editor && decorationIds) {
        editor.deltaDecorations(decorationIds, []);
      }
    };
  }, [comments]);

  // Auto-save code
  useEffect(() => {
    if (!session || !code || session.status !== 'ACTIVE') return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        const response = await fetch(`${BASE_URL}/api/sessions/${id}/code`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Failed to save code:', data.message);
        }
      } catch (err) {
        console.error('Save error:', err);
      } finally {
        setSaving(false);
      }
    }, 2000); // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [code, id, session]);

  const handleCodeChange = (newCode) => {
    // If this is a remote change, don't emit
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }

    setCode(newCode);

    // Emit to other users in real-time
    if (isConnected) {
      socket.emit('code-change', {
        sessionId: id,
        code: newCode
      });
    }
  };

  const handleCursorChange = (position) => {
    if (!user) {
      console.warn('⚠️ Cannot emit cursor: user is null');
      return;
    }

    // Check socket.connected directly (more reliable than state)
    if (!socket.connected) {
      console.warn('⚠️ Cannot emit cursor: socket not connected');
      return;
    }

    console.log('🖱️ Emitting cursor position:', {
      sessionId: id,
      userId: user.id,
      userName: user.name,
      userColor: userColor,
      position
    });

    socket.emit('cursor-move', {
      sessionId: id,
      userId: user.id,
      userName: user.name,
      userColor: userColor,
      position: position
    });
  };

  // Comment handlers
  const handleAddComment = async ({ lineNumber, text }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/sessions/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startLine: lineNumber,
          text
        })
      });

      const data = await response.json();
      if (data.success) {
        // Emit socket event for real-time sync
        socket.emit('add-comment', data.comment);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleReply = async (threadId, text) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/sessions/${id}/comments/${threadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      if (data.success) {
        socket.emit('add-reply', data.comment);
      }
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleResolve = async (threadId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/sessions/${id}/comments/${threadId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        socket.emit('resolve-comment', data.comment);
      }
    } catch (err) {
      console.error('Error resolving comment:', err);
    }
  };

  const handleReopen = async (threadId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/sessions/${id}/comments/${threadId}/reopen`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        socket.emit('reopen-comment', data.comment);
      }
    } catch (err) {
      console.error('Error reopening comment:', err);
    }
  };

  const handleJumpToLine = (lineNumber) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  };

  const openCommentModal = (lineNumber = null) => {
    if (lineNumber) {
      setSelectedLine(lineNumber);
    } else if (editorRef.current) {
      // Get current cursor position from editor
      const position = editorRef.current.getPosition();
      setSelectedLine(position ? position.lineNumber : 1);
    } else {
      setSelectedLine(1);
    }
    setShowCommentModal(true);
  };

  const handleDeleteClick = (threadId) => {
    setDeleteThreadId(threadId);
    setShowConfirmDelete(true);
  };

  // Handle end session (show confirmation)
  const handleEndSession = () => {
    setShowConfirmEnd(true);
  };

  // Actual end session after confirmation
  const handleConfirmEnd = async () => {
    try {
      setShowConfirmEnd(false); // Close modal
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/sessions/${id}/end`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Update local session state
        setSession(prev => ({ ...prev, status: 'ENDED' }));
        // Emit socket event
        socket.emit('session-ended', { sessionId: id });
      } else {
        alert(data.message || 'Failed to end session');
      }
    } catch (err) {
      console.error('Error ending session:', err);
      alert('Failed to end session');
    }
  };

  // Handle playback
  const handlePlayback = () => {
    navigate(`/session/${id}/playback`);
  };

  const handleImportCode = (newCode) => {
    setCode(newCode);
    // Notify others via socket
    socket.emit('code-change', {
      sessionId: id,
      code: newCode,
      senderId: user.id
    });
  };

  const handleExportComplete = (commitUrl) => {
    alert(`Successfully exported to GitHub!\nCommit: ${commitUrl}`);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/sessions/${id}/comments/${deleteThreadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        socket.emit('delete-comment', { sessionId: id, threadId: deleteThreadId });
        setShowConfirmDelete(false);
        setDeleteThreadId(null);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Handle code execution
  const handleRunCode = async () => {
    setShowOutput(true);
    setIsRunning(true);
    setOutput('Running code...\n');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          language: session.language,
          filename: session.filename
        })
      });

      const data = await response.json();

      if (data.success) {
        setOutput(data.output || 'Code executed successfully (no output)');
      } else {
        setOutput(`Error: ${data.message}\n${data.error || ''}`);
      }
    } catch (error) {
      setOutput(`Execution error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="session-page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-page">
        <div className="error-container">
          <div className="message message-error">{error}</div>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }


  if (!session) return null;

  return (
    <div className="session-page">
      <SessionHeader
        session={session}
        saving={saving}
        onBack={() => navigate(-1)}
        onToggleComments={() => setShowComments(true)}
        onEndSession={handleEndSession}
        onPlayback={handlePlayback}
        currentUserId={user?.id}
        githubConnected={githubConnected}
        onImportGitHub={() => setShowImportModal(true)}
        onExportGitHub={() => setShowExportModal(true)}
        onRunCode={handleRunCode}
      />

      <div className={`session-content-with-comments ${showComments ? 'show-comments' : ''}`}>
        {showComments && (
          <CommentPanel
            comments={comments}
            onJumpToLine={handleJumpToLine}
            onResolve={handleResolve}
            onReopen={handleReopen}
            onReply={handleReply}
            onDelete={handleDeleteClick}
            onAddComment={() => openCommentModal()}
            onClose={() => setShowComments(false)}
            currentUserId={user?.id?.toString()}
            sessionOwnerId={session?.created_by?.toString()}
          />
        )}


        <div className="editor-section">
          <CodeEditor
            language={session.language}
            code={code}
            onChange={handleCodeChange}
            onCursorChange={handleCursorChange}
            remoteCursors={remoteCursors}
            readOnly={session.status === 'ENDED'}
            onEditorMount={(editor) => { editorRef.current = editor; }}
            glyphMargin={true}
          />
        </div>
      </div>

      {showCommentModal && (
        <CommentModal
          lineNumber={selectedLine}
          onSubmit={handleAddComment}
          onClose={() => setShowCommentModal(false)}
        />
      )}

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setDeleteThreadId(null);
        }}
        confirmText="Delete"
        type="danger"
      />

      <ConfirmModal
        isOpen={showConfirmEnd}
        onClose={() => setShowConfirmEnd(false)}
        onConfirm={handleConfirmEnd}
        title="End Collaboration Session"
        message="Are you sure you want to end this session? Once ended, no more code changes can be made, but you can always view the playback and analytics."
        confirmText="End Session"
        type="danger"
      />

      <GitHubImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCode}
      />

      <GitHubExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportComplete}
        currentContent={code}
        sessionTitle={session.title}
      />

      {showOutput && (
        <OutputPanel
          output={output}
          isRunning={isRunning}
          onClear={() => setOutput('')}
          onClose={() => setShowOutput(false)}
          height={outputHeight}
          onResize={setOutputHeight}
        />
      )}

      {/* Mobile Floating Action Buttons */}
      <div className="mobile-fab-stack">
        {session.status === 'ACTIVE' && (
          <button
            onClick={handleRunCode}
            className="mobile-fab mobile-fab-run"
            title="Run code"
          >
            ▶
          </button>
        )}
        {session.status === 'ACTIVE' && session.creator_id === user?.id && (
          <button
            onClick={() => setShowConfirmEnd(true)}
            className="mobile-fab mobile-fab-end"
            title="End session"
          >
            ⏹
          </button>
        )}
      </div>
    </div>
  );
};

export default SessionPage;

