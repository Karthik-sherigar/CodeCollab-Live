const CommentSidebar = ({ onAddComment }) => {
    return (
        <div className="comment-sidebar">
            <div className="sidebar-section">
                <h3>💬 Comments</h3>
                <button
                    className="sidebar-add-comment-btn"
                    onClick={onAddComment}
                    title="Add a new comment"
                >
                    <span className="icon">+</span>
                    <span>Add Comment</span>
                </button>
            </div>
        </div>
    );
};

export default CommentSidebar;
