import { reactive } from 'vue'
import { SETTINGS_CONFIG } from '../utils/config'

function loadSettings() {
  try { return JSON.parse(localStorage.getItem('ipm_settings')) || {} }
  catch { return {} }
}

function saveSettings(s) {
  localStorage.setItem('ipm_settings', JSON.stringify(s))
}

const settings = reactive(loadSettings())

export function useSettings() {
  function getRawSetting(cat, key) {
    return settings[cat]?.[key] ?? 0
  }

  function setSetting(cat, key, value) {
    const item = (SETTINGS_CONFIG[cat] || []).find(i => i.key === key)
    const max = item?.maxLevel
    if (max != null) value = Math.min(value, max)
    value = Math.max(0, value)
    if (!settings[cat]) settings[cat] = {}
    settings[cat][key] = value
    saveSettings(settings)
  }

  return { settings, getRawSetting, setSetting }
}
