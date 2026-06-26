import { DB, ORDER, getEntity } from '../utils/registry'

export async function loadData() {
  const [ores, alloys, items, mining, planets] = await Promise.all([
    fetch('data/ores.json').then((r) => r.json()),
    fetch('data/alloys.json').then((r) => r.json()),
    fetch('data/items.json').then((r) => r.json()),
    fetch('data/mining.json').then((r) => r.json()),
    fetch('data/planets.json').then((r) => r.json()),
  ])

  const order = { ores: [], alloys: [], items: [], mining: [], planets: [] }

  for (const o of ores) {
    DB.value.ores[o.id] = { ...o, type: 'ore' }
    order.ores.push(o.id)
  }
  for (const a of alloys) {
    DB.value.alloys[a.id] = { ...a, type: 'alloy' }
    order.alloys.push(a.id)
  }
  for (const i of items) {
    DB.value.items[i.id] = { ...i, type: 'item' }
    order.items.push(i.id)
  }
  for (const m of mining) {
    const id = 'lvl' + m.level
    DB.value.mining[id] = { ...m, id, name: 'Level ' + m.level, type: 'mining' }
    order.mining.push(id)
  }
  for (const p of planets) {
    DB.value.planets[p.id] = { ...p, type: 'planet' }
    order.planets.push(p.id)
  }

  ORDER.value = order

  return {
    oresCount: ores.length,
    alloysCount: alloys.length,
    itemsCount: items.length,
    miningCount: mining.length,
    planetsCount: planets.length,
  }
}

export function useData() {
  return { DB, ORDER, getEntity }
}
