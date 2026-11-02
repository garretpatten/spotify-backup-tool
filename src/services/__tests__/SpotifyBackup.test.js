// Stub the local collaborator modules; Vitest cannot intercept `require()`
// with vi.mock, so the module cache is patched instead
const { stubModule, restoreStubs } = require('../../__tests__/moduleStubs');

const SpotifyApi = stubModule(require, '../SpotifyApi', vi.fn());
const FileManager = stubModule(require, '../FileManager', vi.fn());

const SpotifyBackup = require('../SpotifyBackup');

afterAll(restoreStubs);

describe('SpotifyBackup', () => {
  let spotifyBackup;
  let mockSpotifyApi;
  let mockFileManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock SpotifyApi
    mockSpotifyApi = {
      initialize: vi.fn(),
      getAllPlaylists: vi.fn(),
      getPlaylistTracks: vi.fn(),
    };
    SpotifyApi.mockImplementation(function () {
      return mockSpotifyApi;
    });

    // Mock FileManager
    mockFileManager = {
      ensureBackupDirectory: vi.fn(),
      savePlaylist: vi.fn(),
      createZipArchive: vi.fn(),
    };
    FileManager.mockImplementation(function () {
      return mockFileManager;
    });

    spotifyBackup = new SpotifyBackup();
  });

  describe('initialize', () => {
    it('should initialize dependencies', async () => {
      await spotifyBackup.initialize();

      expect(mockSpotifyApi.initialize).toHaveBeenCalled();
      expect(mockFileManager.ensureBackupDirectory).toHaveBeenCalled();
    });
  });

  describe('fetchAllPlaylists', () => {
    it('should fetch and return all playlists', async () => {
      const mockPlaylists = [
        { id: '1', name: 'Playlist 1' },
        { id: '2', name: 'Playlist 2' },
      ];
      mockSpotifyApi.getAllPlaylists.mockResolvedValue(mockPlaylists);

      const result = await spotifyBackup.fetchAllPlaylists();

      expect(result).toEqual(mockPlaylists);
      expect(mockSpotifyApi.getAllPlaylists).toHaveBeenCalled();
    });
  });

  describe('backupPlaylists', () => {
    const mockTracks = [
      {
        name: 'Track 1',
        artists: [
          {
            name: 'Artist 1',
            id: 'artist-1',
            external_urls: { spotify: 'https://open.spotify.com/artist/1' },
          },
        ],
        album: {
          name: 'Album 1',
          id: 'album-1',
          release_date: '2023-01-01',
          release_date_precision: 'day',
          external_urls: { spotify: 'https://open.spotify.com/album/1' },
          images: [{ url: 'https://example.com/image.jpg' }],
        },
        external_urls: { spotify: 'https://open.spotify.com/track/1' },
        duration_ms: 180000,
        explicit: false,
        popularity: 80,
        preview_url: 'https://example.com/preview.mp3',
        track_number: 1,
        disc_number: 1,
      },
    ];

    const mockPlaylist = (id, name, isPublic) => ({
      id,
      name,
      description: 'A test playlist',
      public: isPublic,
      collaborative: false,
      snapshot_id: 'snapshot-123',
      external_urls: { spotify: `https://open.spotify.com/playlist/${id}` },
      followers: { total: 10 },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
      owner: {
        display_name: 'Test User',
        id: 'user-1',
        external_urls: { spotify: 'https://open.spotify.com/user/1' },
      },
    });

    beforeEach(() => {
      mockSpotifyApi.getPlaylistTracks.mockResolvedValue(mockTracks);
    });

    it('should backup all playlists successfully', async () => {
      const mockPlaylists = [
        mockPlaylist('1', 'Playlist 1', true),
        mockPlaylist('2', 'Playlist 2', false),
      ];

      await spotifyBackup.backupPlaylists(mockPlaylists);

      expect(mockSpotifyApi.getPlaylistTracks).toHaveBeenCalledTimes(2);
      expect(mockFileManager.savePlaylist).toHaveBeenCalledTimes(2);
    });

    it('should continue processing if one playlist fails', async () => {
      const mockPlaylists = [
        mockPlaylist('1', 'Playlist 1', true),
        mockPlaylist('2', 'Playlist 2', false),
      ];

      mockSpotifyApi.getPlaylistTracks
        .mockResolvedValueOnce(mockTracks)
        .mockRejectedValueOnce(new Error('API Error'));

      await spotifyBackup.backupPlaylists(mockPlaylists);

      expect(mockFileManager.savePlaylist).toHaveBeenCalledTimes(1);
    });
  });

  describe('createPlaylistData', () => {
    it('should create comprehensive playlist data structure', () => {
      const mockPlaylist = {
        id: 'playlist-1',
        name: 'Test Playlist',
        description: 'A test playlist',
        public: true,
        collaborative: false,
        snapshot_id: 'snapshot-123',
        external_urls: { spotify: 'https://spotify.com/playlist/1' },
        followers: { total: 10 },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
        owner: {
          display_name: 'Test User',
          id: 'user-1',
          external_urls: { spotify: 'https://spotify.com/user/1' },
        },
      };

      const mockTracks = [
        {
          name: 'Track 1',
          artists: [
            {
              name: 'Artist 1',
              id: 'artist-1',
              external_urls: { spotify: 'https://spotify.com/artist/1' },
            },
          ],
          album: {
            name: 'Album 1',
            id: 'album-1',
            release_date: '2023-01-01',
            release_date_precision: 'day',
            external_urls: { spotify: 'https://spotify.com/album/1' },
            images: [{ url: 'https://example.com/image.jpg' }],
          },
          external_urls: { spotify: 'https://spotify.com/track/1' },
          duration_ms: 180000,
          explicit: false,
          popularity: 80,
          preview_url: 'https://example.com/preview.mp3',
          track_number: 1,
          disc_number: 1,
        },
      ];

      const result = spotifyBackup.createPlaylistData(mockPlaylist, mockTracks);

      expect(result).toEqual({
        name: 'Test Playlist',
        metadata: {
          id: 'playlist-1',
          description: 'A test playlist',
          owner: {
            display_name: 'Test User',
            id: 'user-1',
            external_urls: { spotify: 'https://spotify.com/user/1' },
          },
          public: true,
          collaborative: false,
          snapshot_id: 'snapshot-123',
          external_urls: { spotify: 'https://spotify.com/playlist/1' },
          followers: { total: 10 },
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          total_tracks: 1,
        },
        tracks: [
          {
            name: 'Track 1',
            artists: [
              {
                name: 'Artist 1',
                id: 'artist-1',
                external_urls: { spotify: 'https://spotify.com/artist/1' },
              },
            ],
            album: {
              name: 'Album 1',
              id: 'album-1',
              release_date: '2023-01-01',
              release_date_precision: 'day',
              external_urls: { spotify: 'https://spotify.com/album/1' },
              images: [{ url: 'https://example.com/image.jpg' }],
            },
            external_urls: { spotify: 'https://spotify.com/track/1' },
            duration_ms: 180000,
            explicit: false,
            popularity: 80,
            preview_url: 'https://example.com/preview.mp3',
            track_number: 1,
            disc_number: 1,
          },
        ],
        backup_metadata: {
          backed_up_at: expect.any(String),
          backup_version: '1.0.0',
        },
      });
    });
  });

  describe('createZipArchive', () => {
    it('should create zip archive', async () => {
      const mockZipPath = '/path/to/backup.zip';
      mockFileManager.createZipArchive.mockResolvedValue(mockZipPath);

      const result = await spotifyBackup.createZipArchive();

      expect(result).toBe(mockZipPath);
      expect(mockFileManager.createZipArchive).toHaveBeenCalled();
    });
  });
});
