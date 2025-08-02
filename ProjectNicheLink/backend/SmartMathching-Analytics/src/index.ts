import 'module-alias/register';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import and start the application
import app from './app';

// This file is needed to properly initialize the application
// The actual server is started in app.ts
