const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.js'],
    exclude: ['**/node_modules/**', 'src/config/config.test.js'],
    coverage: {
      include: ['src/**'],
      exclude: [
        'src/index.js',
        'src/config/config.test.js',
        'src/__tests__/moduleStubs.js',
      ],
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
    },
  },
});
