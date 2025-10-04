const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const Logger = require('../utils/Logger');
const config = require('../config/config');

class FileManager {
  constructor() {
    this.backupDir = config.backup.directory;
    this.logger = new Logger();
    this.compressionLevel = config.compression.level;
  }

  async ensureBackupDirectory() {
    try {
      await fs.ensureDir(this.backupDir);
      await fs.ensureDir(path.join(this.backupDir, 'public'));
      await fs.ensureDir(path.join(this.backupDir, 'private'));
      this.logger.info(`📁 Backup directory ready: ${this.backupDir}`);
    } catch (error) {
      this.logger.error('Failed to create backup directory:', error);
      throw error;
    }
  }

  sanitizeFileName(name) {
    return name.replace(/[^a-z0-9_\-\.\s]/gi, '_').replace(/\s+/g, '_');
  }

  async savePlaylist(playlistData) {
    try {
      const visibility = playlistData.metadata.public ? 'public' : 'private';
      const targetDir = path.join(this.backupDir, visibility);

      const fileName = `${this.sanitizeFileName(playlistData.name)}.json`;
      const filePath = path.join(targetDir, fileName);

      await fs.writeJson(filePath, playlistData, { spaces: 2 });

      return filePath;
    } catch (error) {
      this.logger.error(`Failed to save playlist "${playlistData.name}":`, error);
      throw error;
    }
  }

  async createZipArchive() {
    return new Promise((resolve, reject) => {
      const timestamp = config.backup.includeTimestamp
        ? new Date().toISOString().replace(/[:.]/g, '-')
        : '';
      const zipFileName = config.backup.includeTimestamp
        ? `${config.backup.zipFileName}-${timestamp}.zip`
        : `${config.backup.zipFileName}.zip`;
      const zipPath = path.join(process.cwd(), zipFileName);

      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: this.compressionLevel }
      });

      output.on('close', () => {
        this.logger.info(`📦 Archive created: ${zipFileName} (${archive.pointer()} bytes)`);
        resolve(zipPath);
      });

      archive.on('error', (err) => {
        this.logger.error('Archive error:', err);
        reject(err);
      });

      archive.pipe(output);
      archive.directory(this.backupDir, 'spotify-playlists');
      archive.finalize();
    });
  }

  async getBackupStats() {
    try {
      const stats = {
        totalPlaylists: 0,
        publicPlaylists: 0,
        privatePlaylists: 0,
        totalTracks: 0,
        backupSize: 0
      };

      const publicDir = path.join(this.backupDir, 'public');
      const privateDir = path.join(this.backupDir, 'private');

      if (await fs.pathExists(publicDir)) {
        const publicFiles = await fs.readdir(publicDir);
        stats.publicPlaylists = publicFiles.filter(file => file.endsWith('.json')).length;
      }

      if (await fs.pathExists(privateDir)) {
        const privateFiles = await fs.readdir(privateDir);
        stats.privatePlaylists = privateFiles.filter(file => file.endsWith('.json')).length;
      }

      stats.totalPlaylists = stats.publicPlaylists + stats.privatePlaylists;

      // Calculate total tracks and backup size
      const allFiles = await this.getAllPlaylistFiles();
      for (const file of allFiles) {
        try {
          const playlistData = await fs.readJson(file);
          stats.totalTracks += playlistData.tracks ? playlistData.tracks.length : 0;

          const fileStats = await fs.stat(file);
          stats.backupSize += fileStats.size;
        } catch (error) {
          this.logger.warn(`Failed to read playlist file ${file}:`, error.message);
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get backup stats:', error);
      throw error;
    }
  }

  async getAllPlaylistFiles() {
    const files = [];
    const publicDir = path.join(this.backupDir, 'public');
    const privateDir = path.join(this.backupDir, 'private');

    if (await fs.pathExists(publicDir)) {
      const publicFiles = await fs.readdir(publicDir);
      files.push(...publicFiles.map(file => path.join(publicDir, file)));
    }

    if (await fs.pathExists(privateDir)) {
      const privateFiles = await fs.readdir(privateDir);
      files.push(...privateFiles.map(file => path.join(privateDir, file)));
    }

    return files.filter(file => file.endsWith('.json'));
  }

  async cleanup() {
    try {
      await fs.remove(this.backupDir);
      this.logger.info('🧹 Cleaned up backup directory');
    } catch (error) {
      this.logger.error('Failed to cleanup backup directory:', error);
      throw error;
    }
  }
}

module.exports = FileManager;
