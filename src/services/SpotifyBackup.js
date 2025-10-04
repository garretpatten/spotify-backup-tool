const SpotifyApi = require('./SpotifyApi');
const FileManager = require('./FileManager');
const Logger = require('../utils/Logger');

class SpotifyBackup {
  constructor() {
    this.spotifyApi = new SpotifyApi();
    this.fileManager = new FileManager();
    this.logger = new Logger();
  }

  async initialize() {
    await this.spotifyApi.initialize();
    await this.fileManager.ensureBackupDirectory();
  }

  async fetchAllPlaylists() {
    this.logger.info('🔍 Fetching all playlists...');
    const playlists = await this.spotifyApi.getAllPlaylists();
    this.logger.info(`📋 Retrieved ${playlists.length} playlists`);
    return playlists;
  }

  async backupPlaylists(playlists) {
    this.logger.info('💾 Starting playlist backup...');

    for (const playlist of playlists) {
      try {
        this.logger.info(`📝 Processing playlist: ${playlist.name}`);

        const tracks = await this.spotifyApi.getPlaylistTracks(playlist.id);
        const playlistData = this.createPlaylistData(playlist, tracks);

        await this.fileManager.savePlaylist(playlistData);

        const visibility = playlist.public ? 'PUBLIC' : 'PRIVATE';
        this.logger.info(`✅ ${visibility} ➜ ${playlist.name} (${tracks.length} tracks)`);
      } catch (error) {
        this.logger.error(`❌ Failed to backup playlist "${playlist.name}":`, error);
        // Continue with other playlists even if one fails
      }
    }
  }

  createPlaylistData(playlist, tracks) {
    return {
      name: playlist.name,
      metadata: {
        id: playlist.id,
        description: playlist.description,
        owner: {
          display_name: playlist.owner.display_name,
          id: playlist.owner.id,
          external_urls: playlist.owner.external_urls
        },
        public: playlist.public,
        collaborative: playlist.collaborative,
        snapshot_id: playlist.snapshot_id,
        external_urls: playlist.external_urls,
        followers: playlist.followers,
        created_at: playlist.created_at,
        updated_at: playlist.updated_at,
        total_tracks: tracks.length
      },
      tracks: tracks.map(track => ({
        name: track.name,
        artists: track.artists.map(artist => ({
          name: artist.name,
          id: artist.id,
          external_urls: artist.external_urls
        })),
        album: {
          name: track.album.name,
          id: track.album.id,
          release_date: track.album.release_date,
          release_date_precision: track.album.release_date_precision,
          external_urls: track.album.external_urls,
          images: track.album.images
        },
        external_urls: track.external_urls,
        duration_ms: track.duration_ms,
        explicit: track.explicit,
        popularity: track.popularity,
        preview_url: track.preview_url,
        track_number: track.track_number,
        disc_number: track.disc_number
      })),
      backup_metadata: {
        backed_up_at: new Date().toISOString(),
        backup_version: '1.0.0'
      }
    };
  }

  async createZipArchive() {
    this.logger.info('📦 Creating zip archive...');
    return await this.fileManager.createZipArchive();
  }
}

module.exports = SpotifyBackup;
