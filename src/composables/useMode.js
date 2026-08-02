import { ref } from 'vue'

const panelMode = ref('advanced')

export function useMode() {
  return { panelMode }
}
