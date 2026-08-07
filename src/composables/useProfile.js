import { reactive } from 'vue'
import {
  SETTINGS_CONFIG,
  SHIPS,
  MODULE_CATEGORY_KEYS,
  MAX_MODULE_LEVEL,
  MAX_MODULE_SUBSTATS,
} from '../utils/config'
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
            ships: old.ships || {},
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

function emptySubstats() {
  return Array.from({ length: MAX_MODULE_SUBSTATS }, () => ({ key: '', rarity: '' }))
}

function defaultModuleSlot() {
  return { special: true, module: null, rarity: null, level: 0, substats: emptySubstats() }
}

function normalizeSubstats(substats) {
  const out = emptySubstats()
  if (Array.isArray(substats)) {
    for (let i = 0; i < MAX_MODULE_SUBSTATS; i++) {
      const raw = substats[i]
      if (typeof raw === 'string') {
        out[i] = { key: raw, rarity: '' }
      } else if (raw && typeof raw === 'object') {
        out[i] = {
          key: typeof raw.key === 'string' ? raw.key : '',
          rarity: typeof raw.rarity === 'string' ? raw.rarity : '',
        }
      }
    }
  }
  return out
}

function ensureModuleSlots() {
  if (!profile.modules) profile.modules = {}
  for (const cat of MODULE_CATEGORY_KEYS) {
    const slot = profile.modules[cat]
    if (!slot || typeof slot !== 'object') {
      profile.modules[cat] = defaultModuleSlot()
    } else if (!Array.isArray(slot.substats)) {
      slot.substats = emptySubstats()
    } else if (
      slot.substats.some((s) => !s || typeof s !== 'object' || typeof s.key !== 'string')
    ) {
      slot.substats = normalizeSubstats(slot.substats)
    }
  }
  return profile.modules
}

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

  function getModuleSlots() {
    return ensureModuleSlots()
  }

  function setModuleSlot(cat, field, value) {
    const slots = ensureModuleSlots()
    if (!slots[cat]) slots[cat] = defaultModuleSlot()
    if (field === 'level') {
      value = Math.max(0, Math.min(MAX_MODULE_LEVEL, Number(value) || 0))
    }
    if (field === 'special') {
      value = Boolean(value)
    }
    slots[cat][field] = value
    saveProfile(profile)
  }

  function clearModuleSlot(cat) {
    const slots = ensureModuleSlots()
    slots[cat] = defaultModuleSlot()
    saveProfile(profile)
  }

  function setModuleSubstat(cat, index, key, rarity) {
    const slots = ensureModuleSlots()
    if (!slots[cat]) slots[cat] = defaultModuleSlot()
    if (!Array.isArray(slots[cat].substats)) slots[cat].substats = emptySubstats()
    if (index >= 0 && index < MAX_MODULE_SUBSTATS) {
      slots[cat].substats[index] = { key: key || '', rarity: rarity || '' }
      saveProfile(profile)
    }
  }

  function exportProfile() {
    const { overrides, managerAssign, modulePerX } = useOverrides()
    const { game } = useGame()
    const data = {
      rooms: profile.rooms || {},
      station: profile.station || {},
      beacon: profile.beacon || {},
      ships: profile.ships || {},
      modules: JSON.parse(JSON.stringify(ensureModuleSlots())),
      overrides: JSON.parse(JSON.stringify(overrides)),
      managerAssign: JSON.parse(JSON.stringify(managerAssign)),
      modulePerX: JSON.parse(JSON.stringify(modulePerX)),
      projects: game.projects || {},
      milestoneProjects: game.milestoneProjects || {},
      debrisOwned: game.debrisOwned || {},
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
    // Restore ships (owned toggles)
    if (data.ships && typeof data.ships === 'object') {
      if (!profile.ships) profile.ships = {}
      for (const ship of SHIPS) {
        const raw = data.ships[ship.key]
        if (typeof raw === 'number') {
          profile.ships[ship.key] = raw ? 1 : 0
        }
      }
    }
    // Restore module slots
    if (data.modules && typeof data.modules === 'object') {
      const slots = ensureModuleSlots()
      for (const cat of MODULE_CATEGORY_KEYS) {
        const raw = data.modules[cat]
        if (!raw || typeof raw !== 'object') continue
        const slot = defaultModuleSlot()
        if (typeof raw.special === 'boolean') slot.special = raw.special
        if (typeof raw.module === 'string') slot.module = raw.module
        if (typeof raw.rarity === 'string') slot.rarity = raw.rarity
        if (typeof raw.level === 'number') {
          slot.level = Math.max(0, Math.min(MAX_MODULE_LEVEL, raw.level))
        }
        slot.substats = normalizeSubstats(raw.substats)
        slots[cat] = slot
      }
    }
    saveProfile(profile)

    // Restore overrides (new format — full override objects)
    const { setOverride, setManager, setPerX } = useOverrides()
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

    // Restore module per-X values
    if (data.modulePerX && typeof data.modulePerX === 'object') {
      for (const [dep, val] of Object.entries(data.modulePerX)) {
        if (typeof val === 'number') {
          setPerX(dep, val)
        }
      }
    }

    // Restore game state
    const { game, saveGame, managerVersion } = useGame()
    if (data.projects && typeof data.projects === 'object') {
      game.projects = data.projects
    }
    if (data.milestoneProjects && typeof data.milestoneProjects === 'object') {
      game.milestoneProjects = data.milestoneProjects
    }
    if (data.debrisOwned && typeof data.debrisOwned === 'object') {
      game.debrisOwned = data.debrisOwned
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

  return {
    profile,
    getRawSetting,
    setSetting,
    getModuleSlots,
    setModuleSlot,
    clearModuleSlot,
    setModuleSubstat,
    exportProfile,
    importProfile,
  }
}
