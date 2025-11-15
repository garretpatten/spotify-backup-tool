const SpotifyAuth = require("./getRefreshToken");

async function main() {
  const auth = new SpotifyAuth();

  const args = process.argv.slice(2);

  if (args.includes("--test") || args.includes("-t")) {
    // Test existing connection
    await auth.testConnection();
  } else {
    // Get new refresh token
    await auth.getRefreshToken();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SpotifyAuth };
