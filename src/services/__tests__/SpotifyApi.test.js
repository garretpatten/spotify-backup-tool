// Mock the config module
jest.mock('../../config/config', () => ({
  spotify: {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token'
  },
  api: {
    playlistLimit: 50,
    trackLimit: 100,
    retryAttempts: 3,
    retryDelay: 1000
  }
}));

const SpotifyApi = require('../SpotifyApi');

// Mock the spotify-web-api-node module
jest.mock('spotify-web-api-node');

describe('SpotifyApi', () => {
  let spotifyApi;
  let mockSpotifyWebApi;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock the SpotifyWebApi constructor
    const SpotifyWebApi = require('spotify-web-api-node');
    mockSpotifyWebApi = {
      setRefreshToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      setAccessToken: jest.fn(),
      getUserPlaylists: jest.fn(),
      getPlaylistTracks: jest.fn(),
      getMe: jest.fn()
    };
    SpotifyWebApi.mockImplementation(() => mockSpotifyWebApi);

    spotifyApi = new SpotifyApi();
  });

  describe('initialize', () => {
    it('should authenticate successfully with valid refresh token', async () => {
      mockSpotifyWebApi.refreshAccessToken.mockResolvedValue({
        body: { access_token: 'test-access-token' }
      });

      await spotifyApi.initialize();

      expect(mockSpotifyWebApi.setRefreshToken).toHaveBeenCalledWith('test-refresh-token');
      expect(mockSpotifyWebApi.refreshAccessToken).toHaveBeenCalled();
      expect(mockSpotifyWebApi.setAccessToken).toHaveBeenCalledWith('test-access-token');
    });

    it('should throw error if authentication fails', async () => {
      mockSpotifyWebApi.refreshAccessToken.mockRejectedValue(new Error('Invalid token'));

      await expect(spotifyApi.initialize()).rejects.toThrow(
        'Failed to authenticate with Spotify API: Invalid token'
      );
    });
  });

  describe('getAllPlaylists', () => {
    beforeEach(async () => {
      mockSpotifyWebApi.refreshAccessToken.mockResolvedValue({
        body: { access_token: 'test-access-token' }
      });
      await spotifyApi.initialize();
    });

    it('should fetch all playlists with pagination', async () => {
      const mockPlaylists1 = [
        { id: '1', name: 'Playlist 1' },
        { id: '2', name: 'Playlist 2' }
      ];
      const mockPlaylists2 = [
        { id: '3', name: 'Playlist 3' }
      ];

      mockSpotifyWebApi.getUserPlaylists
        .mockResolvedValueOnce({
          body: { items: mockPlaylists1 }
        })
        .mockResolvedValueOnce({
          body: { items: mockPlaylists2 }
        });

      const result = await spotifyApi.getAllPlaylists();

      expect(result).toEqual([...mockPlaylists1, ...mockPlaylists2]);
      expect(mockSpotifyWebApi.getUserPlaylists).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors gracefully', async () => {
      mockSpotifyWebApi.getUserPlaylists.mockRejectedValue(new Error('API Error'));

      await expect(spotifyApi.getAllPlaylists()).rejects.toThrow('API Error');
    });
  });

  describe('getPlaylistTracks', () => {
    beforeEach(async () => {
      mockSpotifyWebApi.refreshAccessToken.mockResolvedValue({
        body: { access_token: 'test-access-token' }
      });
      await spotifyApi.initialize();
    });

    it('should fetch all tracks with pagination', async () => {
      const mockTracks1 = [
        { track: { name: 'Track 1', artists: [{ name: 'Artist 1' }] } },
        { track: { name: 'Track 2', artists: [{ name: 'Artist 2' }] } }
      ];
      const mockTracks2 = [
        { track: { name: 'Track 3', artists: [{ name: 'Artist 3' }] } }
      ];

      mockSpotifyWebApi.getPlaylistTracks
        .mockResolvedValueOnce({
          body: { items: mockTracks1, next: 'next-page' }
        })
        .mockResolvedValueOnce({
          body: { items: mockTracks2, next: null }
        });

      const result = await spotifyApi.getPlaylistTracks('playlist-id');

      expect(result).toEqual([
        mockTracks1[0].track,
        mockTracks1[1].track,
        mockTracks2[0].track
      ]);
      expect(mockSpotifyWebApi.getPlaylistTracks).toHaveBeenCalledTimes(2);
    });

    it('should filter out null tracks', async () => {
      const mockTracks = [
        { track: { name: 'Track 1', artists: [{ name: 'Artist 1' }] } },
        { track: null },
        { track: { name: 'Track 2', artists: [{ name: 'Artist 2' }] } }
      ];

      mockSpotifyWebApi.getPlaylistTracks.mockResolvedValue({
        body: { items: mockTracks, next: null }
      });

      const result = await spotifyApi.getPlaylistTracks('playlist-id');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Track 1');
      expect(result[1].name).toBe('Track 2');
    });
  });
});
