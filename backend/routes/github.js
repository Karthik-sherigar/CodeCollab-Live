import express from 'express';
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Encryption helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!';
const ALGORITHM = 'aes-256-cbc';

function getEncryptionKey() {
    // Ensure key is exactly 32 bytes for aes-256-cbc
    const key = Buffer.alloc(32);
    const secret = Buffer.from(ENCRYPTION_KEY);
    secret.copy(key);
    return key;
}

function encrypt(text) {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (err) {
        console.error('Encryption error:', err);
        throw err;
    }
}

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// GET /api/github/auth - Initiate GitHub OAuth
router.get('/auth', verifyToken, (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/github/callback`;
    const scope = 'repo read:user';
    const state = req.user.id; // Pass user ID as state

    console.log('--- GitHub Auth Start ---');
    console.log(`State (UserID): ${state}`);
    console.log(`Redirect URI: ${redirectUri}`);

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    res.redirect(githubAuthUrl);
});

// GET /api/github/callback - GitHub OAuth callback
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    console.log('--- GitHub Callback Received ---');
    console.log(`Code present: ${!!code}`);
    console.log(`State (UserID): ${state}`);

    if (!code) {
        console.error('GitHub error: No code returned');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?github_error=no_code`);
    }

    if (!state) {
        console.error('GitHub error: No state (userID) returned');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?github_error=no_state`);
    }

    try {
        // Exchange code for access token
        console.log('Exchanging code for token...');
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('GitHub token exchange error:', tokenData.error);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?github_error=${tokenData.error}`);
        }

        const accessToken = tokenData.access_token;
        console.log('Token received successfully.');

        // Get GitHub user info
        const octokit = new Octokit({ auth: accessToken });
        const { data: githubUser } = await octokit.users.getAuthenticated();
        console.log(`GitHub User authenticated: ${githubUser.login}`);

        // Store in database (encrypt token)
        console.log('Encrypting token...');
        const encryptedToken = encrypt(accessToken);

        // Update user record
        console.log(`Updating database for user ID: ${state}`);
        const [result] = await pool.query(
            `UPDATE users 
       SET github_id = ?, github_username = ?, github_access_token = ?, github_connected_at = NOW()
       WHERE id = ?`,
            [githubUser.id.toString(), githubUser.login, encryptedToken, state]
        );

        console.log(`Database update result: ${result.affectedRows} row(s) updated`);

        if (result.affectedRows === 0) {
            console.warn(`Warning: No user found with ID ${state}. GitHub connection not saved.`);
        }

        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?github_connected=true`);
    } catch (error) {
        console.error('--- GitHub OAuth Critical Error ---');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?github_error=auth_failed`);
    }
});

// GET /api/github/repos - Get user's repositories
router.get('/repos', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's GitHub token
        const [users] = await pool.query(
            'SELECT github_access_token FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0 || !users[0].github_access_token) {
            return res.status(400).json({
                success: false,
                message: 'GitHub not connected. Please connect your GitHub account first.'
            });
        }

        const accessToken = decrypt(users[0].github_access_token);
        const octokit = new Octokit({ auth: accessToken });

        // Fetch repositories
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 100
        });

        res.json({
            success: true,
            repos: repos.map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                owner: repo.owner.login,
                private: repo.private,
                defaultBranch: repo.default_branch
            }))
        });
    } catch (error) {
        console.error('Get repos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch repositories'
        });
    }
});

// POST /api/github/import - Import file from GitHub
router.post('/import', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { owner, repo, branch, filePath } = req.body;

        if (!owner || !repo || !branch || !filePath) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: owner, repo, branch, filePath'
            });
        }

        // Get user's GitHub token
        const [users] = await pool.query(
            'SELECT github_access_token FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0 || !users[0].github_access_token) {
            return res.status(400).json({
                success: false,
                message: 'GitHub not connected'
            });
        }

        const accessToken = decrypt(users[0].github_access_token);
        const octokit = new Octokit({ auth: accessToken });

        // Fetch file content
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: branch
        });

        if (data.type !== 'file') {
            return res.status(400).json({
                success: false,
                message: 'Path is not a file'
            });
        }

        const content = Buffer.from(data.content, 'base64').toString('utf-8');

        res.json({
            success: true,
            content,
            sha: data.sha
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to import file'
        });
    }
});

// POST /api/github/export - Export file to GitHub
router.post('/export', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { owner, repo, branch, filePath, content, message } = req.body;

        if (!owner || !repo || !branch || !filePath || !content || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get user's GitHub token
        const [users] = await pool.query(
            'SELECT github_access_token, github_username FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0 || !users[0].github_access_token) {
            return res.status(400).json({
                success: false,
                message: 'GitHub not connected'
            });
        }

        const accessToken = decrypt(users[0].github_access_token);
        const octokit = new Octokit({ auth: accessToken });

        // Try to get existing file SHA (needed for updates)
        let sha = null;
        try {
            const { data: existingFile } = await octokit.repos.getContent({
                owner,
                repo,
                path: filePath,
                ref: branch
            });
            sha = existingFile.sha;
        } catch (err) {
            // File doesn't exist, will create new
        }

        // Create or update file
        const { data: commit } = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message,
            content: Buffer.from(content).toString('base64'),
            branch,
            ...(sha && { sha })
        });

        res.json({
            success: true,
            commitUrl: commit.commit.html_url,
            commitSha: commit.commit.sha
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to export file'
        });
    }
});

// GET /api/github/status - Check if GitHub is connected
router.get('/status', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await pool.query(
            'SELECT github_username, github_connected_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0 || !users[0].github_username) {
            return res.json({
                success: true,
                connected: false
            });
        }

        res.json({
            success: true,
            connected: true,
            username: users[0].github_username,
            connectedAt: users[0].github_connected_at
        });
    } catch (error) {
        console.error('GitHub status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check GitHub status'
        });
    }
});

export default router;
