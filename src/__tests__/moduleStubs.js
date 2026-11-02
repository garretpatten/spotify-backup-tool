// Utilities for stubbing CommonJS modules in the Node require cache.
// Vitest can only intercept module mocks for ESM `import` statements; this
// codebase's source and tests use CommonJS `require`, so module mocks are
// installed by replacing cached module exports.

const stubbed = new Map();

function stubModule(requireFn, name, exportsValue) {
  const filename = requireFn.resolve(name);
  if (!stubbed.has(filename)) {
    stubbed.set(filename, requireFn.cache[filename]);
  }
  requireFn.cache[filename] = {
    id: filename,
    filename,
    loaded: true,
    path: filename,
    parent: null,
    children: [],
    exports: exportsValue,
  };
  return exportsValue;
}

function restoreStubs() {
  for (const [filename, original] of stubbed) {
    if (original) {
      require.cache[filename] = original;
    } else {
      delete require.cache[filename];
    }
  }
  stubbed.clear();
}

module.exports = { stubModule, restoreStubs };
