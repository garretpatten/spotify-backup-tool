# AGENTS.md

Guidance for agents working in this repository (Spotify backup tool, Node.js).

## Repository standards

[garretpatten/github-standards](https://github.com/garretpatten/github-standards) is the
**canonical source of truth** for how every `garretpatten` repository must be structured
and maintained: license, security policy, contributing, community files, README
branding, CODEOWNERS, branch protection, pull requests, signed commits, Dependabot,
dependency hygiene, secret hygiene, workflow permissions, action pinning, repository
metadata, CI and quality, and exceptions.

- **Before starting any task**, read the current standards from the source of truth
  rather than from memory or a cached copy — they change over time. The standards index
  is at <https://github.com/garretpatten/github-standards#standards-files>; fetch raw
  files from
  `https://raw.githubusercontent.com/garretpatten/github-standards/master/<standard>.md`
  (via web fetch, `curl`, or `gh api`) and read every standard relevant to the task.
- **While working**, apply the standards to every change: workflows, dependency files,
  community files, repository metadata, and commit practices must conform to the
  standards as they exist at the time of the change.
- **When you detect drift** — this repository lagging behind a standard that changed —
  bring the repository back in line as part of normal work and call it out in your
  summary. If an update would be large or ambiguous, propose it instead of applying it
  silently.
- **Before finishing**, confirm the work satisfies the
  [verification](https://github.com/garretpatten/github-standards/blob/master/verification.md)
  standard and that local checks pass.
- For a full compliance review, use the `github-audit` skill, which audits a repository
  against these standards and reports numbered findings.

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
