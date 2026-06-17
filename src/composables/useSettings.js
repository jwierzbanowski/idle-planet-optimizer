import { reactive, ref } from 'vue'
import { SETTINGS_CONFIG, MANAGER_SKILLS } from '../utils/config'

function loadSettings() {
  try { return JSON.parse(localStorage.getItem('ipm_settings')) || {} }
  catch { return {} }
}

function saveSettings(s) {
  localStorage.setItem('ipm_settings', JSON.stringify(s))
}

const raw = loadSettings()
if (!Array.isArray(raw.managers)) raw.managers = []
const settings = reactive(raw)

// Force reactivity for manager array mutations
const _managerVersion = ref(0)

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

  // Manager CRUD
  function getManagers() {
    return settings.managers
  }

  function addManager() {
    if (!settings.managers) settings.managers = []
    settings.managers.push({ skill: 'empty', value: 1.1 })
    _managerVersion.value++
    saveSettings(settings)
  }

  function removeManager(index) {
    if (!settings.managers) return
    settings.managers.splice(index, 1)
    _managerVersion.value++
    saveSettings(settings)
  }

  function updateManagerSkill(index, skill) {
    if (!settings.managers || !settings.managers[index]) return
    settings.managers[index].skill = skill
    _managerVersion.value++
    saveSettings(settings)
  }

  function updateManagerValue(index, value) {
    if (!settings.managers || !settings.managers[index]) return
    const n = parseFloat(value)
    if (isNaN(n) || n <= 0) {
      settings.managers[index].value = 0.01
    } else {
      settings.managers[index].value = n
    }
    _managerVersion.value++
    saveSettings(settings)
  }

  function setPinnedItems(list) {
    settings.pinnedItems = list
    saveSettings(settings)
  }

  return { settings, getRawSetting, setSetting, getManagers, addManager, removeManager, updateManagerSkill, updateManagerValue, managerVersion: _managerVersion, setPinnedItems }
}
