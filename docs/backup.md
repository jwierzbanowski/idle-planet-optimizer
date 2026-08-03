# Backup

The **Backup ▾** button in the top bar manages your data as a JSON file. All configuration is otherwise stored only in your browser's `localStorage`.

## Export

**Export** downloads a JSON file named `profile-YYYY-MM-DD_HH-MM-SS.json` containing your full configuration:

- **Profile:** rooms, station, beacon levels, ships
- **Managers:** stars and skills
- **Overrides:** market changes, star ratings, mining levels, colonies, probes, rovers, ore targeting, alchemy
- **Manager assignments:** which manager is assigned to which planet
- **Game:** projects and pinned items

Use it to keep a backup on disk or to move your configuration to another browser/device.

## Import

**Import** lets you pick a previously exported JSON file and restores it:

1. Click **Backup ▾ → Import** and select the `.json` file.
2. The app validates the file (it must contain the `rooms`, `station`, and `beacon` sections).
3. All restored values are clamped to their valid ranges.

On a missing or malformed file, an error dialog appears and nothing is changed.

## Storage keys

State is stored under these browser `localStorage` keys:

| Key | Contents |
| --- | --- |
| `ipm_profile` | Rooms, station, beacon levels, ships. |
| `ipm_game` | Projects, managers, pinned items. |
| `ipm_overrides` | Market, stars, mining levels, colonies, probes, rovers, ore targeting, alchemy. |
| `ipm_manager_assign` | Manager-to-planet assignments. |

Clearing the site's `localStorage` (or using a private/incognito window) resets the app to its default state.

## Bundled game data

The app ships with the raw game data it calculates from, loaded from `public/data/`:

| File | Contents |
| --- | --- |
| `ores.json` | 27 ores (base prices, smelt recipes). |
| `alloys.json` | 28 alloys (smelt times, ingredients, prices). |
| `items.json` | 44 items (craft times, ingredients, prices). |
| `mining.json` | 100 mining level rates. |
| `planets.json` | 76 planets (resources, yields, base prices). |
