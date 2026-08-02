# Idle Planet Optimizer — Documentation

Idle Planet Optimizer is a browser-based calculator for **Idle Planet Miner**. It reads the raw game data shipped with the app and computes crafting, smelting, and mining rates so you can plan the most profitable way to play.

The app runs entirely in your browser. All data lives locally (game JSON files bundled with the app), and everything you configure is saved in your browser's `localStorage`.

## Quick start

1. Open the app (see the [homepage](https://jwierzbanowski.github.io/idle-planet-optimizer/)).
2. Set up your state in the **Profile** modal: [Rooms](profile/rooms.md), [Station](profile/station.md), [Beacon](profile/beacon.md), and [Managers](profile/managers.md).
3. Open **Game** and tick the [projects](game.md) you have completed for your current playthrough.
4. Use **Supply & Demand** to pin resources and set their [current market change](supply-and-demand.md).
5. Browse the **Ores**, **Alloys**, **Items**, and **Mining** tabs to see production and profit update live.

> All changes are saved automatically. Use the **Backup ▾ Export** button regularly to keep a JSON backup of your configuration.

## Documentation index

| Section | What it covers |
| --- | --- |
| [Profile](profile/README.md) | The Profile modal — Rooms, Station, Beacon, and Managers (each with its own page). |
| [Game](game.md) | Projects for the current playthrough. |
| [Reset](reset.md) | Clearing temporary playthrough data. |
| [Backup](backup.md) | Export/import JSON backups, storage keys, bundled data files. |
| [Multipliers](multipliers.md) | The ten multiplier values and the factors behind each. |
| [Supply & Demand](supply-and-demand.md) | Overriding the current market change of resources. |
| [Tabs](tabs/README.md) | Introduction to the tabs — construction and shared concepts — plus dedicated pages for [Ores](tabs/ores.md), [Alloys](tabs/alloys.md), [Items](tabs/items.md), and [Mining](tabs/mining.md). |

## Features at a glance

- **Ore, alloy, item & planet data browser** — the full resource catalog with prices, recipes, and yields.
- **Smelting calculator** — smelt time, material cost, and profit per second per alloy.
- **Crafting calculator** — craft time, material cost, and profit per second per item.
- **Mining table** — per-planet levels, colonies, probes, rovers, managers, ore targeting, and alchemy.
- **Multipliers bar** — live summary of all speed, cost, and value multipliers with full breakdown tooltips.
- **Supply & Demand panel** — pin any resource and override its market change.
- **Roadmap** — an ordered list of the most profitable mining upgrades for your current session.
- **Profile configuration** — rooms, stations, beacons, and managers.
- **Game progress tracker** — projects, managers, and pinned items per playthrough.
- **Backup & restore** — everything is persisted in the browser and can be exported/imported as JSON.

## About the screenshots

Screenshots referenced throughout these docs are expected to live in [`docs/screenshots/`](screenshots/README.md). If a referenced image is missing, drop the corresponding file into that folder using the filename given in the naming guide.
