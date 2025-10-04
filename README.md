# Spotify Backup Tool

A comprehensive Node.js tool that uses the Spotify API to backup all your private and public playlists with detailed metadata, then creates a compressed zip archive for safe storage.

## Features

- 🎵 **Complete Playlist Backup**: Retrieves all your Spotify playlists (public and private)
- 📊 **Rich Metadata**: Captures comprehensive playlist and track information including:
  - Playlist details (name, description, owner, creation date, follower count)
  - Track information (artists, albums, release dates, popularity, duration)
  - External URLs for easy access
- 📦 **Zip Compression**: Creates compressed archives for efficient storage
- 🧪 **Comprehensive Testing**: Full Jest test suite with CI/CD integration
- 🔧 **Configurable**: Environment-based configuration for different deployment scenarios
- 📝 **Detailed Logging**: Structured logging with configurable levels
- 🚀 **CI/CD Ready**: GitHub Actions workflow for automated testing

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- Spotify Developer Account
- Spotify App credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/garretpatten/spotify-backup-tool.git
cd spotify-backup-tool
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Spotify credentials
```

### Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your Client ID and Client Secret
4. Add `http://localhost:3000/callback` to Redirect URIs
5. Use the [Authorization Code Flow](https://developer.spotify.com/documentation/general/guides/authorization/code-flow/) to get your refresh token

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required Spotify API credentials
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token

# Optional configuration
BACKUP_DIR=./spotify-playlists
LOG_LEVEL=info
COMPRESSION_LEVEL=9
```

### Usage

Run the backup tool:
```bash
npm start
# or
npm run backup
```

The tool will:
1. Authenticate with Spotify API
2. Fetch all your playlists
3. Download track details for each playlist
4. Save playlists as JSON files in `spotify-playlists/` directory
5. Create a timestamped zip archive

## Project Structure

```
src/
├── config/
│   └── config.js          # Configuration management
├── services/
│   ├── SpotifyApi.js      # Spotify API wrapper
│   ├── FileManager.js     # File operations and zip creation
│   ├── SpotifyBackup.js   # Main backup orchestration
│   └── __tests__/         # Service tests
├── utils/
│   ├── Logger.js          # Logging utility
│   └── __tests__/         # Utility tests
└── index.js               # Entry point
```

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Configuration

The tool supports various configuration options through environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `./spotify-playlists` | Directory to store playlist backups |
| `ZIP_FILE_NAME` | `spotify-backup` | Base name for zip archives |
| `INCLUDE_TIMESTAMP` | `true` | Include timestamp in zip filename |
| `LOG_LEVEL` | `info` | Logging level (error, warn, info, debug) |
| `PLAYLIST_LIMIT` | `50` | Number of playlists to fetch per API call |
| `TRACK_LIMIT` | `100` | Number of tracks to fetch per API call |
| `RETRY_ATTEMPTS` | `3` | Number of retry attempts for failed API calls |
| `COMPRESSION_LEVEL` | `9` | Zip compression level (1-9) |

## Output Format

Each playlist is saved as a JSON file with the following structure:

```json
{
  "name": "Playlist Name",
  "metadata": {
    "id": "playlist_id",
    "description": "Playlist description",
    "owner": {
      "display_name": "Owner Name",
      "id": "owner_id",
      "external_urls": { "spotify": "https://..." }
    },
    "public": true,
    "collaborative": false,
    "snapshot_id": "snapshot_id",
    "external_urls": { "spotify": "https://..." },
    "followers": { "total": 100 },
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-02T00:00:00Z",
    "total_tracks": 50
  },
  "tracks": [
    {
      "name": "Track Name",
      "artists": [
        {
          "name": "Artist Name",
          "id": "artist_id",
          "external_urls": { "spotify": "https://..." }
        }
      ],
      "album": {
        "name": "Album Name",
        "id": "album_id",
        "release_date": "2023-01-01",
        "release_date_precision": "day",
        "external_urls": { "spotify": "https://..." },
        "images": [{ "url": "https://..." }]
      },
      "external_urls": { "spotify": "https://..." },
      "duration_ms": 180000,
      "explicit": false,
      "popularity": 80,
      "preview_url": "https://...",
      "track_number": 1,
      "disc_number": 1
    }
  ],
  "backup_metadata": {
    "backed_up_at": "2023-01-02T12:00:00Z",
    "backup_version": "1.0.0"
  }
}
```

## CI/CD

The project includes GitHub Actions workflows that run on:
- Pull requests to main branch
- Pushes to main branch

The CI pipeline:
1. Tests on Node.js 18.x and 20.x
2. Runs ESLint for code quality
3. Executes the full test suite
4. Generates coverage reports
5. Uploads coverage to Codecov

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Troubleshooting

### Common Issues

**Authentication Errors**
- Ensure your refresh token is valid and not expired
- Verify your Client ID and Client Secret are correct
- Check that your Spotify app has the necessary scopes

**API Rate Limiting**
- The tool includes built-in retry logic
- Adjust `RETRY_ATTEMPTS` and `RETRY_DELAY` if needed
- Consider reducing `PLAYLIST_LIMIT` and `TRACK_LIMIT` for slower connections

**File Permission Errors**
- Ensure the backup directory is writable
- Check available disk space
- Verify file system permissions

### Getting Help

- Check the [Issues](https://github.com/garretpatten/spotify-backup-tool/issues) page
- Review the test files for usage examples
- Enable debug logging: `LOG_LEVEL=debug npm start`
