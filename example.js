#!/usr/bin/env node

/**
 * Example script demonstrating how to use the Spotify Backup Tool
 *
 * Before running this script, make sure you have:
 * 1. Set up your Spotify Developer App
 * 2. Run: npm run auth (to get your refresh token)
 * 3. Installed dependencies with: npm install
 */

require('dotenv').config();
const { main } = require('./src/index');
const { SpotifyAuth } = require('./src/auth');

console.log('🎵 Spotify Backup Tool Example');
console.log('==============================');

// Check if required environment variables are set
const requiredVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error('\nPlease create a .env file with your Spotify credentials.');
  console.error('Run: npm run auth to get your refresh token automatically.');
  process.exit(1);
}

// Check if refresh token exists
if (!process.env.SPOTIFY_REFRESH_TOKEN) {
  console.log('🔑 No refresh token found. Starting authentication...\n');

  const auth = new SpotifyAuth();
  auth
    .getRefreshToken()
    .then((refreshToken) => {
      if (refreshToken) {
        console.log('✅ Authentication successful! Starting backup...\n');
        return main();
      } else {
        console.error('❌ Authentication failed. Please try again.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
} else {
  console.log('✅ Environment variables configured');
  console.log('🚀 Starting backup process...\n');

  // Run the backup
  main().catch((error) => {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  });
}
