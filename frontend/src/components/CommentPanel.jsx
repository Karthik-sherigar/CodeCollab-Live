import { useState } from 'react';

const CommentPanel = ({
    comments,
    onJumpToLine,
    onResolve,
    onReopen,
    onReply,
    onDelete,
    onAddComment,
    onClose,
    currentUserId,
    sessionOwnerId
}) => {
    const [filter, setFilter] = useState('ALL');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const filteredComments = comments.filter(thread => {
        if (filter === 'OPEN') return thread.status === 'OPEN';
        if (filter === 'RESOLVED') return thread.status === 'RESOLVED';
        return true;
    });

    const handleReply = (threadId) => {
        if (replyText.trim()) {
            onReply(threadId, replyText.trim());
            setReplyText('');
            setReplyingTo(null);
        }
    };

    return (
        <div className="comment-panel">
            <div className="comment-panel-header">
                <div className="comment-panel-title">
                    <h3>💬 Comments ({comments.length})</h3>
                    {onClose && (
                        <button className="close-comment-panel-btn" onClick={onClose} title="Close comments">
                            ✕
                        </button>
                    )}
                </div>
                <div className="comment-panel-actions">
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="ALL">All</option>
                        <option value="OPEN">Open</option>
                        <option value="RESOLVED">Resolved</option>
                    </select>
                    {onAddComment && (
                        <button className="add-comment-header-btn" onClick={onAddComment} title="Add new comment">
                            + Add
                        </button>
                    )}
                </div>
            </div>

            <div className="comment-list">
                {filteredComments.length === 0 ? (
                    <div className="no-comments">
                        <p>No comments yet</p>
                        <span>Select code and add a comment to start</span>
                    </div>
                ) : (
                    filteredComments.map(thread => (
                        <div
                            key={thread._id}
                            className={`comment-thread ${thread.status.toLowerCase()}`}
                        >
                            <div className="comment-thread-header">
                                <button
                                    className="line-number-btn"
                                    onClick={() => onJumpToLine(thread.startLine)}
                                    title="Jump to line"
                                >
                                    Line {thread.startLine}
                                    {thread.endLine && thread.endLine !== thread.startLine && `-${thread.endLine}`}
                                </button>

                                <div className="thread-actions">
                                    {thread.status === 'OPEN' ? (
                                        <button
                                            className="resolve-btn"
                                            onClick={() => onResolve(thread._id)}
                                            title="Resolve thread"
                                        >
                                            ✓
                                        </button>
                                    ) : (
                                        <button
                                            className="reopen-btn"
                                            onClick={() => onReopen(thread._id)}
                                            title="Reopen thread"
                                        >
                                            ↻
                                        </button>
                                    )}

                                    {/* Show delete button if user is comment creator or session owner */}
                                    {(thread.createdBy.userId === currentUserId || sessionOwnerId === currentUserId) && (
                                        <button
                                            className="delete-btn"
                                            onClick={() => onDelete(thread._id)}
                                            title="Delete comment"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="comment-messages">
                                {thread.comments.map((comment, idx) => (
                                    <div key={comment.commentId} className="comment-message">
                                        <div className="comment-author">
                                            <strong>{comment.authorName}</strong>
                                            {idx === 0 && <span className="badge">OP</span>}
                                        </div>
                                        <div className="comment-text">{comment.text}</div>
                                        <div className="comment-time">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {thread.status === 'OPEN' && (
                                <div className="reply-section">
                                    {replyingTo === thread._id ? (
                                        <div className="reply-form">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write a reply..."
                                                rows={2}
                                                autoFocus
                                            />
                                            <div className="reply-actions">
                                                <button onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyText('');
                                                }}>
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReply(thread._id)}
                                                    disabled={!replyText.trim()}
                                                    className="btn-primary"
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            className="reply-btn"
                                            onClick={() => setReplyingTo(thread._id)}
                                        >
                                            💬 Reply
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentPanel;
