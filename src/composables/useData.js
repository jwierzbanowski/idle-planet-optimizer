import { ref } from 'vue'

const DB = ref({ ores: {}, alloys: {}, items: {} })
const ORDER = ref({ ores: [], alloys: [], items: [] })
const TYPES = ref({})

export function getEntity(id) {
  return DB.value.ores[id] || DB.value.alloys[id] || DB.value.items[id]
}

export async function loadData() {
  const [ores, alloys, items] = await Promise.all([
    fetch('data/ores.json').then(r => r.json()),
    fetch('data/alloys.json').then(r => r.json()),
    fetch('data/items.json').then(r => r.json()),
  ])

  const db = { ores: {}, alloys: {}, items: {} }
  const order = { ores: [], alloys: [], items: [] }
  const types = {}

  for (const o of ores) { db.ores[o.id] = { ...o, type: 'ore' }; order.ores.push(o.id); types[o.id] = 'ore' }
  for (const a of alloys) { db.alloys[a.id] = { ...a, type: 'alloy' }; order.alloys.push(a.id); types[a.id] = 'alloy' }
  for (const i of items) { db.items[i.id] = { ...i, type: 'item' }; order.items.push(i.id); types[i.id] = 'item' }

  DB.value = db
  ORDER.value = order
  TYPES.value = types

  return { oresCount: ores.length, alloysCount: alloys.length, itemsCount: items.length }
}

export function useData() {
  return { DB, ORDER, TYPES, getEntity }
}
