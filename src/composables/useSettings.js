import { reactive, computed } from 'vue'
import { useProfile } from './useProfile'
import { useGame } from './useGame'
import { MODULES } from '../utils/registry'
import { useOverrides } from './useOverrides'

// Clean up old single-key format after both composables have migrated
if (
  localStorage.getItem('ipm_settings') &&
  localStorage.getItem('ipm_profile') &&
  localStorage.getItem('ipm_game')
) {
  localStorage.removeItem('ipm_settings')
}

const { profile } = useProfile()
const { getFullPerX } = useOverrides()
const {
  game,
  managerVersion,
  setPinnedItems,
  getRawSetting,
  setSetting,
  getManagers,
  addManager,
  removeManager,
  updateManagerStars,
  updateManagerPrimarySkill,
  updateManagerSecondarySkill,
} = useGame()

const settings = reactive({
  rooms: computed(() => profile.rooms || {}),
  station: computed(() => profile.station || {}),
  beacon: computed(() => profile.beacon || {}),
  ships: computed(() => profile.ships || {}),
  projects: computed(() => game.projects || {}),
  managers: computed(() => game.managers || []),
  pinnedItems: computed(() => game.pinnedItems || []),
  modules: computed(() => profile.modules || {}),
  modulesData: computed(() => MODULES.value),
  modulePerX: computed(() => getFullPerX()),
})

export function useSettings() {
  return {
    settings,
    managerVersion,
    setPinnedItems,
    getRawSetting,
    setSetting,
    getManagers,
    addManager,
    removeManager,
    updateManagerStars,
    updateManagerPrimarySkill,
    updateManagerSecondarySkill,
  }
}
