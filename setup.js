#!/usr/bin/env node

/**
 * Interactive setup script for Spotify Backup Tool
 * This script guides users through the complete setup process
 */

require("dotenv").config();
const readline = require("readline");
const fs = require("fs-extra");
const path = require("path");
const { SpotifyAuth } = require("./src/auth");

class SetupWizard {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async run() {
    console.log("🎵 Spotify Backup Tool - Setup Wizard");
    console.log("=====================================\n");

    try {
      await this.checkPrerequisites();
      await this.setupCredentials();
      await this.authenticate();
      await this.testConnection();

      console.log("\n🎉 Setup complete! You can now run:");
      console.log("   npm start");
      console.log("   npm run backup");
      console.log("   node example.js\n");
    } catch (error) {
      console.error("\n❌ Setup failed:", error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async checkPrerequisites() {
    console.log("📋 Checking prerequisites...");

    // Check if .env file exists
    const envPath = path.join(process.cwd(), ".env");
    const envExists = await fs.pathExists(envPath);

    if (!envExists) {
      console.log("📝 Creating .env file...");
      await fs.writeFile(envPath, "");
    }

    console.log("✅ Prerequisites check complete\n");
  }

  async setupCredentials() {
    console.log("🔑 Setting up Spotify credentials...");
    console.log(
      "You need to create a Spotify app at: https://developer.spotify.com/dashboard\n",
    );

    const clientId = await this.prompt("Enter your Spotify Client ID: ");
    const clientSecret = await this.prompt(
      "Enter your Spotify Client Secret: ",
    );

    if (!clientId || !clientSecret) {
      throw new Error("Client ID and Client Secret are required");
    }

    // Update .env file
    const envPath = path.join(process.cwd(), ".env");
    let envContent = await fs.readFile(envPath, "utf8");

    // Remove existing credentials
    envContent = envContent.replace(/SPOTIFY_CLIENT_ID=.*\n?/g, "");
    envContent = envContent.replace(/SPOTIFY_CLIENT_SECRET=.*\n?/g, "");

    // Add new credentials
    envContent += `SPOTIFY_CLIENT_ID=${clientId}\n`;
    envContent += `SPOTIFY_CLIENT_SECRET=${clientSecret}\n`;

    await fs.writeFile(envPath, envContent);

    // Reload environment variables
    require("dotenv").config();

    console.log("✅ Credentials saved to .env file\n");
  }

  async authenticate() {
    console.log("🔐 Starting authentication process...");
    console.log("This will open your browser to authorize the app.\n");

    try {
      const auth = new SpotifyAuth();
      const refreshToken = await auth.getRefreshToken();

      if (!refreshToken) {
        throw new Error("Authentication failed");
      }

      console.log("✅ Authentication successful!\n");
    } catch (error) {
      console.error("❌ Authentication error:", error.message);
      throw error;
    }
  }

  async testConnection() {
    console.log("🧪 Testing connection...");

    const auth = new SpotifyAuth();
    const success = await auth.testConnection();

    if (!success) {
      throw new Error("Connection test failed");
    }

    console.log("✅ Connection test passed!\n");
  }

  prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const wizard = new SetupWizard();
  wizard.run().catch(console.error);
}

module.exports = SetupWizard;
