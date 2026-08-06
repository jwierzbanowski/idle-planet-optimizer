# Idle Planet Optimizer — Documentation

Idle Planet Optimizer is a browser-based calculator for **Idle Planet Miner**. It reads the raw game data shipped with the app and computes crafting, smelting, and mining rates so you can plan the most profitable way to play.

The app runs entirely in your browser. All data lives locally (game JSON files bundled with the app), and everything you configure is saved in your browser's `localStorage`.

## Quick start

1. Open the app (see the [homepage](https://jwierzbanowski.github.io/idle-planet-optimizer/)).
2. Set up your state in the **Profile** modal: [Rooms](profile/rooms.md), [Station](profile/station.md), [Beacon](profile/beacon.md), [Managers](profile/managers.md), [Badges](profile/badges.md), [Ships](profile/ships.md), and [Modules](profile/modules.md).
3. Open **Game** and tick the [projects](game.md) you have completed for your current playthrough.
4. Use **Supply & Demand** to pin resources and set their [current market change](supply-and-demand.md).
5. Browse the **Ores**, **Alloys**, **Items**, and **Mining** tabs to see production and profit update live.

> All changes are saved automatically. Use the **Backup ▾ Export** button regularly to keep a JSON backup of your configuration.

## Documentation index

| Section | What it covers |
| --- | --- |
| [Profile](profile/README.md) | The Profile modal — Rooms, Station, Beacon, Managers, Badges, Ships, and Modules (each with its own page). |
| [Game](game.md) | Projects for the current playthrough. |
| [Reset](reset.md) | Clearing temporary playthrough data. |
| [Backup](backup.md) | Export/import JSON backups, storage keys, bundled data files. |
| [Multipliers](multipliers.md) | The ten multiplier values and the factors behind each. |
| [Supply & Demand](supply-and-demand.md) | Overriding the current market change of resources. |
| [Tabs](tabs/README.md) | Introduction to the tabs — construction and shared concepts — plus dedicated pages for [Ores](tabs/ores.md), [Alloys](tabs/alloys.md), [Items](tabs/items.md), [Mining](tabs/mining.md), and [Credits](tabs/credits.md). |

## Features

- **Roadmap** — a session-based, ordered list of the most profitable mining upgrades.
- **Mining tab** — per-planet levels, colonies, probes, rovers, managers, ore targeting, and alchemy.
- **Ores, Alloys & Items tabs** — resources, smelting, and crafting with profit per second.
- **Credits tab** — milestone reward tracker per galaxy run with a goal calculator.
- **Supply & Demand panel** — search and select any ore, alloy, or item, then override its current market change; the values flow into every tab above.
- **Profile configuration** — rooms, station, beacon, managers, badges, ships, and modules, each on its own page.
- **Modules** — four slots (Drill, Transport, Synth, Remote) for tracking your modules with rarity, level, a base multiplier preview, and **substats** that feed into the calculator (mining speed, smelt/craft speed, and effective price on the enabled Drill and Synth slots).
- **Game configuration** — tick the projects completed in your current playthrough, managers and pinned items too.
- **Multipliers bar** — live summary of all ten speed, cost, and value multipliers, each with a full breakdown tooltip.
- **Reset playthrough** — one click clears temporary data (projects, market overrides, mining setup) while keeping profile and managers.
- **Backup & restore** — export/import the full configuration as JSON; all state also persists in `localStorage`.

### Tips

- **Faster steppers** — hold `Ctrl` (+5), `Shift` (+10), or `Ctrl+Shift` (+50) while clicking a ± stepper; you can also type a value directly into most number inputs.
- **Max Lv** — on the Mining tab, the highest mining level that pays back within the current session; click it to apply instantly.
