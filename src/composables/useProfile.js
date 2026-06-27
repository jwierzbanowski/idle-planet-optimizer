import { reactive } from 'vue'
import { SETTINGS_CONFIG } from '../utils/config'
import { useOverrides } from './useOverrides'

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
    const { overrides } = useOverrides()
    const stars = {}
    for (const [id, data] of Object.entries(overrides)) {
      if (data.stars) stars[id] = data.stars
    }
    const data = {
      rooms: profile.rooms || {},
      station: profile.station || {},
      beacon: profile.beacon || {},
      stars,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date()
    const ts = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + '_' + String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0') + '-' + String(now.getSeconds()).padStart(2, '0')
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

    // Restore stars
    if (data.stars && typeof data.stars === 'object') {
      const { setOverride } = useOverrides()
      for (const [id, stars] of Object.entries(data.stars)) {
        if (typeof stars === 'number' && stars > 0) {
          setOverride(id, 'stars', Math.max(0, Math.min(7, stars)))
        }
      }
    }
  }

  return { profile, getRawSetting, setSetting, exportProfile, importProfile }
}
