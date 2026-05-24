import { ref } from 'vue'

const DB = ref({ ores: {}, alloys: {}, items: {}, mining: {}, planets: {} })
const ORDER = ref({ ores: [], alloys: [], items: [], mining: [], planets: [] })
const TYPES = ref({})

export function getEntity(id) {
  return DB.value.ores[id] || DB.value.alloys[id] || DB.value.items[id] || DB.value.mining[id]
}

export async function loadData() {
  const [ores, alloys, items, mining, planets] = await Promise.all([
    fetch('data/ores.json').then(r => r.json()),
    fetch('data/alloys.json').then(r => r.json()),
    fetch('data/items.json').then(r => r.json()),
    fetch('data/mining.json').then(r => r.json()),
    fetch('data/planets.json').then(r => r.json()),
  ])

  const db = { ores: {}, alloys: {}, items: {}, mining: {}, planets: {} }
  const order = { ores: [], alloys: [], items: [], mining: [], planets: [] }
  const types = {}

  for (const o of ores) { db.ores[o.id] = { ...o, type: 'ore' }; order.ores.push(o.id); types[o.id] = 'ore' }
  for (const a of alloys) { db.alloys[a.id] = { ...a, type: 'alloy' }; order.alloys.push(a.id); types[a.id] = 'alloy' }
  for (const i of items) { db.items[i.id] = { ...i, type: 'item' }; order.items.push(i.id); types[i.id] = 'item' }
  for (const m of mining) { const id = 'lvl' + m.level; db.mining[id] = { ...m, id, name: 'Level ' + m.level, type: 'mining' }; order.mining.push(id); types[id] = 'mining' }
  for (const p of planets) { db.planets[p.id] = { ...p, type: 'planet' }; order.planets.push(p.id); types[p.id] = 'planet' }

  DB.value = db
  ORDER.value = order
  TYPES.value = types

  return { oresCount: ores.length, alloysCount: alloys.length, itemsCount: items.length, miningCount: mining.length, planetsCount: planets.length }
}

export function useData() {
  return { DB, ORDER, TYPES, getEntity }
}
