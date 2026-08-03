import { SETTINGS_CONFIG, SECONDARY_EFFECTS } from './config'
import { getEntity } from './registry'

function getStars(overrides, id) {
  return overrides[id]?.stars ?? 0
}
function getMarket(overrides, id) {
  return overrides[id]?.market ?? 1
}

export function getModifier(cat, key, settings) {
  const item = (SETTINGS_CONFIG[cat] || []).find((i) => i.key === key)
  if (!item || item.baseEffect == null) return null
  const val = settings[cat]?.[key] ?? 0
  const capped = item.maxLevel != null ? Math.min(val, item.maxLevel) : val
  if (capped <= 0) return null
  return item.baseEffect + item.perLevel * (capped - 1)
}

export function getMarketingMult(settings) {
  return getModifier('rooms', 'marketing', settings)
}

export function effectiveMarketVal(market, settings) {
  if (market <= 1) return market
  const mult = getMarketingMult(settings)
  return mult != null ? market * mult : market
}

function getProjectModifier(settings, key) {
  if (!settings.projects?.[key]) return null
  const item = SETTINGS_CONFIG.projects.find((i) => i.key === key)
  if (!item || item.baseEffect == null) return null
  return item.baseEffect
}

export function getIngredientMod(type, settings) {
  let mod = null
  if (type === 'alloy') {
    mod = getModifier('rooms', 'underforge', settings)
    const proj = getProjectModifier(settings, 'smeltingEfficiency')
    if (proj) mod = mod != null ? mod * proj : proj
  } else if (type === 'item') {
    mod = getModifier('rooms', 'dorm', settings)
    const proj = getProjectModifier(settings, 'craftingEfficiency')
    if (proj) mod = mod != null ? mod * proj : proj
  }
  return mod
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
    const item = SETTINGS_CONFIG.station.find((i) => i.key === key)
    if (!item || item.perLevel == null) continue
    const val = settings.station?.[key] ?? 0
    const capped = Math.min(val, item.maxLevel)
    total += item.perLevel * capped
  }
  return total > 0 ? 1 + total : null
}

const STATION_VALUE_KEYS = [
  'alloyItem1',
  'alloyItem2',
  'alloyItem3',
  'alloyItem4',
  'alloyItem5',
  'alloyItem6',
  'alloyItem7',
]
export function getStationValueMult(settings) {
  return getStationMult(settings, STATION_VALUE_KEYS)
}

export function getManagerRoomMult(settings) {
  return getModifier('rooms', 'classroom', settings)
}

const MANAGER_TRAINING_KEYS = ['managerTraining', 'advancedManagerTraining', 'superiorManagerTraining']

export function getManagerTrainingMult(settings) {
  return getProjectMultiplier(settings, MANAGER_TRAINING_KEYS)
}

export function getTotalManagerBuff(settings) {
  const room = getManagerRoomMult(settings) || 1
  const training = getManagerTrainingMult(settings) || 1
  const total = room * training
  return total > 1 ? total : null
}

