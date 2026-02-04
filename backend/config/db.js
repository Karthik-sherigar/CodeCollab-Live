import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database and create users table
export const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();

    // Create users table if not exists with proper schema
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NULL,
        google_id VARCHAR(255) NULL,
        auth_provider ENUM('LOCAL', 'GOOGLE') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_google_id (google_id)
      )
    `);

    // Ensure GitHub columns exist (for existing tables)
    const [userColumns] = await connection.query('SHOW COLUMNS FROM users');
    const userColumnNames = userColumns.map(c => c.Field);

    if (!userColumnNames.includes('github_id')) {
      console.log('📦 Adding github_id column to users table...');
      await connection.query('ALTER TABLE users ADD COLUMN github_id VARCHAR(255) NULL AFTER google_id');
      await connection.query('CREATE INDEX idx_github_id ON users(github_id)');
    }
    if (!userColumnNames.includes('github_username')) {
      console.log('📦 Adding github_username column to users table...');
      await connection.query('ALTER TABLE users ADD COLUMN github_username VARCHAR(255) NULL AFTER github_id');
    }
    if (!userColumnNames.includes('github_access_token')) {
      console.log('📦 Adding github_access_token column to users table...');
      await connection.query('ALTER TABLE users ADD COLUMN github_access_token TEXT NULL AFTER github_username');
    }
    if (!userColumnNames.includes('github_connected_at')) {
      console.log('📦 Adding github_connected_at column to users table...');
      await connection.query('ALTER TABLE users ADD COLUMN github_connected_at TIMESTAMP NULL AFTER github_access_token');
    }

    // Create workspaces table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_owner (owner_id)
      )
    `);

    // Create workspace_members table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('OWNER', 'COLLABORATOR', 'REVIEWER') NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_workspace_user (workspace_id, user_id),
        INDEX idx_workspace (workspace_id),
        INDEX idx_user (user_id)
      )
    `);

    // Create sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        language VARCHAR(50) NOT NULL,
        filename VARCHAR(255) NULL,
        status ENUM('ACTIVE', 'ENDED') DEFAULT 'ACTIVE',
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_workspace (workspace_id),
        INDEX idx_status (status)
      )
    `);

    // Ensure session columns exist (especially filename)
    const [sessColumns] = await connection.query('SHOW COLUMNS FROM sessions');
    const sessColumnNames = sessColumns.map(c => c.Field);

    if (!sessColumnNames.includes('filename')) {
      console.log('📦 Adding filename column to sessions table...');
      await connection.query('ALTER TABLE sessions ADD COLUMN filename VARCHAR(255) NULL AFTER language');
    }
    if (!sessColumnNames.includes('started_at')) {
      console.log('📦 Adding started_at column to sessions table...');
      await connection.query('ALTER TABLE sessions ADD COLUMN started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER created_at');
    }
    if (!sessColumnNames.includes('ended_at')) {
      console.log('📦 Adding ended_at column to sessions table...');
      await connection.query('ALTER TABLE sessions ADD COLUMN ended_at TIMESTAMP NULL AFTER started_at');
    }

    connection.release();
    console.log('✅ Database initialized successfully');
    console.log('✅ Users table ready');
    console.log('✅ Workspaces table ready');
    console.log('✅ Workspace members table ready');
    console.log('✅ Sessions table ready');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection error:', error.message);
    return false;
  }
};

export default pool;
