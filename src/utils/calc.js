import { SETTINGS_CONFIG } from './config'
import { getEntity } from '../composables/useData'
import { fmtPrice, fmtTime, fmtQty } from './format'

function getStars(overrides, id) { return overrides[id]?.stars ?? 0 }
function getMarket(overrides, id) { return overrides[id]?.market ?? 1 }

export function getModifier(cat, key, settings) {
  const item = (SETTINGS_CONFIG[cat] || []).find(i => i.key === key)
  if (!item || item.baseEffect == null) return null
  const val = settings[cat]?.[key] ?? 0
  const capped = item.maxLevel != null ? Math.min(val, item.maxLevel) : val
  if (capped <= 0) return null
  return item.baseEffect + item.perLevel * (capped - 1)
}

function getProjectModifier(settings, key) {
  if (!settings.projects?.[key]) return null
  const item = SETTINGS_CONFIG.projects.find(i => i.key === key)
  if (!item || item.baseEffect == null) return null
  return item.baseEffect
}

export function getProjectMultiplier(settings, keys) {
  let mult = 1
  for (const key of keys) {
    const mod = getProjectModifier(settings, key)
    if (mod) mult *= mod
  }
  return mult > 1 ? mult : null
}

export function getStationMult(settings, keys) {
  let total = 0
  for (const key of keys) {
    const item = SETTINGS_CONFIG.station.find(i => i.key === key)
    if (!item || item.perLevel == null) continue
    const val = settings.station?.[key] ?? 0
    const capped = Math.min(val, item.maxLevel)
    total += item.perLevel * capped
  }
  return total > 0 ? 1 + total : null
}

export function getStationValueMult(settings) {
  const keys = ['alloyItem1','alloyItem2','alloyItem3','alloyItem4','alloyItem5','alloyItem6','alloyItem7']
  let total = 0
  for (const key of keys) {
    const item = SETTINGS_CONFIG.station.find(i => i.key === key)
    if (!item || item.perLevel == null) continue
    const val = settings.station?.[key] ?? 0
    const capped = Math.min(val, item.maxLevel)
    total += item.perLevel * capped
  }
  return total > 0 ? 1 + total : null
}

function getManagerMult(settings, skill) {
  const mgrs = settings.managers
  if (!Array.isArray(mgrs)) return null
  let mult = 1
  for (const m of mgrs) {
    if (m.skill === skill && m.value > 0) mult *= m.value
  }
  return mult > 1 ? mult : null
}

const BEACON_RANGES = [
  { min: 1, max: 4, key: 'beacon1_4' },
  { min: 5, max: 7, key: 'beacon5_7' },
  { min: 8, max: 10, key: 'beacon8_10' },
  { min: 11, max: 13, key: 'beacon11_13' },
  { min: 14, max: 16, key: 'beacon14_16' },
  { min: 17, max: 19, key: 'beacon17_19' },
  { min: 20, max: 22, key: 'beacon20_22' },
]

export function getBeaconMult(planetNumber, settings) {
  const range = BEACON_RANGES.find(r => planetNumber >= r.min && planetNumber <= r.max)
  if (!range) return 1
  const mod = getModifier('beacon', range.key, settings)
  return mod || 1
}

export function getMiningSpeedMult(settings) {
  let mult = 1
  const engMod = getModifier('rooms', 'engineering', settings)
  if (engMod) mult *= engMod
  const miningProj = getProjectMultiplier(settings, ['advancedMining', 'superiorMining'])
  if (miningProj) mult *= miningProj
  const stationMine = getStationMult(settings, ['mining1', 'mining2'])
  if (stationMine) mult *= stationMine
  if (settings.station?.miningGlobal) mult *= 1.2
  return mult > 1 ? mult : null
}

export function getSmeltSpeedMult(settings) {
  let mult = 1
  const forgeMod = getModifier('rooms', 'forge', settings)
  if (forgeMod) mult *= forgeMod
  const furnaceProj = getProjectMultiplier(settings, ['advancedFurnace', 'superiorFurnace'])
  if (furnaceProj) mult *= furnaceProj
  const stationSmelt = getStationMult(settings, ['smelting1', 'smelting2', 'smelting3', 'smelting4', 'smelting5'])
  if (stationSmelt) mult *= stationSmelt
  const mgrSmelt = getManagerMult(settings, 'allSmeltSpeed')
  if (mgrSmelt) mult *= mgrSmelt
  return mult > 1 ? mult : null
}

export function getCraftSpeedMult(settings) {
  let mult = 1
  const workshopMod = getModifier('rooms', 'workshop', settings)
  if (workshopMod) mult *= workshopMod
  const crafterProj = getProjectMultiplier(settings, ['advancedCrafter', 'superiorCrafter'])
  if (crafterProj) mult *= crafterProj
  const stationCraft = getStationMult(settings, ['crafting1', 'crafting2', 'crafting3', 'crafting4', 'crafting5'])
  if (stationCraft) mult *= stationCraft
  const mgrCraft = getManagerMult(settings, 'allCraftSpeed')
  if (mgrCraft) mult *= mgrCraft
  return mult > 1 ? mult : null
}

