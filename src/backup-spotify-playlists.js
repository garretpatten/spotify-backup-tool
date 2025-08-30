require("dotenv").config();
const SpotifyWebApi = require("spotify-web-api-node");
const fs = require("fs-extra");
const path = require("path");

const api = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

api.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);

async function getAllPlaylists() {
  const playlists = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const res = await api.getUserPlaylists({ limit, offset });
    playlists.push(...res.body.items);
    if (res.body.items.length < limit) break;
    offset += limit;
  }

  return playlists;
}

function sanitize(name) {
  return name.replace(/[^a-z0-9_\-\.]/gi, "_");
}

async function fetchTracks(playlistId) {
  const tracks = [];
  let offset = 0;

  while (true) {
    const res = await api.getPlaylistTracks(playlistId, {
      offset,
      limit: 100,
      fields:
        "items(track(name,artists(name),album(name,release_date),external_urls,duration_ms)),next",
    });

    for (const item of res.body.items) {
      const t = item.track;
      if (!t) continue;

      tracks.push({
        name: t.name,
        artists: t.artists.map((a) => a.name),
        album: t.album.name,
        release_date: t.album.release_date,
        url: t.external_urls.spotify,
        duration_ms: t.duration_ms,
      });
    }

    if (!res.body.next) break;
    offset += 100;
  }

  return tracks;
}

async function backup() {
  await api.refreshAccessToken().then((data) => {
    api.setAccessToken(data.body["access_token"]);
  });

  const backupRoot = path.join(__dirname, "spotify-playlist-backup");
  const playlists = await getAllPlaylists();

  for (const pl of playlists) {
    const visibility = pl.public ? "public" : "private";
    const targetDir = path.join(backupRoot, visibility);
    await fs.ensureDir(targetDir);

    const fileName = `${sanitize(pl.name)}.json`;
    const filePath = path.join(targetDir, fileName);

    const tracks = await fetchTracks(pl.id);

    const data = {
      name: pl.name,
      metadata: {
        id: pl.id,
        description: pl.description,
        owner: pl.owner.display_name,
        public: pl.public,
        snapshot_id: pl.snapshot_id,
        url: pl.external_urls.spotify,
      },
      songs: tracks,
    };

    await fs.writeJson(filePath, data, { spaces: 2 });
    console.log(`✅ ${visibility.toUpperCase()} ➜ ${pl.name}`);
  }

  console.log("🎉 All playlists backed up.");
}

backup().catch((err) => {
  console.error("❌ Backup failed:", err);
});
