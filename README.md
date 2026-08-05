# Idle Planet Optimizer

[![Deploy to GitHub Pages](https://github.com/jwierzbanowski/idle-planet-optimizer/actions/workflows/deploy.yml/badge.svg)](https://github.com/jwierzbanowski/idle-planet-optimizer/actions/workflows/deploy.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A free browser-based calculator for **[Idle Planet Miner](https://play.google.com/store/apps/details?id=com.treedog.idleplanetminer)**. Computes optimal **smelting rates**, **crafting times**, and **mining output** across all ores, alloys, and items. Full profile configuration — rooms, managers, station, ships, beacons, badges, and market overrides.

**Live at [jwierzbanowski.github.io/idle-planet-optimizer](https://jwierzbanowski.github.io/idle-planet-optimizer/)**

## Features

- **Ore, alloy, item, and planet data browser** — loads raw game definitions from data files
- **Smelting calculator** — computes smelt rate, total cost, and profit per second per alloy, with configurable star ratings and market price overrides
- **Crafting calculator** — computes craft rate, total cost, and profit per second per item, including multi-level production tree traversal with time and ore cost breakdowns
- **Mining table** — per-planet configuration of mining level, colony count, and probe count with rate display
- **Profile configuration** — rooms, stations, and beacons with stat contribution tracking
- **Game progress tracker** — projects, managers (with per-manager stat editing), and pinned items
- **Market price overrides** — per-resource market value adjustment
- **Detail panel** — click any resource to view its full production tree, input/output quantities, and time-to-craft breakdown
- **Summary stats bar** — live display of smelt rate, craft rate, mine rate, alloy value, item value, smelt cost, craft cost, and planet upgrade cost
- **Profile import/export** — save and restore all configuration as a JSON file
- **Persistence** — all state stored in browser localStorage

## Documentation

Full user documentation lives in [`docs/`](docs/README.md) — a user guide, per-tab references (ores, crafting, mining), profile and game setup, and backup/persistence details, with screenshots under [`docs/screenshots/`](docs/screenshots/README.md).

The docs are also built into the GitHub Pages site and available at **https://jwierzbanowski.github.io/idle-planet-optimizer/docs/**.

To preview the docs locally:

```bash
npm run docs
```

Open `http://localhost:3000`.

## Usage

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default `http://localhost:5173`).

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

The output in `dist/` can be served via any static file server.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code conventions, and the pull request process.

## License

MIT — see [LICENSE](LICENSE).
