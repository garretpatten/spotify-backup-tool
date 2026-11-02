// Test configuration used when running tests
// (config.js loads this file when NODE_ENV === 'test' or VITEST is set)
module.exports = {
  backup: {
    directory: './test-backup',
    zipFileName: 'spotify-backup',
    includeTimestamp: true,
  },

  spotify: {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    refreshToken: 'test-refresh-token',
  },

  logging: {
    level: 'info',
    includeTimestamp: true,
  },

  api: {
    playlistLimit: 50,
    trackLimit: 100,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  compression: {
    level: 9,
  },
};
