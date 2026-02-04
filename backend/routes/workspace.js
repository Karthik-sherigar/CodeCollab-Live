import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// All workspace routes require authentication
router.use(verifyToken);

// GET /api/workspaces - List user's workspaces
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all workspaces where user is a member
        const [workspaces] = await pool.query(`
      SELECT 
        w.id,
        w.name,
        w.created_at,
        w.updated_at,
        wm.role,
        (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count
      FROM workspaces w
      INNER JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = ?
      ORDER BY w.updated_at DESC
    `, [userId]);

        // Add session count
        const workspacesWithSessions = await Promise.all(workspaces.map(async (ws) => {
            const [sessionCount] = await pool.query(
                'SELECT COUNT(*) as count FROM sessions WHERE workspace_id = ?',
                [ws.id]
            );
            return {
                ...ws,
                sessionCount: sessionCount[0].count
            };
        }));

        res.json({
            success: true,
            workspaces: workspacesWithSessions
        });

    } catch (error) {
        console.error('Get workspaces error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workspaces'
        });
    }
});

// POST /api/workspaces - Create new workspace
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        // Validate workspace name
        if (!name || name.trim().length < 3 || name.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Workspace name must be between 3 and 50 characters'
            });
        }

        const connection = await pool.getConnection();

        try {
            // Start transaction
            await connection.beginTransaction();

            // Create workspace
            const [workspaceResult] = await connection.query(
                'INSERT INTO workspaces (name, owner_id) VALUES (?, ?)',
                [name.trim(), userId]
            );

            const workspaceId = workspaceResult.insertId;

            // Add creator as owner in workspace_members
            await connection.query(
                'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
                [workspaceId, userId, 'OWNER']
            );

            // Commit transaction
            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Workspace created successfully',
                workspace: {
                    id: workspaceId,
                    name: name.trim(),
                    role: 'OWNER',
                    sessionCount: 0
                }
            });

        } catch (error) {
            // Rollback on error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Create workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create workspace'
        });
    }
});

// GET /api/workspaces/:id - Get workspace details
router.get('/:id', async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const userId = req.user.id;

        // Check if user is member of workspace
        const [membership] = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a member of this workspace.'
            });
        }

        // Get workspace details
        const [workspaces] = await pool.query(
            'SELECT id, name, owner_id, created_at, updated_at FROM workspaces WHERE id = ?',
            [workspaceId]
        );

        if (workspaces.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        // Get all members
        const [members] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        wm.role,
        wm.joined_at
      FROM workspace_members wm
      INNER JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = ?
      ORDER BY wm.role, u.name
    `, [workspaceId]);

        // Get all sessions
        const [sessions] = await pool.query(`
      SELECT 
        s.id,
        s.title,
        s.language,
        s.status,
        s.created_at,
        s.updated_at,
        u.id as creator_id,
        u.name as creator_name
      FROM sessions s
      INNER JOIN users u ON s.created_by = u.id
      WHERE s.workspace_id = ?
      ORDER BY s.created_at DESC
    `, [workspaceId]);

        res.json({
            success: true,
            workspace: {
                ...workspaces[0],
                userRole: membership[0].role,
                members,
                sessions
            }
        });

    } catch (error) {
        console.error('Get workspace details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch workspace details'
        });
    }
});

// DELETE /api/workspaces/:id - Delete workspace (owner only)
router.delete('/:id', async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const userId = req.user.id;

        // Check if user is owner
        const [workspace] = await pool.query(
            'SELECT owner_id FROM workspaces WHERE id = ?',
            [workspaceId]
        );

        if (workspace.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Workspace not found'
            });
        }

        if (workspace[0].owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the workspace owner can delete it'
            });
        }

        // Delete workspace (cascade will delete members and sessions)
        await pool.query('DELETE FROM workspaces WHERE id = ?', [workspaceId]);

        res.json({
            success: true,
            message: 'Workspace deleted successfully'
        });

    } catch (error) {
        console.error('Delete workspace error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete workspace'
        });
    }
});

// POST /api/workspaces/:id/invite - Invite member to workspace (owner only)
router.post('/:id/invite', async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const userId = req.user.id;
        const { email, role } = req.body;

        // Validate input
        if (!email || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email and role are required'
            });
        }

        if (!['COLLABORATOR', 'REVIEWER'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Role must be COLLABORATOR or REVIEWER'
            });
        }

        // Check if requester is owner
        const [membership] = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, userId]
        );

        if (membership.length === 0 || membership[0].role !== 'OWNER') {
            return res.status(403).json({
                success: false,
                message: 'Only workspace owners can invite members'
            });
        }

        // Check if email exists
        const [users] = await pool.query(
            'SELECT id, name, email FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found. They must register first.'
            });
        }

        const invitedUser = users[0];

        // Check if already a member
        const [existingMember] = await pool.query(
            'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, invitedUser.id]
        );

        if (existingMember.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User is already a member of this workspace'
            });
        }

        // Add member
        await pool.query(
            'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
            [workspaceId, invitedUser.id, role]
        );

        // Get updated members list
        const [members] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        wm.role,
        wm.joined_at
      FROM workspace_members wm
      INNER JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = ?
      ORDER BY wm.role, u.name
    `, [workspaceId]);


        res.json({
            success: true,
            message: `${invitedUser.name} has been added as ${role}`,
            members
        });

    } catch (error) {
        console.error('Invite member error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to invite member'
        });
    }
});

// POST /api/workspaces/:id/sessions - Create session in workspace
router.post('/:id/sessions', async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const userId = req.user.id;
        const { title, language, filename } = req.body;

        // Validate input
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Session title is required'
            });
        }

        const validLanguages = ['javascript', 'python', 'java', 'cpp', 'go', 'rust', 'typescript'];
        if (!language || !validLanguages.includes(language.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid programming language'
            });
        }

        // Check workspace membership and role
        const [membership] = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
            [workspaceId, userId]
        );

        if (membership.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a member of this workspace.'
            });
        }

        // Only OWNER and COLLABORATOR can create sessions
        const userRole = membership[0].role;
        if (userRole !== 'OWNER' && userRole !== 'COLLABORATOR') {
            return res.status(403).json({
                success: false,
                message: 'Only workspace owners and collaborators can create sessions'
            });
        }

        // Insert session
        const [result] = await pool.query(
            `INSERT INTO sessions (workspace_id, title, language, filename, status, created_by) 
             VALUES (?, ?, ?, ?, 'ACTIVE', ?)`,
            [workspaceId, title, language, filename || null, userId]
        );

        const sessionId = result.insertId;

        // Get created session details
        const [session] = await pool.query(
            `SELECT 
              s.id,
              s.title,
              s.language,
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

        res.status(201).json({
            success: true,
            sessionId: sessionId,
            session: session[0]
        });

    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
