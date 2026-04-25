# Session Todos

- [x] Inspect current dependency/package state and confirm Bun package metadata.
- [x] Upgrade all packages to latest using Bun, preserving unrelated existing edits.
- [x] Apply any minimal migration fixes required by upgraded packages.
- [x] Run `bun run lint` and resolve upgrade-related lint failures.
- [x] Run `bun run build` and resolve upgrade-related build failures.
- [x] Confirm latest-package status with `bun outdated` and `npm outdated --json`.
- [x] Remove unused `eslint-config-react-app` and add safe npm audit overrides for `@babel/core`, `@babel/helpers`, `flatted`, and `yaml`.
- [x] Remove broken flat `brace-expansion` override and leave Bun nested `minimatch` transitive warnings documented.
- [x] Summarize changed package files, verification results, and any remaining migration notes.
- [ ] Commit package-upgrade changes from `feature/upgrade-latest-packages`.
