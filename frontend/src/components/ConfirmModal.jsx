const ConfirmModal = ({ isOpen, title, message, onConfirm, onClose, confirmText = 'Confirm', type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="comment-modal-overlay" onClick={onClose}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-modal-header">
                    <h3>{title || '⚠️ Confirm Action'}</h3>
                </div>

                <div className="confirm-modal-body">
                    <p>{message}</p>
                </div>

                <div className="confirm-modal-actions">
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={type === 'danger' ? 'btn-danger' : 'btn-primary'}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
