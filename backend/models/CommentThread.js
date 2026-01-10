import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    commentId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    authorId: {
        type: String,
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const commentThreadSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    startLine: {
        type: Number,
        required: true
    },
    endLine: {
        type: Number
    },
    createdBy: {
        userId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    comments: [commentSchema],
    status: {
        type: String,
        enum: ['OPEN', 'RESOLVED'],
        default: 'OPEN'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
commentThreadSchema.index({ sessionId: 1, startLine: 1 });
commentThreadSchema.index({ status: 1 });

export default mongoose.model('CommentThread', commentThreadSchema);

