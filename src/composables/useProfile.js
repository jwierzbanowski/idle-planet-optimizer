import { reactive } from 'vue'
import { SETTINGS_CONFIG } from '../utils/config'
import { useOverrides } from './useOverrides'
import { useGame } from './useGame'

const STORAGE_KEY = 'ipm_profile'
const OLD_KEY = 'ipm_settings'

function loadProfile() {
  if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(OLD_KEY)) {
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY))
      if (old && typeof old === 'object') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            rooms: old.rooms || {},
            station: old.station || {},
            beacon: old.beacon || {},
          })
        )
      }
    } catch (e) {
      console.warn('Profile migration failed:', e)
    }
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveProfile(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

const profile = reactive(loadProfile())

export function useProfile() {
  function getRawSetting(cat, key) {
    return profile[cat]?.[key] ?? 0
  }

  function setSetting(cat, key, value) {
    const item = (SETTINGS_CONFIG[cat] || []).find((i) => i.key === key)
    const max = item?.maxLevel
    if (max != null) value = Math.min(value, max)
    value = Math.max(0, value)
    if (!profile[cat]) profile[cat] = {}
    profile[cat][key] = value
    saveProfile(profile)
  }

  function exportProfile() {
    const { overrides, managerAssign } = useOverrides()
    const { game } = useGame()
    const data = {
      rooms: profile.rooms || {},
      station: profile.station || {},
      beacon: profile.beacon || {},
      overrides: JSON.parse(JSON.stringify(overrides)),
      managerAssign: JSON.parse(JSON.stringify(managerAssign)),
      projects: game.projects || {},
      managers: game.managers || [],
      pinnedItems: game.pinnedItems || [],
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date()
    const ts =
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      '_' +
      String(now.getHours()).padStart(2, '0') +
      '-' +
      String(now.getMinutes()).padStart(2, '0') +
      '-' +
      String(now.getSeconds()).padStart(2, '0')
    a.download = 'profile-' + ts + '.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function importProfile(jsonStr) {
    let data
    try {
      data = JSON.parse(jsonStr)
    } catch {
      throw new Error('Invalid JSON file')
    }
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid profile data')
    }
    if (!data.rooms || !data.station || !data.beacon) {
      throw new Error('Missing required profile sections: rooms, station, beacon')
    }
    // Apply and clamp each value
    for (const cat of ['rooms', 'station', 'beacon']) {
      if (!profile[cat]) profile[cat] = {}
      const config = SETTINGS_CONFIG[cat] || []
      for (const item of config) {
        const raw = data[cat]?.[item.key]
        if (raw != null && typeof raw === 'number') {
          const max = item.maxLevel
          const val = max != null ? Math.min(raw, max) : Math.max(0, raw)
          profile[cat][item.key] = val
        }
      }
    }
    saveProfile(profile)

    // Restore overrides (new format — full override objects)
    const { setOverride, setManager } = useOverrides()
    if (data.overrides && typeof data.overrides === 'object') {
      for (const [id, vals] of Object.entries(data.overrides)) {
        if (vals && typeof vals === 'object') {
          for (const [field, val] of Object.entries(vals)) {
            if (val != null && val !== '') {
              setOverride(id, field, val)
            }
          }
        }
      }
    } else if (data.stars && typeof data.stars === 'object') {
      // Backward compatibility: old format with only stars
      for (const [id, stars] of Object.entries(data.stars)) {
        if (typeof stars === 'number' && stars > 0) {
          setOverride(id, 'stars', Math.max(0, Math.min(7, stars)))
        }
      }
    }

    // Restore manager assignments
    if (data.managerAssign && typeof data.managerAssign === 'object') {
      for (const [id, idx] of Object.entries(data.managerAssign)) {
        if (typeof idx === 'number') {
          setManager(id, idx)
        }
      }
    }

    // Restore game state
    const { game, saveGame, managerVersion } = useGame()
    if (data.projects && typeof data.projects === 'object') {
      game.projects = data.projects
    }
    if (Array.isArray(data.managers)) {
      game.managers = data.managers
      managerVersion.value++
    }
    if (Array.isArray(data.pinnedItems)) {
      game.pinnedItems = data.pinnedItems
    }
    saveGame(game)
  }

  return { profile, getRawSetting, setSetting, exportProfile, importProfile }
}
