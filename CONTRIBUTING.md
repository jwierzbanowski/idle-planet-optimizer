# Contributing

Thanks for your interest in contributing to Idle Planet Optimizer.

## Getting started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/idle-planet-optimizer.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`
5. Create a branch for your changes: `git checkout -b feature/my-feature` or `git checkout -b bugfix/my-bugfix`

## Code conventions

- **Vue 3 Composition API** with `<script setup>`
- **No TypeScript** — plain JavaScript only
- **2-space** indentation
- **ES modules** — all `.js` files use `import`/`export`
- Keep components focused; extract reusable logic into `src/composables/`
- Pure utility functions go in `src/utils/`
- Game-specific constants and config belong in `src/utils/config.js`

## Pull request process

1. Ensure your branch is up to date with `main`
2. Run `npm run lint` and fix any warnings
3. Test your changes manually in the browser
4. Open a pull request against `main`
5. In the PR description, link any related issues and include a screenshot if the change affects the UI

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold its terms.
