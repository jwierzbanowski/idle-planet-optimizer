# Profile — Station

![Profile modal — Station](../screenshots/02-profile-station.png)

The **Station** tab holds the levels of all station groups. Station levels stack to produce the speed and value multipliers used across the app.

## Planets

### Mining

| Station | Effect | Per level | Max level |
| --- | --- | --- | --- |
| Mining 1 | Mine speed | +0.02 | 4 |
| Mining 2 | Mine speed | +0.10 | 25 |
| Global 1.2× | Mine speed ×1.2 | toggle | — |

### Planet Cost

| Station | Effect | Per level | Max level |
| --- | --- | --- | --- |
| Planet Cost 1 | Planet upgrade cost reduction | −0.50% | 1 |
| Planet Cost 2 | Planet upgrade cost reduction | −0.25% | 2 |
| Planet Cost 3 | Planet upgrade cost reduction | −0.50% | 3 |
| Planet Cost 4 | Planet upgrade cost reduction | −0.50% | 4 |
| Planet Cost 5 | Planet upgrade cost reduction | −0.75% | 4 |

## Crafting

| Station | Effect | Per level | Max level |
| --- | --- | --- | --- |
| Crafting 1 | Craft speed | +0.01 | 5 |
| Crafting 2 | Craft speed | +0.01 | 10 |
| Crafting 3 | Craft speed | +0.01 | 15 |
| Crafting 4 | Craft speed | +0.02 | 20 |
| Crafting 5 | Craft speed | +0.04 | 20 |

## Smelting

| Station | Effect | Per level | Max level |
| --- | --- | --- | --- |
| Smelting 1 | Smelt speed | +0.01 | 5 |
| Smelting 2 | Smelt speed | +0.01 | 10 |
| Smelting 3 | Smelt speed | +0.01 | 15 |
| Smelting 4 | Smelt speed | +0.02 | 20 |
| Smelting 5 | Smelt speed | +0.04 | 20 |

## Alloy & Item

| Station | Effect | Per level | Max level |
| --- | --- | --- | --- |
| Alloy & Item 1 | Alloy/Item value | +0.036 | 5 |
| Alloy & Item 2 | Alloy/Item value | +0.08 | 5 |
| Alloy & Item 3 | Alloy/Item value | +0.08 | 5 |
| Alloy & Item 4 | Alloy/Item value | +0.02 | 4 |
| Alloy & Item 5 | Alloy/Item value | +0.02 | 4 |
| Alloy & Item 6 | Alloy/Item value | +0.075 | 2 |
| Alloy & Item 7 | Alloy/Item value | +0.075 | 2 |

## Market

| Station | Effect | Per level | Max level |
| --- | --- | --- | --- |
| Market 1 | Market value | +0.04 | 5 |
| Market 2 | Market value | +0.05 | 5 |
| Market 3 | Market value | +0.05 | 5 |
| Market 4 | Market value | +0.05 | 4 |
| Market 5 | Market value | +0.05 | 4 |
| Market 6 | Market value | +0.175 | 2 |
| Market 7 | Market value | +0.175 | 2 |

## Manager

| Station | Effect | Per level | Max level |
| --- | --- | --- | --- |
| Manager 1 | Manager effects | +0.012 | 5 |
| Manager 2 | Manager effects | +0.055 | 4 |
| Manager 3 | Manager effects | +0.055 | 4 |
| Manager 4 | Manager effects | +0.005 | 4 |
| Manager 5 | Manager effects | +0.005 | 6 |
| Manager 6 | Manager effects | +0.005 | 8 |
| Manager 7 | Manager effects | +0.06 | 1 |
| Manager 8 | Manager effects | +0.005 | 10 |

## How stations combine

- **Craft speed** = product of the active Crafting 1–5 station multipliers, combined with the Workshop room, craft projects, and ships.
- **Smelt speed** = product of the active Smelting 1–5 station multipliers, combined with the Forge room, smelt projects, and ships.
- **Mine speed** = product of Mining 1, Mining 2, and the Global 1.2× toggle, combined with the Engineering room, mining projects, and ships.
- **Alloy/Item value** = product of the Alloy & Item 1–7 station multipliers, combined with the Sales room, value projects, and ships.
- **Planet cost** = product of the Planet Cost 1–5 station reductions, combined with the Astronomy room (higher = cheaper upgrades).
- **Market value** = product of the Market 1–7 station multipliers, combined with the Marketing room.
- **Manager effects** = product of the Manager 1–8 station multipliers, combined with the Classroom room, Manager Training projects, and ships.

Each station shows its current multiplier next to the level control. Turned off stations contribute nothing.

## Recommendations

Within each station group, the station that gives the best **gain per cost** (next level's effect ÷ its cost) is marked with a **Recommended** badge. The recommendation recomputes live as you change station levels.
