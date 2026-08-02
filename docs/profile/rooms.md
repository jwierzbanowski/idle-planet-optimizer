# Profile — Rooms

![Profile modal — Rooms](../screenshots/06-profile-rooms.png)

The **Rooms** tab lists all nine rooms. Each room has a level (adjusted with **− / +**) and produces a multiplier that feeds the [Multipliers bar](../multipliers.md).

| Room | Effect | Base effect | Per level | Max level |
| --- | --- | --- | --- | --- |
| **Engineering** | Mine Rate | 1.25 | +0.15 | 60 |
| **Forge** | Smelt Speed | 1.2 | +0.10 | 60 |
| **Workshop** | Craft Speed | 1.2 | +0.10 | 60 |
| **Underforge** | Smelting Prices (reduces cost) | 0.90 | −0.04 | 11 |
| **Dorms** | Crafting Prices (reduces cost) | 0.90 | −0.04 | 11 |
| **Sales** | Alloy/Item Values | 1.15 | +0.05 | 60 |
| **Astronomy** | Planet Upgrade Prices (reduces cost) | 0.90 | −0.04 | 11 |
| **Classroom** | Manager Effects | 1.15 | +0.05 | 60 |
| **Marketing** | All positive market change bonuses | 1.30 | +0.10 | 60 |

## What each room feeds

- **Engineering** → the **Mine Rate** multiplier used by the Ores and Mining tables.
- **Forge** → the **Smelt** speed multiplier for alloys.
- **Workshop** → the **Craft** speed multiplier for items.
- **Underforge** → the **Smelt Cost** multiplier (higher level = cheaper smelting).
- **Dorms** → the **Craft Cost** multiplier (higher level = cheaper crafting).
- **Sales** → the **Alloy Value** and **Item Value** multipliers.
- **Astronomy** → the **Planet Cost** multiplier (higher level = cheaper planet upgrades).
- **Classroom** → the **Manager** multiplier that scales all manager effects.
- **Marketing** → the **Market Change** multiplier that boosts positive market changes in the [Supply & Demand panel](../supply-and-demand.md).

## Notes

- Rooms with a base effect **below 1** (Underforge, Dorms, Astronomy) are cost reductions — the displayed multiplier drops below `1.00×` as you level them.
- The effect shown is the multiplier at the current level. Setting a room to 0 disables it.
