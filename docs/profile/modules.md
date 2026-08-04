# Modules

The **Modules** tab in the [Profile](README.md) modal holds your module setup. Modules come in four categories — **Drill**, **Transport**, **Synth**, and **Remote** — and the Profile gives you **one slot per category**.

![Profile modal, Modules tab](../screenshots/18-profile-modules.png)

## Slots

Each slot corresponds to one category:

| Slot | Category modules |
| --- | --- |
| **Drill** | Trifact Drill, Adaptive Drill, Exploration Drill, Mercurial Drill |
| **Transport** | Beam Highways, Ark Network, Fleet Consul, Personal Pulse |
| **Synth** | Market Crawler, Burst Injector, Ore Classifier, Incubation Suite |
| **Remote** | Scan Harmonizer, Belt Sonar, Remote Scanner, Probe Dock |

> **Not available for calculation:** the **Transport** and **Remote** slots are currently **disabled** — the whole card is greyed out and crossed out, and none of its controls can be used. Their effects are not yet implemented in the calculator, so they are disabled so you don't plan around them. Saved profiles that already reference a Transport/Remote module keep displaying it, but the card can't be edited.

## Special (S) toggle

Every slot has a **Special (S)** checkbox, which is **enabled by default**:

- **Special (S)** — the module is one of the unique modules from the table above. The rarity list is limited to **Epic and above** (Epic, Epic+, Legendary, Legendary+, Mythic, Mythic+, Ancestral), and the slot shows the unique effect text for the selected rarity tier. The values that change with the rarity tier (numbers, percents, multipliers) are highlighted in **green**.
- **Regular** — a generic module without a unique effect. The full rarity scale is available (Common, Rare, Rare+, Epic, Epic+, Legendary, Legendary+, Mythic, Mythic+, Ancestral), and it can be upgraded from Rare.

When you select a new module, the rarity is set automatically — **Epic** for Special modules, **Common** for Regular ones — and the level starts at **1**. (This only applies to the enabled **Drill** and **Synth** slots — see the note above.)

Rarities are color-coded: **Common** gray, **Rare** blue, **Epic** purple, **Legendary** orange, **Mythic** red, **Ancestral** green (a `+` variant uses the color of its base rarity). The rarity picker shows the selected rarity in its color.

## Level

Each slot has its own level, adjusted with the **− / +** steppers (hold `Ctrl`/`Shift` for bigger steps — see [keyboard shortcuts](../README.md)). The maximum level is **300**.

## Base multiplier preview

The slot shows the **base multiplier** for the selected rarity at the current level. The multiplier applies to a different stat depending on the category:

| Slot | Multiplier stat |
| --- | --- |
| **Drill** | Mining |
| **Transport** | Ship speed & Cargo |
| **Synth** | Smelt & Craft speed |
| **Remote** | Credits |

The value comes from the module level table bundled in `public/data/modules.json`:

- Multipliers exist for **Rare and above** (Rare, Rare+, Epic, Epic+, Legendary, Legendary+, Mythic).
- For **Common** there is no data, and **Mythic+ / Ancestral** are not yet verified — for those the preview shows **—**.
- Between recorded levels the value is interpolated; above the highest recorded level the preview shows **—**.

The multiplier preview is informational only — it is **not** yet wired into the [Multipliers bar](../multipliers.md).

## Substats

Once a module is selected, the slot shows a **Substats** section with a fixed list of **6** slots. Clicking an unlocked slot opens the dialog listing the available substats from the category pool (Drill, Transport, Synth, and Remote each have their own substat list — e.g. Mining Colony Bonus, Ship Speed, Smelt Speed per Beam, Asteroid Frequency).

The first two slots are always available. Each additional slot unlocks when the module reaches a minimum **level** and **rarity**:

| Slot | Requirement |
| --- | --- |
| 1–2 | always available |
| 3 | level **41+** and **Rare or higher** |
| 4 | level **101+** and **Legendary or higher** |
| 5 | level **141+** and **Mythic or higher** |
| 6 | level **161+** and **Mythic+ or higher** |

Locked slots are greyed out and show the requirement (e.g. `Locked · Lv 41 · Rare+`); they become clickable once the level/rarity is met. A locked slot keeps any substat already stored on it — raise the level again to edit or remove it.

- Clicking an unlocked slot opens the dialog; picking an entry sets (or replaces) the substat **at that slot**; a **×** button removes it again.
- Each **rarity variant** of a substat is its own entry in the dialog — e.g. for an Epic module, Mining Colony Bonus appears three times (Common, Rare, Epic), each with its value.
- **Filter bubbles** at the top of the dialog show one rarity at a time — click a bubble to show only that rarity, click it again to show all.
- A **variant already on the list is not offered again** — if e.g. Mining Colony Bonus @ Epic is already selected, the dialog hides that exact variant (Common/Rare variants of the same substat remain available). Substats only apply to the enabled **Drill** and **Synth** slots — the **Transport** and **Remote** cards are disabled entirely (see [Slots](#slots)), so no substats can be added there.
- Only substats that exist **at or below the module's rarity** are shown — e.g. an Epic module won't list substats that only roll at Legendary+, and no variant above the module's rarity is offered.
- Variant values are formatted as:
  - multipliers are shown as `1.07×`,
  - per-unit bonuses are shown as in the sheet (e.g. `0.002, Max 1.45x`),
  - reductions are shown as percentages (e.g. `-2.5%`),
  - if the substat has no value at that rarity, it shows **—**.
