const fs = require("fs-extra");
const path = require("path");
const FileManager = require("../FileManager");

// Mock fs-extra
jest.mock("fs-extra");

// Mock archiver
jest.mock("archiver");

describe("FileManager", () => {
  let fileManager;
  let mockArchiver;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock archiver
    const archiver = require("archiver");
    mockArchiver = {
      pipe: jest.fn(),
      directory: jest.fn(),
      finalize: jest.fn(),
      on: jest.fn(),
    };
    archiver.mockImplementation(() => mockArchiver);

    fileManager = new FileManager();
  });

  describe("sanitizeFileName", () => {
    it("should sanitize special characters", () => {
      expect(fileManager.sanitizeFileName('My/Playlist: "Test"')).toBe(
        "My_Playlist___Test_",
      );
    });

    it("should replace spaces with underscores", () => {
      expect(fileManager.sanitizeFileName("My Playlist")).toBe("My_Playlist");
    });

    it("should handle multiple spaces", () => {
      expect(fileManager.sanitizeFileName("My   Playlist")).toBe("My_Playlist");
    });
  });

  describe("ensureBackupDirectory", () => {
    it("should create backup directories", async () => {
      fs.ensureDir.mockResolvedValue();

      await fileManager.ensureBackupDirectory();

      expect(fs.ensureDir).toHaveBeenCalledWith(fileManager.backupDir);
      expect(fs.ensureDir).toHaveBeenCalledWith(
        path.join(fileManager.backupDir, "public"),
      );
      expect(fs.ensureDir).toHaveBeenCalledWith(
        path.join(fileManager.backupDir, "private"),
      );
    });

    it("should handle directory creation errors", async () => {
      const error = new Error("Permission denied");
      fs.ensureDir.mockRejectedValue(error);

      await expect(fileManager.ensureBackupDirectory()).rejects.toThrow(
        "Permission denied",
      );
    });
  });

  describe("savePlaylist", () => {
    beforeEach(() => {
      fs.writeJson.mockResolvedValue();
    });

    it("should save public playlist to public directory", async () => {
      const playlistData = {
        name: "Test Playlist",
        metadata: { public: true },
      };

      await fileManager.savePlaylist(playlistData);

      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join(fileManager.backupDir, "public", "Test_Playlist.json"),
        playlistData,
        { spaces: 2 },
      );
    });

    it("should save private playlist to private directory", async () => {
      const playlistData = {
        name: "Private Playlist",
        metadata: { public: false },
      };

      await fileManager.savePlaylist(playlistData);

      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join(fileManager.backupDir, "private", "Private_Playlist.json"),
        playlistData,
        { spaces: 2 },
      );
    });

    it("should handle save errors", async () => {
      const error = new Error("Write failed");
      fs.writeJson.mockRejectedValue(error);

      const playlistData = {
        name: "Test Playlist",
        metadata: { public: true },
      };

      await expect(fileManager.savePlaylist(playlistData)).rejects.toThrow(
        "Write failed",
      );
    });
  });

  describe("createZipArchive", () => {
    it("should create zip archive successfully", async () => {
      const mockOutput = {
        on: jest.fn(),
      };
      fs.createWriteStream.mockReturnValue(mockOutput);

      // Mock the close event and pointer method
      mockOutput.on.mockImplementation((event, callback) => {
        if (event === "close") {
          setTimeout(() => callback(), 0);
        }
      });

      mockArchiver.pointer = jest.fn().mockReturnValue(1024);

      const result = await fileManager.createZipArchive();

      expect(mockArchiver.pipe).toHaveBeenCalledWith(mockOutput);
      expect(mockArchiver.directory).toHaveBeenCalledWith(
        fileManager.backupDir,
        "spotify-playlists",
      );
      expect(mockArchiver.finalize).toHaveBeenCalled();
      expect(result).toMatch(/spotify-backup-.*\.zip$/);
    }, 10000);

    it("should handle archive errors", async () => {
      const mockOutput = {
        on: jest.fn(),
      };
      fs.createWriteStream.mockReturnValue(mockOutput);

      // Mock the error event
      mockArchiver.on.mockImplementation((event, callback) => {
        if (event === "error") {
          setTimeout(() => callback(new Error("Archive error")), 0);
        }
      });

      await expect(fileManager.createZipArchive()).rejects.toThrow(
        "Archive error",
      );
    });
  });

  describe("getBackupStats", () => {
    it("should calculate backup statistics", async () => {
      const mockPlaylistData = {
        tracks: [{ name: "Track 1" }, { name: "Track 2" }],
      };

      fs.pathExists.mockResolvedValue(true);
      fs.readdir
        .mockResolvedValueOnce(["playlist1.json", "playlist2.json"])
        .mockResolvedValueOnce(["playlist3.json"]);
      fs.readJson.mockResolvedValue(mockPlaylistData);
      fs.stat.mockResolvedValue({ size: 1024 });

      // Mock getAllPlaylistFiles to return the expected files
      jest
        .spyOn(fileManager, "getAllPlaylistFiles")
        .mockResolvedValue([
          "/path/to/playlist1.json",
          "/path/to/playlist2.json",
          "/path/to/playlist3.json",
        ]);

      const stats = await fileManager.getBackupStats();

      expect(stats).toEqual({
        totalPlaylists: 3,
        publicPlaylists: 2,
        privatePlaylists: 1,
        totalTracks: 6, // 3 playlists * 2 tracks each
        backupSize: 3072, // 3 files * 1024 bytes each
      });
    });
  });
});
