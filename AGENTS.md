# AGENTS.md

Guidance for agents working in this repository (Spotify backup tool, Node.js).

## Commands

- `npm test` — run vitest tests
- `npm run test:coverage` — tests with coverage report
- `npm run lint` — eslint
- `npx prettier --check .` — formatting check
- `yamllint .github/workflows/` — CI workflow linting (no config file; uses yamllint defaults)

## CI workflow conventions (`.github/workflows/`)

The quality-checks reusable workflow lints all workflow files with yamllint (default config). Before committing workflow changes, verify with both:

```
npx prettier --check .github/workflows/
yamllint .github/workflows/
```

To stay clean under both tools:

- Start every workflow file with a document start `---`.
- Quote the trigger key as `'on':`, not `on:` (yamllint truthy rule, since YAML 1.1 parses `on` as boolean).
- Keep lines at or under 80 characters (error threshold).
- Pin third-party actions by full 40-character commit SHA. Put the action's version in a standalone comment on the line above the `uses:` line, not a trailing comment (e.g. `# actions/checkout v7.0.1`). Prettier collapses trailing comments after a SHA to one space, which then violates yamllint's 2-spaces-before-comment warning.
- For reusable-workflow pins where the `uses:` line exceeds 80 characters, add `# yamllint disable-line rule:line-length` on its own line directly above it, and no trailing comment on the `uses:` line.
- Top-level callers grant `permissions: contents: read` only; never use `secrets: inherit`.

## Security

- Never commit the `.env` file or tokens (used for Spotify auth). Refer to `setup.js` for generating local config.
