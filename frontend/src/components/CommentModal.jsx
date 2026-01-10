import { useState } from 'react';

const CommentModal = ({ lineNumber, onSubmit, onClose }) => {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit({ lineNumber, text: text.trim() });
            setText('');
            onClose();
        }
    };

    return (
        <div className="comment-modal-overlay" onClick={onClose}>
            <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="comment-modal-header">
                    <h3>Add Comment on Line {lineNumber}</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Write your comment..."
                        autoFocus
                        rows={4}
                    />

                    <div className="comment-modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={!text.trim()}>
                            Add Comment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentModal;
