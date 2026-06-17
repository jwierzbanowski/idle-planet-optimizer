import { ref } from 'vue'

export const DB = ref({ ores: {}, alloys: {}, items: {}, mining: {}, planets: {} })
export const ORDER = ref({ ores: [], alloys: [], items: [], mining: [], planets: [] })

export function getEntity(id) {
  return DB.value.ores[id] || DB.value.alloys[id] || DB.value.items[id] || DB.value.mining[id]
}