export function getManagerSecondaryMult(settings, skill) {
  const mgrs = settings.managers
  if (!Array.isArray(mgrs)) return null
  const buff = getTotalManagerBuff(settings) || 1
  let mult = 1
  for (const m of mgrs) {
    if (m.secondarySkill === skill && m.stars >= 1 && m.stars <= 7) {
      const val = SECONDARY_EFFECTS[skill]?.[m.stars - 1]
      if (val != null) {
        const eff = 1 + (val - 1) * buff
        mult *= eff
      }
    }
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
  { min: 23, max: 25, key: 'beacon23_25' },
  { min: 26, max: 28, key: 'beacon26_28' },
  { min: 29, max: 31, key: 'beacon29_31' },
  { min: 32, max: 34, key: 'beacon32_34' },
  { min: 35, max: 37, key: 'beacon35_37' },
  { min: 38, max: 40, key: 'beacon38_40' },
  { min: 41, max: 43, key: 'beacon41_43' },
  { min: 44, max: 46, key: 'beacon44_46' },
  { min: 47, max: 49, key: 'beacon47_49' },
  { min: 50, max: 52, key: 'beacon50_52' },
  { min: 53, max: 55, key: 'beacon53_55' },
  { min: 56, max: 58, key: 'beacon56_58' },
  { min: 59, max: 61, key: 'beacon59_61' },
  { min: 62, max: 64, key: 'beacon62_64' },
  { min: 65, max: 67, key: 'beacon65_67' },
  { min: 68, max: 70, key: 'beacon68_70' },
  { min: 71, max: 73, key: 'beacon71_73' },
  { min: 74, max: 76, key: 'beacon74_76' },
]

export function getBeaconMult(planetNumber, settings) {
  const range = BEACON_RANGES.find((r) => planetNumber >= r.min && planetNumber <= r.max)
  if (!range) return 1
  const mod = getModifier('beacon', range.key, settings)
  return mod || 1
}

export function getOreTargetingMult(settings) {
  return settings.projects?.oreTargeting ? 1.15 : null
}

const ROVER_PROJECT_KEYS = ['rover1', 'rover2']

export function getRoverMult(settings) {
  let n = 0
  for (const key of ROVER_PROJECT_KEYS) {
    if (settings.projects?.[key]) n++
  }
  return n > 0 ? 2.5 * n : 1
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
  const stationSmelt = getStationMult(settings, [
    'smelting1',
    'smelting2',
    'smelting3',
    'smelting4',
    'smelting5',
  ])
  if (stationSmelt) mult *= stationSmelt
  const mgrSmelt = getManagerSecondaryMult(settings, 'allSmeltSpeed')
  if (mgrSmelt) mult *= mgrSmelt
  return mult > 1 ? mult : null
}

export function getCraftSpeedMult(settings) {
  let mult = 1
  const workshopMod = getModifier('rooms', 'workshop', settings)
  if (workshopMod) mult *= workshopMod
  const crafterProj = getProjectMultiplier(settings, ['advancedCrafter', 'superiorCrafter'])
  if (crafterProj) mult *= crafterProj
  const stationCraft = getStationMult(settings, [
    'crafting1',
    'crafting2',
    'crafting3',
    'crafting4',
    'crafting5',
  ])
  if (stationCraft) mult *= stationCraft
  const mgrCraft = getManagerSecondaryMult(settings, 'allCraftSpeed')
  if (mgrCraft) mult *= mgrCraft
  return mult > 1 ? mult : null
}

export function effectivePrice(id, overrides, settings) {
  const e = getEntity(id)
  if (!e) return 0
  let price = e.basePrice * (1 + 0.2 * getStars(overrides, id)) * effectiveMarketVal(getMarket(overrides, id), settings)
  if (e.type === 'alloy' || e.type === 'item') {
    const salesMod = getModifier('rooms', 'sales', settings)
    if (salesMod) price *= salesMod
    const stnVal = getStationValueMult(settings)
    if (stnVal) price *= stnVal
    const valProjKeys =
      e.type === 'alloy'
        ? ['advancedAlloyValue', 'superiorAlloyValue']
        : ['advancedItemValue', 'superiorItemValue']
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
  const ingMod = getIngredientMod(e.type, settings)
  for (const ing of e.ingredients) {
    const ingQty = ingMod != null ? Math.floor(ing.qty * ingMod) : ing.qty
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
    const ingMod = getIngredientMod(e.type, settings)
    for (const ing of e.ingredients) {
      const ingQty = ingMod != null ? Math.floor(ing.qty * ingMod) : ing.qty
      t += calcTotalTime(ing.id, ingQty * qty, overrides, settings, visited)
    }
  }
  return Math.round(t)
}

export function calcSmeltTime(id, qty, overrides, settings, visited) {
  visited = visited || new Set()
  if (visited.has(id)) return 0
  visited.add(id)
  const e = getEntity(id)
  if (!e || e.type === 'ore') return 0
  let t = 0
  if (e.type === 'alloy' && e.time) {
    const smeltMult = getSmeltSpeedMult(settings)
    t = (smeltMult ? e.time / smeltMult : e.time) * qty
  }
  if (e.ingredients) {
    const ingMod = getIngredientMod(e.type, settings)
    for (const ing of e.ingredients) {
      const ingQty = ingMod != null ? Math.floor(ing.qty * ingMod) : ing.qty
      t += calcSmeltTime(ing.id, ingQty * qty, overrides, settings, visited)
    }
  }
  return Math.round(t)
}

export function calcCraftTime(id, qty, overrides, settings) {
  const e = getEntity(id)
  if (!e || e.type !== 'item' || !e.time) return 0
  const craftMult = getCraftSpeedMult(settings)
  const t = (craftMult ? e.time / craftMult : e.time) * qty
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
