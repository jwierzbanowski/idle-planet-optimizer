import { reactive, ref } from 'vue'
import { SETTINGS_CONFIG } from '../utils/config'

function loadSettings() {
  try { return JSON.parse(localStorage.getItem('ipm_settings')) || {} }
  catch { return {} }
}

function saveSettings(s) {
  localStorage.setItem('ipm_settings', JSON.stringify(s))
}

const raw = loadSettings()
if (!Array.isArray(raw.managers)) raw.managers = []
// Migrate old format (with 'skill' and 'value') to new format
let migrated = false
for (let i = 0; i < raw.managers.length; i++) {
  const m = raw.managers[i]
  if (m.skill !== undefined) {
    const oldSkill = m.skill
    const mgr = { primarySkill: 'mineRate', secondarySkill: 'empty', stars: 1 }
    if (oldSkill === 'allSmeltSpeed' || oldSkill === 'allCraftSpeed') {
      mgr.secondarySkill = oldSkill
    }
    raw.managers[i] = mgr
    migrated = true
  }
}
if (migrated) saveSettings(raw)
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
    settings.managers.push({ primarySkill: 'mineRate', secondarySkill: 'empty', stars: 1 })
    _managerVersion.value++
    saveSettings(settings)
  }

  function removeManager(index) {
    if (!settings.managers) return
    settings.managers.splice(index, 1)
    _managerVersion.value++
    saveSettings(settings)
  }

  function updateManagerStars(index, stars) {
    if (!settings.managers || !settings.managers[index]) return
    settings.managers[index].stars = Math.max(1, Math.min(7, stars))
    const m = settings.managers[index]
    if (m.stars < 3) {
      m.secondarySkill = 'empty'
    } else if (m.secondarySkill === 'empty') {
      m.secondarySkill = 'allMineRate'
    }
    _managerVersion.value++
    saveSettings(settings)
  }

  function updateManagerPrimarySkill(index, skill) {
    if (!settings.managers || !settings.managers[index]) return
    settings.managers[index].primarySkill = skill
    _managerVersion.value++
    saveSettings(settings)
  }

  function updateManagerSecondarySkill(index, skill) {
    if (!settings.managers || !settings.managers[index]) return
    settings.managers[index].secondarySkill = skill
    _managerVersion.value++
    saveSettings(settings)
  }

  function setPinnedItems(list) {
    settings.pinnedItems = list
    saveSettings(settings)
  }

  return { settings, getRawSetting, setSetting, getManagers, addManager, removeManager, updateManagerStars, updateManagerPrimarySkill, updateManagerSecondarySkill, managerVersion: _managerVersion, setPinnedItems }
}
