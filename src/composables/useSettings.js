import { reactive, computed } from 'vue'
import { useProfile } from './useProfile'
import { useGame } from './useGame'

// Clean up old single-key format after both composables have migrated
if (localStorage.getItem('ipm_settings') && localStorage.getItem('ipm_profile') && localStorage.getItem('ipm_game')) {
  localStorage.removeItem('ipm_settings')
}

const { profile } = useProfile()
const { game, managerVersion, setPinnedItems } = useGame()

const settings = reactive({
  rooms: computed(() => profile.rooms || {}),
  station: computed(() => profile.station || {}),
  beacon: computed(() => profile.beacon || {}),
  projects: computed(() => game.projects || {}),
  managers: computed(() => game.managers || []),
  pinnedItems: computed(() => game.pinnedItems || []),
})

export function useSettings() {
  return { settings, managerVersion, setPinnedItems }
}
