// Mock the config module
jest.mock("../../config/config", () => ({
  spotify: {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    refreshToken: "test-refresh-token",
  },
  api: {
    playlistLimit: 50,
    trackLimit: 100,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  backup: {
    directory: "./test-backup",
    zipFileName: "test-backup",
    includeTimestamp: true,
  },
  compression: {
    level: 9,
  },
  logging: {
    level: "info",
  },
}));

const SpotifyBackup = require("../SpotifyBackup");
const SpotifyApi = require("../SpotifyApi");
const FileManager = require("../FileManager");

// Mock dependencies
jest.mock("../SpotifyApi");
jest.mock("../FileManager");

describe("SpotifyBackup", () => {
  let spotifyBackup;
  let mockSpotifyApi;
  let mockFileManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SpotifyApi
    mockSpotifyApi = {
      initialize: jest.fn(),
      getAllPlaylists: jest.fn(),
      getPlaylistTracks: jest.fn(),
    };
    SpotifyApi.mockImplementation(() => mockSpotifyApi);

    // Mock FileManager
    mockFileManager = {
      ensureBackupDirectory: jest.fn(),
      savePlaylist: jest.fn(),
      createZipArchive: jest.fn(),
    };
    FileManager.mockImplementation(() => mockFileManager);

    spotifyBackup = new SpotifyBackup();
  });

  describe("initialize", () => {
    it("should initialize dependencies", async () => {
      await spotifyBackup.initialize();

      expect(mockSpotifyApi.initialize).toHaveBeenCalled();
      expect(mockFileManager.ensureBackupDirectory).toHaveBeenCalled();
    });
  });

  describe("fetchAllPlaylists", () => {
    it("should fetch and return all playlists", async () => {
      const mockPlaylists = [
        { id: "1", name: "Playlist 1" },
        { id: "2", name: "Playlist 2" },
      ];
      mockSpotifyApi.getAllPlaylists.mockResolvedValue(mockPlaylists);

      const result = await spotifyBackup.fetchAllPlaylists();

      expect(result).toEqual(mockPlaylists);
      expect(mockSpotifyApi.getAllPlaylists).toHaveBeenCalled();
    });
  });

  describe("backupPlaylists", () => {
    beforeEach(() => {
      mockSpotifyApi.getPlaylistTracks.mockResolvedValue([
        { name: "Track 1", artists: [{ name: "Artist 1" }] },
      ]);
    });

    it("should backup all playlists successfully", async () => {
      const mockPlaylists = [
        { id: "1", name: "Playlist 1", public: true },
        { id: "2", name: "Playlist 2", public: false },
      ];

      await spotifyBackup.backupPlaylists(mockPlaylists);

      expect(mockSpotifyApi.getPlaylistTracks).toHaveBeenCalledTimes(2);
      expect(mockFileManager.savePlaylist).toHaveBeenCalledTimes(2);
    });

    it("should continue processing if one playlist fails", async () => {
      const mockPlaylists = [
        { id: "1", name: "Playlist 1", public: true },
        { id: "2", name: "Playlist 2", public: false },
      ];

      mockSpotifyApi.getPlaylistTracks
        .mockResolvedValueOnce([
          { name: "Track 1", artists: [{ name: "Artist 1" }] },
        ])
        .mockRejectedValueOnce(new Error("API Error"));

      await spotifyBackup.backupPlaylists(mockPlaylists);

      expect(mockFileManager.savePlaylist).toHaveBeenCalledTimes(1);
    });
  });

  describe("createPlaylistData", () => {
    it("should create comprehensive playlist data structure", () => {
      const mockPlaylist = {
        id: "playlist-1",
        name: "Test Playlist",
        description: "A test playlist",
        public: true,
        collaborative: false,
        snapshot_id: "snapshot-123",
        external_urls: { spotify: "https://spotify.com/playlist/1" },
        followers: { total: 10 },
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-02T00:00:00Z",
        owner: {
          display_name: "Test User",
          id: "user-1",
          external_urls: { spotify: "https://spotify.com/user/1" },
        },
      };

      const mockTracks = [
        {
          name: "Track 1",
          artists: [
            {
              name: "Artist 1",
              id: "artist-1",
              external_urls: { spotify: "https://spotify.com/artist/1" },
            },
          ],
          album: {
            name: "Album 1",
            id: "album-1",
            release_date: "2023-01-01",
            release_date_precision: "day",
            external_urls: { spotify: "https://spotify.com/album/1" },
            images: [{ url: "https://example.com/image.jpg" }],
          },
          external_urls: { spotify: "https://spotify.com/track/1" },
          duration_ms: 180000,
          explicit: false,
          popularity: 80,
          preview_url: "https://example.com/preview.mp3",
          track_number: 1,
          disc_number: 1,
        },
      ];

      const result = spotifyBackup.createPlaylistData(mockPlaylist, mockTracks);

      expect(result).toEqual({
        name: "Test Playlist",
        metadata: {
          id: "playlist-1",
          description: "A test playlist",
          owner: {
            display_name: "Test User",
            id: "user-1",
            external_urls: { spotify: "https://spotify.com/user/1" },
          },
          public: true,
          collaborative: false,
          snapshot_id: "snapshot-123",
          external_urls: { spotify: "https://spotify.com/playlist/1" },
          followers: { total: 10 },
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-02T00:00:00Z",
          total_tracks: 1,
        },
        tracks: [
          {
            name: "Track 1",
            artists: [
              {
                name: "Artist 1",
                id: "artist-1",
                external_urls: { spotify: "https://spotify.com/artist/1" },
              },
            ],
            album: {
              name: "Album 1",
              id: "album-1",
              release_date: "2023-01-01",
              release_date_precision: "day",
              external_urls: { spotify: "https://spotify.com/album/1" },
              images: [{ url: "https://example.com/image.jpg" }],
            },
            external_urls: { spotify: "https://spotify.com/track/1" },
            duration_ms: 180000,
            explicit: false,
            popularity: 80,
            preview_url: "https://example.com/preview.mp3",
            track_number: 1,
            disc_number: 1,
          },
        ],
        backup_metadata: {
          backed_up_at: expect.any(String),
          backup_version: "1.0.0",
        },
      });
    });
  });

  describe("createZipArchive", () => {
    it("should create zip archive", async () => {
      const mockZipPath = "/path/to/backup.zip";
      mockFileManager.createZipArchive.mockResolvedValue(mockZipPath);

      const result = await spotifyBackup.createZipArchive();

      expect(result).toBe(mockZipPath);
      expect(mockFileManager.createZipArchive).toHaveBeenCalled();
    });
  });
});