export function effectivePrice(id, overrides, settings) {
  const e = getEntity(id)
  if (!e) return 0
  let price = e.basePrice * (1 + 0.2 * getStars(overrides, id)) * getMarket(overrides, id)
  if (e.type === 'alloy' || e.type === 'item') {
    const salesMod = getModifier('rooms', 'sales', settings)
    if (salesMod) price *= salesMod
    const stnVal = getStationValueMult(settings)
    if (stnVal) price *= stnVal
    const valProjKeys = e.type === 'alloy' ? ['advancedAlloyValue', 'superiorAlloyValue'] : ['advancedItemValue', 'superiorItemValue']
    const valProj = getProjectMultiplier(settings, valProjKeys)
    if (valProj) price *= valProj
  }
  return price
}

export function calcMaterialCost(id, qty, overrides, settings, visited) {
  visited = visited || new Set()
  if (visited.has(id)) return 0
  visited.add(id)
  const e = getEntity(id)
  if (!e) return 0
  if (e.type === 'ore') {
    return effectivePrice(id, overrides, settings) * qty
  }
  if (!e.ingredients) return 0
  let cost = 0
  const underforgeMod = e.type === 'alloy' ? getModifier('rooms', 'underforge', settings) : null
  const dormMod = e.type === 'item' ? getModifier('rooms', 'dorm', settings) : null
  for (const ing of e.ingredients) {
    const ingQty = (underforgeMod || dormMod) ? ing.qty * (underforgeMod || dormMod) : ing.qty
    cost += effectivePrice(ing.id, overrides, settings) * ingQty * qty
  }
  return cost
}

export function calcTotalTime(id, qty, overrides, settings, visited) {
  visited = visited || new Set()
  if (visited.has(id)) return 0
  visited.add(id)
  const e = getEntity(id)
  if (!e || e.type === 'ore') return 0
  let t = (e.time || 0) * qty
  if (e.type === 'alloy' && e.time) {
    const smeltMult = getSmeltSpeedMult(settings)
    if (smeltMult) t = t / smeltMult
  }
  if (e.type === 'item' && e.time) {
    const craftMult = getCraftSpeedMult(settings)
    if (craftMult) t = t / craftMult
  }
  if (e.ingredients) {
    const underforgeMod2 = e.type === 'alloy' ? getModifier('rooms', 'underforge', settings) : null
    const dormMod2 = e.type === 'item' ? getModifier('rooms', 'dorm', settings) : null
    for (const ing of e.ingredients) {
      const ingQty = (underforgeMod2 || dormMod2) ? ing.qty * (underforgeMod2 || dormMod2) : ing.qty
      t += calcTotalTime(ing.id, ingQty * qty, overrides, settings, visited)
    }
  }
  return Math.round(t)
}

export function calcDirectIngredientCost(id, qty, overrides, settings) {
  const e = getEntity(id)
  if (!e || !e.ingredients) return 0
  let cost = 0
  for (const ing of e.ingredients) {
    cost += effectivePrice(ing.id, overrides, settings) * ing.qty * qty
  }
  return cost
}

export function buildTree(id, qty, overrides, settings, visited) {
  visited = visited || new Set()
  if (visited.has(id)) return null
  visited.add(id)
  const e = getEntity(id)
  if (!e) return null
  let effTime = e.time || 0
  if (e.type === 'alloy' && effTime) {
    const smeltMult = getSmeltSpeedMult(settings)
    if (smeltMult) effTime = effTime / smeltMult
  }
  if (e.type === 'item' && effTime) {
    const craftMult = getCraftSpeedMult(settings)
    if (craftMult) effTime = effTime / craftMult
  }
  const node = { id, name: e.name, type: e.type, qty, basePrice: e.basePrice, time: Math.round(effTime), children: [] }
  if (e.ingredients) {
    const ufMod = e.type === 'alloy' ? getModifier('rooms', 'underforge', settings) : null
    const dormMod3 = e.type === 'item' ? getModifier('rooms', 'dorm', settings) : null
    for (const ing of e.ingredients) {
      const ingQty = (ufMod || dormMod3) ? ing.qty * (ufMod || dormMod3) : ing.qty
      const child = buildTree(ing.id, ingQty * qty, overrides, settings, new Set(visited))
      if (child) node.children.push(child)
    }
  }
  return node
}

export function renderTree(node, overrides) {
  if (!node) return ''
  const stars = overrides[node.id]?.stars ?? 0
  const market = overrides[node.id]?.market ?? 1
  const starStr = stars > 0 ? ' <span style="color:#ffd54f">' + '★'.repeat(Math.min(stars, 5)) + (stars > 5 ? '+' + (stars - 5) : '') + '</span>' : ''
  const mktStr = market !== 1 ? ' <span style="color:#4fc3f7">x' + market + '</span>' : ''
  let html = '<div class="tree-node' + (node.children.length === 0 ? ' root' : '') + '">'
  html += '<div class="tree-item">'
  html += '<span class="tree-qty">' + (node.qty > 1 ? fmtQty(node.qty) + '×' : '') + '</span>'
  html += '<span class="tree-name">' + node.name + '</span>'
  html += '<span class="tree-price">' + fmtPrice(node.basePrice) + starStr + mktStr + '</span>'
  if (node.time > 0) html += '<span class="tree-time">' + fmtTime(node.time) + '</span>'
  html += '</div>'
  for (const child of node.children) html += renderTree(child, overrides)
  html += '</div>'
  return html
}
