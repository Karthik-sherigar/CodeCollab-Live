import mongoose from 'mongoose';

const sessionEventSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['CODE_CHANGE', 'COMMENT_ADD', 'COMMENT_RESOLVE', 'COMMENT_REOPEN', 'COMMENT_DELETE']
    },
    payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// Index for efficient querying
sessionEventSchema.index({ sessionId: 1, timestamp: 1 });

const SessionEvent = mongoose.model('SessionEvent', sessionEventSchema);

export default SessionEvent;
