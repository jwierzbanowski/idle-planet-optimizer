import { reactive, ref } from 'vue'
import { SETTINGS_CONFIG } from '../utils/config'

const STORAGE_KEY = 'ipm_game'
const OLD_KEY = 'ipm_settings'

function loadGame() {
  if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(OLD_KEY)) {
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY))
      if (old && typeof old === 'object') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            projects: old.projects || {},
            managers: Array.isArray(old.managers) ? old.managers : [],
            pinnedItems: Array.isArray(old.pinnedItems) ? old.pinnedItems : [],
          })
        )
      }
    } catch (e) {
      console.warn('Game migration failed:', e)
    }
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveGame(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

const raw = loadGame()
if (!Array.isArray(raw.managers)) raw.managers = []
// Migrate old format (with 'skill' and 'value') to new format
let migrated = false
for (let i = 0; i < raw.managers.length; i++) {
  const m = raw.managers[i]
  if (m.skill !== undefined) {
    const mgr = { primarySkill: 'mineRate', secondarySkill: 'empty', stars: 1 }
    if (m.skill === 'allSmeltSpeed' || m.skill === 'allCraftSpeed') {
      mgr.secondarySkill = m.skill
    }
    raw.managers[i] = mgr
    migrated = true
  }
}
if (migrated) saveGame(raw)
const game = reactive(raw)

const _managerVersion = ref(0)

export function useGame() {
  function getRawSetting(cat, key) {
    return game[cat]?.[key] ?? 0
  }

  function setSetting(cat, key, value) {
    const item = (SETTINGS_CONFIG[cat] || []).find((i) => i.key === key)
    const max = item?.maxLevel
    if (max != null) value = Math.min(value, max)
    value = Math.max(0, value)
    if (!game[cat]) game[cat] = {}
    game[cat][key] = value
    saveGame(game)
  }

  function getManagers() {
    return game.managers
  }

  function addManager() {
    if (!game.managers) game.managers = []
    game.managers.push({ primarySkill: 'mineRate', secondarySkill: 'empty', stars: 1 })
    _managerVersion.value++
    saveGame(game)
  }

  function removeManager(index) {
    if (!game.managers) return
    game.managers.splice(index, 1)
    _managerVersion.value++
    saveGame(game)
  }

  function updateManagerStars(index, stars) {
    if (!game.managers || !game.managers[index]) return
    game.managers[index].stars = Math.max(1, Math.min(7, stars))
    const m = game.managers[index]
    if (m.stars < 3) {
      m.secondarySkill = 'empty'
    } else if (m.secondarySkill === 'empty') {
      m.secondarySkill = 'allMineRate'
    }
    _managerVersion.value++
    saveGame(game)
  }

  function updateManagerPrimarySkill(index, skill) {
    if (!game.managers || !game.managers[index]) return
    game.managers[index].primarySkill = skill
    _managerVersion.value++
    saveGame(game)
  }

  function updateManagerSecondarySkill(index, skill) {
    if (!game.managers || !game.managers[index]) return
    game.managers[index].secondarySkill = skill
    _managerVersion.value++
    saveGame(game)
  }

  function setPinnedItems(list) {
    game.pinnedItems = list
    saveGame(game)
  }

  function resetGame() {
    game.projects = {}
    game.managers = []
    game.pinnedItems = []
    _managerVersion.value++
    saveGame(game)
  }

  return {
    game,
    getRawSetting,
    setSetting,
    getManagers,
    addManager,
    removeManager,
    updateManagerStars,
    updateManagerPrimarySkill,
    updateManagerSecondarySkill,
    managerVersion: _managerVersion,
    setPinnedItems,
    resetGame,
  }
}
