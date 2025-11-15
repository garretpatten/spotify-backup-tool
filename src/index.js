require("dotenv").config();
const SpotifyBackup = require("./services/SpotifyBackup");
const Logger = require("./utils/Logger");

const logger = new Logger();

async function main() {
  try {
    logger.info("🎵 Starting Spotify backup process...");

    const backup = new SpotifyBackup();
    await backup.initialize();

    const playlists = await backup.fetchAllPlaylists();
    logger.info(`📋 Found ${playlists.length} playlists to backup`);

    await backup.backupPlaylists(playlists);
    logger.info("✅ Playlist backup completed");

    const zipPath = await backup.createZipArchive();
    logger.info(`📦 Created zip archive: ${zipPath}`);

    logger.info("🎉 Spotify backup process completed successfully!");
  } catch (error) {
    logger.error("❌ Backup process failed:", error);
    process.exit(1);
  }
}

// Run the backup if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
