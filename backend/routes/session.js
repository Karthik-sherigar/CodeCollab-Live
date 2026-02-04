import express from 'express';
import { getDB } from '../config/mongodb.js';
import pool from '../config/db.js';
import CommentThread from '../models/CommentThread.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/sessions/:id - Get session details with code
router.get('/:id', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.id;

    // Get session from MySQL
    const [sessions] = await pool.query(
      `SELECT 
                s.id,
                s.workspace_id,
                s.title,
                s.language,
                s.filename,
                s.status,
                s.created_at,
                s.updated_at,
                u.id as creator_id,
                u.name as creator_name
            FROM sessions s
            INNER JOIN users u ON s.created_by = u.id
            WHERE s.id = ?`,
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];

    // Check if user is a member of the workspace
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [session.workspace_id, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this workspace.'
      });
    }

    // Get code from MongoDB
    const db = getDB();
    const codeSnapshot = await db.collection('code_snapshots').findOne({
      sessionId: sessionId
    });

    // Add code to session object
    session.code = codeSnapshot?.code || `// Start coding in ${session.language}\n\n`;

    res.json({
      success: true,
      session: session
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/sessions/:id/code - Save session code
router.put('/:id/code', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.id;
    const { code } = req.body;

    if (code === undefined || code === null) {
      return res.status(400).json({
        success: false,
        message: 'Code is required'
      });
    }

    // Get session from MySQL
    const [sessions] = await pool.query(
      'SELECT workspace_id, status FROM sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];

    // Check if session is active
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot save code to an ended session'
      });
    }

    // Check if user is a member of the workspace
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [session.workspace_id, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this workspace.'
      });
    }

    // Save code to MongoDB
    const db = getDB();
    await db.collection('code_snapshots').updateOne(
      { sessionId: sessionId },
      {
        $set: {
          code: code,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Code saved successfully'
    });

  } catch (error) {
    console.error('Save code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/sessions/:id/comments - Get all comments for a session
router.get('/:id/comments', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.id;

    // Verify session exists and user has access
    const [sessions] = await pool.query(
      'SELECT workspace_id FROM sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check workspace membership
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [sessions[0].workspace_id, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const comments = await CommentThread.find({ sessionId: sessionId.toString() });
    res.json({
      success: true,
      comments
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST /api/sessions/:id/comments - Create new comment thread
router.post('/:id/comments', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.id;
    const { startLine, endLine, text } = req.body;

    if (!text || !startLine) {
      return res.status(400).json({
        success: false,
        message: 'Text and startLine are required'
      });
    }

    // Verify session exists and user has access
    const [sessions] = await pool.query(
      'SELECT workspace_id FROM sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check workspace membership
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [sessions[0].workspace_id, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const commentThread = new CommentThread({
      sessionId: sessionId.toString(),
      startLine,
      endLine: endLine || startLine,
      createdBy: {
        userId: userId.toString(),
        name: req.user.name
      },
      comments: [{
        commentId: uuidv4(),
        text,
        authorId: userId.toString(),
        authorName: req.user.name
      }],
      status: 'OPEN'
    });

    await commentThread.save();

    res.status(201).json({
      success: true,
      comment: commentThread
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PUT /api/sessions/:id/comments/:threadId - Add reply to comment thread
router.put('/:id/comments/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const thread = await CommentThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Comment thread not found'
      });
    }

    thread.comments.push({
      commentId: uuidv4(),
      text,
      authorId: userId.toString(),
      authorName: req.user.name
    });

    await thread.save();

    res.json({
      success: true,
      comment: thread
    });

  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PATCH /api/sessions/:id/comments/:threadId/resolve - Resolve comment thread
router.patch('/:id/comments/:threadId/resolve', async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await CommentThread.findByIdAndUpdate(
      threadId,
      { status: 'RESOLVED' },
      { new: true }
    );

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Comment thread not found'
      });
    }

    res.json({
      success: true,
      comment: thread
    });

  } catch (error) {
    console.error('Resolve comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// PATCH /api/sessions/:id/comments/:threadId/reopen - Reopen comment thread
router.patch('/:id/comments/:threadId/reopen', async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await CommentThread.findByIdAndUpdate(
      threadId,
      { status: 'OPEN' },
      { new: true }
    );

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Comment thread not found'
      });
    }

    res.json({
      success: true,
      comment: thread
    });

  } catch (error) {
    console.error('Reopen comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// DELETE /api/sessions/:id/comments/:threadId - Delete comment thread
router.delete('/:id/comments/:threadId', async (req, res) => {
  try {
    const { id, threadId } = req.params;
    const userId = req.user.id;

    // Get the comment thread
    const thread = await CommentThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Comment thread not found'
      });
    }

    // Get session to check ownership
    const [sessions] = await pool.query(
      'SELECT created_by FROM sessions WHERE id = ?',
      [id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const sessionOwnerId = sessions[0].created_by;

    // Check permissions: only comment creator or session owner can delete
    if (thread.createdBy.userId !== userId.toString() && sessionOwnerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment'
      });
    }

    // Delete the thread
    await CommentThread.findByIdAndDelete(threadId);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
      threadId
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;

// PATCH /api/sessions/:id/end - End session (owner only)
router.patch('/:id/end', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.id;

    // Get session
    const [sessions] = await pool.query(
      'SELECT created_by, status FROM sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];

    // Check if user is the owner
    if (session.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the session owner can end the session'
      });
    }

    // Check if already ended
    if (session.status === 'ENDED') {
      return res.status(400).json({
        success: false,
        message: 'Session is already ended'
      });
    }

    // Update session status
    await pool.query(
      'UPDATE sessions SET status = ?, ended_at = NOW() WHERE id = ?',
      ['ENDED', sessionId]
    );

    // Get updated session
    const [updatedSessions] = await pool.query(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );

    res.json({
      success: true,
      message: 'Session ended successfully',
      session: updatedSessions[0]
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session'
    });
  }
});

// GET /api/sessions/:id/events - Get session events for playback
router.get('/:id/events', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    // Get session
    const [sessions] = await pool.query(
      'SELECT workspace_id, started_at FROM sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];

    // Check if user is a member of the workspace
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [session.workspace_id, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Import SessionEvent model
    const SessionEvent = (await import('../models/SessionEvent.js')).default;

    // Fetch events from MongoDB
    const events = await SessionEvent.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    // Calculate relative timestamps
    const startTime = new Date(session.started_at).getTime();
    const eventsWithRelativeTime = events.map(event => ({
      ...event,
      relativeTime: new Date(event.timestamp).getTime() - startTime
    }));

    res.json({
      success: true,
      events: eventsWithRelativeTime
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});


// DELETE /api/sessions/:id - Delete session (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.user.id;

    // Get session
    const [sessions] = await pool.query(
      'SELECT created_by FROM sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];

    // Check if user is the owner
    if (session.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the session owner can delete the session'
      });
    }

    // Import models
    const CommentThread = (await import('../models/CommentThread.js')).default;
    const SessionEvent = (await import('../models/SessionEvent.js')).default;

    // Delete from MongoDB
    await CommentThread.deleteMany({ sessionId: sessionId.toString() });
    await SessionEvent.deleteMany({ sessionId: sessionId.toString() });

    // Delete session code from MongoDB
    const db = getDB();
    await db.collection('session_code').deleteOne({ sessionId: sessionId.toString() });

    // Delete from MySQL
    await pool.query('DELETE FROM sessions WHERE id = ?', [sessionId]);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session'
    });
  }
});


// GET /api/sessions/:id/analytics - Get session analytics (members only, ended sessions)
router.get('/:id/analytics', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;

    // Get session
    const [sessions] = await pool.query(
      `SELECT s.*, s.started_at, s.ended_at, s.status, s.workspace_id
       FROM sessions s
       WHERE s.id = ?`,
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const session = sessions[0];

    // Check if user is a member of the workspace
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [session.workspace_id, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a workspace member to view analytics.'
      });
    }

    // Check if session is ended
    if (session.status !== 'ENDED') {
      return res.status(400).json({
        success: false,
        message: 'Analytics are only available for ended sessions'
      });
    }

    // Import SessionEvent model
    const SessionEvent = (await import('../models/SessionEvent.js')).default;

    // Fetch all events for this session
    const events = await SessionEvent.find({ sessionId: sessionId.toString() })
      .sort({ timestamp: 1 })
      .lean();

    // Calculate session duration
    const startTime = new Date(session.started_at);
    const endTime = new Date(session.ended_at);
    const durationMs = endTime - startTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    // Calculate total edits and comments
    const totalEdits = events.filter(e => e.type === 'CODE_CHANGE').length;
    const totalComments = events.filter(e => e.type === 'COMMENT_ADD').length;

    // Calculate user-level metrics
    const userMetrics = {};

    events.forEach(event => {
      let userId, userName;

      if (event.type === 'CODE_CHANGE') {
        // Code changes don't have user info in payload, skip for now
        return;
      } else if (event.payload.createdBy) {
        userId = event.payload.createdBy.userId;
        userName = event.payload.createdBy.name;
      } else if (event.payload.authorId) {
        userId = event.payload.authorId;
        userName = event.payload.authorName;
      }

      if (!userId) return;

      if (!userMetrics[userId]) {
        userMetrics[userId] = {
          userId,
          name: userName,
          edits: 0,
          comments: 0,
          activityScore: 0
        };
      }

      if (event.type === 'CODE_CHANGE') {
        userMetrics[userId].edits++;
      } else if (event.type === 'COMMENT_ADD') {
        userMetrics[userId].comments++;
      }
    });

    // Calculate activity scores (weighted: edits = 2 points, comments = 1 point)
    Object.values(userMetrics).forEach(user => {
      user.activityScore = (user.edits * 2) + user.comments;
    });

    // Sort contributors by activity score
    const contributors = Object.values(userMetrics).sort((a, b) => b.activityScore - a.activityScore);

    // Calculate percentages
    const maxScore = contributors.length > 0 ? contributors[0].activityScore : 1;
    contributors.forEach(user => {
      user.activityPercentage = Math.round((user.activityScore / maxScore) * 100);
    });

    res.json({
      success: true,
      analytics: {
        sessionId: session.id,
        sessionTitle: session.title,
        sessionDuration: `${durationMinutes}m`,
        durationMinutes,
        totalEdits,
        totalComments,
        totalEvents: events.length,
        activeCollaborators: contributors.length,
        contributors
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

