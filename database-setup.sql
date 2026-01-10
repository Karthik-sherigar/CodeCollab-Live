-- CollabCode Live Database Setup Script

-- Create database
CREATE DATABASE IF NOT EXISTS collabcode_db;

-- Use the database
USE collabcode_db;

-- Create users table (will be auto-created by backend, but this is for reference)
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
);

-- Show tables
SHOW TABLES;

-- Show users table structure
DESCRIBE users;
