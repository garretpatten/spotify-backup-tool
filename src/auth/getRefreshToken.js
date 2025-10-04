require('dotenv').config();
const readline = require('readline');
const open = require('open');
const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs-extra');
const path = require('path');
const CallbackServer = require('./callbackServer');

class SpotifyAuth {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: 'http://localhost:3000/callback'
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async getRefreshToken() {
    console.log('🎵 Spotify Authentication Helper');
    console.log('================================\n');

    // Check if credentials are provided
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.error('❌ Missing Spotify credentials!');
      console.error('Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
      console.error('You can create a .env file with these values.\n');
      return null;
    }

    let callbackServer = null;

    try {
      // Step 1: Start callback server
      console.log('🌐 Starting callback server...');
      callbackServer = new CallbackServer();
      await callbackServer.start();

      // Step 2: Generate authorization URL
      const scopes = [
        'playlist-read-private',
        'playlist-read-collaborative',
        'user-library-read',
        'user-read-email',
        'user-read-private'
      ];

      const authURL = this.spotifyApi.createAuthorizeURL(scopes, 'state');

      console.log('🔗 Step 2: Authorize the application');
      console.log('Opening your browser to authorize the app...\n');

      try {
        // Try to open browser automatically
        await open(authURL);
        console.log('✅ Browser opened successfully!');
      } catch (error) {
        console.log('⚠️  Could not open browser automatically.');
        console.log('Please manually visit this URL:');
      }

      console.log('\n📋 Authorization URL:');
      console.log(authURL);
      console.log('\n⏳ Waiting for authorization...');
      console.log('After authorizing, you\'ll be redirected back here automatically.\n');

      // Step 3: Wait for callback with timeout
      console.log('⏳ Waiting for authorization (timeout: 5 minutes)...');

      let authCode;
      try {
        const callbackResult = await Promise.race([
          callbackServer.waitForCallback(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Authorization timeout - please try again')), 300000) // 5 minutes
          )
        ]);

        console.log('📨 Callback received:', callbackResult);

        if (callbackResult.error) {
          console.error('❌ Authorization failed:', callbackResult.error);
          return null;
        }

        authCode = callbackResult.code;
        console.log('✅ Authorization code received!');

        if (!authCode) {
          console.error('❌ No authorization code in callback result');
          return null;
        }
      } catch (error) {
        console.error('❌ Callback error:', error.message);
        return null;
      }

      // Step 4: Exchange code for tokens
      console.log('🔄 Exchanging authorization code for tokens...');
      const data = await this.spotifyApi.authorizationCodeGrant(authCode);

      const accessToken = data.body['access_token'];
      const refreshToken = data.body['refresh_token'];
      const expiresIn = data.body['expires_in'];

      console.log('✅ Successfully obtained tokens!');
      console.log(`⏰ Access token expires in: ${expiresIn} seconds`);

      // Step 5: Save refresh token to .env file
      await this.saveRefreshToken(refreshToken);

      console.log('\n🎉 Authentication complete!');
      console.log('Your refresh token has been saved to the .env file.');
      console.log('You can now run the backup tool with: npm start\n');

      return refreshToken;

    } catch (error) {
      console.error('❌ Authentication failed:', error.message);

      if (error.message.includes('invalid_grant')) {
        console.error('\n💡 This usually means:');
        console.error('   - The authorization code has expired (try again)');
        console.error('   - The code was already used');
        console.error('   - There was a typo in the code');
      }

      return null;
    } finally {
      // Clean up
      if (callbackServer) {
        callbackServer.stop();
      }
      this.rl.close();
    }
  }

  async promptForCode() {
    return new Promise((resolve) => {
      this.rl.question('Enter the authorization code: ', (code) => {
        resolve(code.trim());
      });
    });
  }

  async saveRefreshToken(refreshToken) {
    const envPath = path.join(process.cwd(), '.env');

    try {
      let envContent = '';

      // Read existing .env file if it exists
      if (await fs.pathExists(envPath)) {
        envContent = await fs.readFile(envPath, 'utf8');
      }

      // Update or add refresh token
      const lines = envContent.split('\n');
      let refreshTokenLineIndex = lines.findIndex(line => line.startsWith('SPOTIFY_REFRESH_TOKEN='));

      if (refreshTokenLineIndex >= 0) {
        lines[refreshTokenLineIndex] = `SPOTIFY_REFRESH_TOKEN=${refreshToken}`;
      } else {
        lines.push(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
      }

      // Write back to .env file
      await fs.writeFile(envPath, lines.join('\n'));
      console.log('💾 Refresh token saved to .env file');

    } catch (error) {
      console.error('❌ Failed to save refresh token:', error.message);
      console.log('Please manually add this to your .env file:');
      console.log(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
    }
  }

  async testConnection() {
    if (!process.env.SPOTIFY_REFRESH_TOKEN) {
      console.log('❌ No refresh token found. Please run the authentication first.');
      return false;
    }

    try {
      this.spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);
      const data = await this.spotifyApi.refreshAccessToken();
      this.spotifyApi.setAccessToken(data.body.access_token);

      const me = await this.spotifyApi.getMe();
      console.log('✅ Connection successful!');
      console.log(`👤 Logged in as: ${me.body.display_name} (${me.body.email})`);
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
  }
}

module.exports = SpotifyAuth;
