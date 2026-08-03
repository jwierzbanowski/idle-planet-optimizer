# AGENTS.md — Idle Planet Optimizer

Guidelines for AI agents (and humans) working in this repository.

## Project overview

- Vue 3 + Vite single-page app. `src/components/` holds `.vue` components,
  `src/composables/` shared stateful logic, `src/utils/` pure helpers.
- Game data lives as JSON in `public/data/` (`ores.json`, `alloys.json`,
  `items.json`, `mining.json`, `planets.json`).
- Plain JavaScript only (no TypeScript), ES modules, 2-space indent,
  `<script setup>` Composition API.
- Single source of truth: game constants and configuration in
  `src/utils/config.js`; calculation logic in `src/utils/calc.js`.

## Commands

| Task             | Command                          |
| ---------------- | -------------------------------- |
| Dev server       | `npm run dev`                    |
| Production build | `npm run build`                  |
| Lint             | `npm run lint`                   |
| Format           | `npm run format`                 |
| Docs server      | `npm run docs` (docsify, :3000)  |

CI runs `npm run lint` and `npm run build` on every push to `main`.

## Engineering principles (pragmatism first)

- Make the smallest change that solves the problem. No speculative
  abstractions, no unused parameters, no over-engineering.
- One fix or feature per change. Do not refactor unrelated code in the
  same change.
- Extend the data/config files rather than hardcoding new values in
  components.
- Preserve the migration path in `src/composables/useProfile.js` when
  changing configuration keys (existing saved data must keep loading).

## Reuse before you write

- Search `src/components/`, `src/composables/`, and `src/utils/` before
  creating anything new. Existing reusable pieces include `StarControls.vue`,
  `TimePicker.vue`, `useModifierKeys`, and the helpers in `src/utils/`.
- Shared state goes in composables; pure functions go in `src/utils/`.
- Do not copy-paste markup or styles. Extract a shared component/composable
  at the point where duplication is real (rule of thumb: third occurrence),
  not prematurely.
- Known anti-pattern to avoid: `.star-btn` styles are currently duplicated
  across several files — prefer the `StarControls` component instead.

## Verification before finishing

- Always run `npm run lint` and `npm run build` after code changes and fix
  any issues.
- This project has no automated test framework. Verify manually by checking
  affected views in the dev server, and by reasoning about side effects.
- When you change a util/composable/component, search for its consumers and
  make sure all call sites still work (update them in the same change).
- Propose adding a test framework only if it clearly pays off; ask first.

## Documentation must follow code

- `docs/` is a user guide (docsify). Any change that alters visible
  behavior or features must update the relevant docs in the same change:
  the feature list in `docs/README.md`, the per-tab pages, `docs/_sidebar.md`,
  and any affected pages (e.g. `multipliers.md`, `backup.md`).
- When a UI change affects what a screenshot shows, check
  `docs/screenshots/README.md` for the correct `NN-<name>.png` filename
  convention and register new files there.
- If a new view is added and a screenshot is required, stop and ask the user
  to capture it, stating the exact filename needed. Never fabricate or leave
  dangling image references.
- After changing code, verify docs did not drift: no page describing
  behavior that no longer exists, no feature listed that was removed.

## Communication

- Summarize what changed and what was verified after each task.
- If a screenshot or other asset is still needed from the user, call it out
  explicitly with the expected filename.
- Ask before introducing new dependencies (the dependency list is minimal)
  or making changes outside the requested scope.
