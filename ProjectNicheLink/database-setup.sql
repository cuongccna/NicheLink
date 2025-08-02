-- NicheLink Database Setup Script
-- Run this in pgAdmin or psql as postgres user

-- Create database
CREATE DATABASE nichelink;

-- Create user with password
CREATE USER nichelink WITH PASSWORD 'nichelink123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nichelink TO nichelink;

-- Connect to nichelink database
\c nichelink;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO nichelink;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nichelink;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nichelink;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Display connection info
SELECT 'Database setup completed!' as status;
