const SpotifyWebApi = require("spotify-web-api-node");
const Logger = require("../utils/Logger");
const config = require("../config/config");

class SpotifyApi {
  constructor() {
    this.api = new SpotifyWebApi({
      clientId: config.spotify.clientId,
      clientSecret: config.spotify.clientSecret,
    });
    this.logger = new Logger();
    this.retryAttempts = config.api.retryAttempts;
    this.retryDelay = config.api.retryDelay;
  }

  async initialize() {
    if (!config.spotify.refreshToken) {
      throw new Error("SPOTIFY_REFRESH_TOKEN environment variable is required");
    }

    this.api.setRefreshToken(config.spotify.refreshToken);

    try {
      const data = await this.api.refreshAccessToken();
      this.api.setAccessToken(data.body.access_token);
      this.logger.info("🔑 Successfully authenticated with Spotify API");
    } catch (error) {
      throw new Error(
        `Failed to authenticate with Spotify API: ${error.message}`,
      );
    }
  }

  async getAllPlaylists() {
    const playlists = [];
    let offset = 0;
    const limit = config.api.playlistLimit;

    while (true) {
      try {
        const response = await this.api.getUserPlaylists({ limit, offset });
        playlists.push(...response.body.items);

        if (response.body.items.length < limit) {
          break;
        }
        offset += limit;
      } catch (error) {
        this.logger.error(
          `Failed to fetch playlists at offset ${offset}:`,
          error,
        );
        throw error;
      }
    }

    return playlists;
  }

  async getPlaylistTracks(playlistId) {
    const tracks = [];
    let offset = 0;
    const limit = config.api.trackLimit;

    while (true) {
      try {
        const response = await this.api.getPlaylistTracks(playlistId, {
          offset,
          limit,
          fields:
            "items(track(name,artists(name,id,external_urls),album(name,id,release_date,release_date_precision,external_urls,images),external_urls,duration_ms,explicit,popularity,preview_url,track_number,disc_number)),next",
        });

        for (const item of response.body.items) {
          const track = item.track;
          if (!track) continue;

          tracks.push(track);
        }

        if (!response.body.next) break;
        offset += limit;
      } catch (error) {
        this.logger.error(
          `Failed to fetch tracks for playlist ${playlistId} at offset ${offset}:`,
          error,
        );
        throw error;
      }
    }

    return tracks;
  }

  async getUserProfile() {
    try {
      const response = await this.api.getMe();
      return response.body;
    } catch (error) {
      this.logger.error("Failed to fetch user profile:", error);
      throw error;
    }
  }
}

module.exports = SpotifyApi;
