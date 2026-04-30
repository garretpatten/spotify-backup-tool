const path = require("path");

// Use test configuration during testing
if (process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID) {
  module.exports = require("./config.test");
} else {
  const config = {
    // Backup directory configuration
    backup: {
      directory:
        process.env.BACKUP_DIR || path.join(process.cwd(), "spotify-playlists"),
      zipFileName: process.env.ZIP_FILE_NAME || "spotify-backup",
      includeTimestamp: process.env.INCLUDE_TIMESTAMP !== "false",
    },

    // Spotify API configuration
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
    },

    // Logging configuration
    logging: {
      level: process.env.LOG_LEVEL || "info",
      includeTimestamp: process.env.LOG_TIMESTAMP !== "false",
    },

    // API rate limiting
    api: {
      playlistLimit: parseInt(process.env.PLAYLIST_LIMIT) || 50,
      trackLimit: parseInt(process.env.TRACK_LIMIT) || 100,
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
    },

    // Zip compression
    compression: {
      level: parseInt(process.env.COMPRESSION_LEVEL) || 9,
    },
  };

  // Validate required configuration (skip during testing)
  const isTestEnvironment =
    process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID;
  if (!isTestEnvironment) {
    const requiredEnvVars = [
      "SPOTIFY_CLIENT_ID",
      "SPOTIFY_CLIENT_SECRET",
      "SPOTIFY_REFRESH_TOKEN",
    ];
    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`,
      );
    }
  }

  module.exports = config;
}
