#!/usr/bin/env node

/**
 * Example script demonstrating how to use the Spotify Backup Tool
 *
 * Before running this script, make sure you have:
 * 1. Set up your Spotify Developer App
 * 2. Created a .env file with your credentials
 * 3. Installed dependencies with: npm install
 */

require('dotenv').config();
const { main } = require('./src/index');

console.log('🎵 Spotify Backup Tool Example');
console.log('==============================');

// Check if required environment variables are set
const requiredVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease create a .env file with your Spotify credentials.');
  console.error('See README.md for setup instructions.');
  process.exit(1);
}

console.log('✅ Environment variables configured');
console.log('🚀 Starting backup process...\n');

// Run the backup
main().catch(error => {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
});
