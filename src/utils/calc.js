import { SETTINGS_CONFIG, SECONDARY_EFFECTS, STATION_GROUPS, SHIPS } from './config'
import { getEntity } from './registry'
import { DISABLED_MODULE_CATEGORIES } from './config'

export function getProjectCostLabMod(settings) {
  return getModifier('rooms', 'laboratory', settings)
}

export function expandProjectCosts(projectCosts, settings) {
  const labMod = getProjectCostLabMod(settings) || 1
  const alloys = {}
  const items = {}

  function expand(id, qty) {
    const entity = getEntity(id)
    if (!entity) return
    if (entity.type === 'ore') return
    if (entity.type === 'alloy') {
      const total = (alloys[id] || 0) + qty
      if (total > 0) alloys[id] = total
      const ingMod = getIngredientMod('alloy', settings) || 1
      if (entity.ingredients) {
        for (const ing of entity.ingredients) {
          expand(ing.id, Math.floor(ing.qty * ingMod) * qty)
        }
      }
    } else if (entity.type === 'item') {
      const total = (items[id] || 0) + qty
      if (total > 0) items[id] = total
      const ingMod = getIngredientMod('item', settings) || 1
      if (entity.ingredients) {
        for (const ing of entity.ingredients) {
          expand(ing.id, Math.floor(ing.qty * ingMod) * qty)
        }
      }
    }
  }

  for (const cost of projectCosts) {
    if (cost.type === 'diamond') continue
    const effectiveQty = Math.ceil(cost.qty * labMod)
    if (effectiveQty <= 0) continue
    if (cost.type === 'ore') continue
    expand(cost.id, effectiveQty)
  }

  return { alloys, items }
}

export function getDebrisSources(projectCosts, settings) {
  const labMod = getProjectCostLabMod(settings) || 1
  const alloys = {}
  const items = {}

  function expand(id, qty, projKey, projName, via) {
    const entity = getEntity(id)
    if (!entity) return
    if (entity.type === 'ore') return
    if (entity.type === 'alloy') {
      if (!alloys[id]) alloys[id] = { qty: 0, sources: [] }
      const existing = alloys[id].sources.find(
        (s) => s.projectKey === projKey && s.via.join(',') === via.join(',')
      )
      if (existing) {
        existing.qty += qty
      } else {
        alloys[id].sources.push({ projectKey: projKey, projectName: projName, qty, via: [...via] })
      }
      alloys[id].qty += qty
      const ingMod = getIngredientMod('alloy', settings) || 1
      if (entity.ingredients) {
        for (const ing of entity.ingredients) {
          expand(ing.id, Math.floor(ing.qty * ingMod) * qty, projKey, projName, [entity.name])
        }
      }
    } else if (entity.type === 'item') {
      if (!items[id]) items[id] = { qty: 0, sources: [] }
      const existing = items[id].sources.find(
        (s) => s.projectKey === projKey && s.via.join(',') === via.join(',')
      )
      if (existing) {
        existing.qty += qty
      } else {
        items[id].sources.push({ projectKey: projKey, projectName: projName, qty, via: [...via] })
      }
      items[id].qty += qty
      const childVia = [entity.name]
      const ingMod = getIngredientMod('item', settings) || 1
      if (entity.ingredients) {
        for (const ing of entity.ingredients) {
          expand(ing.id, Math.floor(ing.qty * ingMod) * qty, projKey, projName, childVia)
        }
      }
    }
  }

  for (const cost of projectCosts) {
    if (cost.type === 'diamond') continue
    const effectiveQty = Math.ceil(cost.qty * labMod)
    if (effectiveQty <= 0) continue
    if (cost.type === 'ore') continue
    expand(cost.id, effectiveQty, cost.projectKey, cost.projectName, [])
  }

  return { alloys, items }
}

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

export function getShipMult(settings, stat) {
  const owned = settings.ships || {}
  let mult = 1
  for (const ship of SHIPS) {
    if (!owned[ship.key]) continue
    for (const b of ship.bonuses) {
      if (b.stat === stat && b.mult != null) mult *= b.mult
    }
  }
  return mult > 1 ? mult : null
}

export function getModuleLevelMult(modules, cat, rarity, level) {
  const table = modules?.multipliers?.[cat]?.[rarity]
  if (!table || !level || level <= 0) return null
  const exact = table[level]
  if (exact != null) return exact
  const lvls = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b)
  const below = lvls.filter((l) => l < level)
  const above = lvls.filter((l) => l > level)
  const lo = below.length ? below[below.length - 1] : null
  const hi = above.length ? above[0] : null
  if (lo != null && hi != null) {
    return table[lo] + ((table[hi] - table[lo]) * (level - lo)) / (hi - lo)
  }
  return null
}

// --- Module substats wiring -------------------------------------------------

// Resolve a substat catalog value to a usable numeric multiplier.
// - number  -> returned as-is
// - string  -> looks for a `Max <n>[x]` token (case-insensitive) and uses that
//              number as a fixed multiplier (per product decision); without a
//              `Max` cap, returns null (cannot be modelled by the optimizer)
export function resolveSubstatValue(value) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return null
  const m = value.match(/max\s*(?:x\s*)?(\d+(?:\.\d+)?)/i)
  return m ? parseFloat(m[1]) : null
}

// Module substat keys that the optimizer feeds into the relevant calc chain.
const DRILL_MINING_STATS = [
  'mining_colony_bonus',
  'mining_beacon_bonus',
  'mining_probe_bonus',
  'planet_boost_bonus',
  'mining_per_asteroids_mined',
  'mining_for_each_own_asteroid_mined',
  'mining_on_planet_with_10_colonies',
]

const SYNTH_SMELT_STATS = [
  'smelt_speed_bonus',
  'smelt_speed_per_planet_with_colony',
  'smelt_speed_per_colony_level',
  'smelt_speed_per_beam',
  'smelt_speed_of_alloy_for_active_recipie',
  'smelt_speed_per_planet_with_10_colonies',
  'smelt_speed_per_telescope_with_20_colonies',
]

const SYNTH_CRAFT_STATS = [
  'craft_speed_bonus',
  'craft_speed_per_planet_with_colony',
  'craft_speed_per_colony_level',
  'craft_speed_per_beam',
  'craft_speed_of_item_for_active_recipie',
  'craft_speed_per_planet_with_10_colonies',
  'craft_speed_per_telescope_with_20_colonies',
]

const SYNTH_VALUE_STATS = [
  'resource_value',
  'market_bonus',
  'market_bonus_per_planet_with_colony',
  'market_bonus_per_beam',
]

export { SYNTH_VALUE_STATS }

const SYNTH_ALLOY_VALUE_STATS = ['alloy_value']

export { SYNTH_ALLOY_VALUE_STATS }

const SYNTH_ITEM_VALUE_STATS = ['item_value']

export { SYNTH_ITEM_VALUE_STATS }

// Returns the combined multiplier for the substats of one module category that
// match `statKeys`, or null when none contribute. Mirrors the established
// `let mult = 1; ... return mult > 1 ? mult : null` pattern in this file.
export function getModuleSubstatMult(modules, profileModules, cat, statKeys) {
  if (!cat || !modules?.substats || !profileModules) return null
  if (DISABLED_MODULE_CATEGORIES.includes(cat)) return null
  const slot = profileModules[cat]
  if (!slot || !Array.isArray(slot.substats)) return null
  const catalog = modules.substats[cat]
  if (!Array.isArray(catalog)) return null
  const allow = statKeys ? new Set(statKeys) : null
  let mult = 1
  let any = false
  for (const s of slot.substats) {
    if (!s || !s.key) continue
    if (allow && !allow.has(s.key)) continue
    const def = catalog.find((d) => d.key === s.key)
    if (!def || !def.values) continue
    const rarity = s.rarity || slot.rarity
    if (!rarity) continue
    const raw = def.values[rarity]
    if (raw == null) continue
    const val = resolveSubstatValue(raw)
    if (val == null || val === 0) continue
    mult *= val
    any = true
  }
  return any && mult > 1 ? mult : null
}

function moduleSubstatMultHelper(settings, cat, stats) {
  return getModuleSubstatMult(settings.modulesData, settings.modules, cat, stats)
}

export function getMarketingMult(settings) {
  return getModifier('rooms', 'marketing', settings)
}

export function effectiveMarketVal(market, settings) {
  if (market <= 1) return market
  let val = market
  const marketing = getMarketingMult(settings)
  if (marketing) val *= marketing
  const stnMarket = getStationMarketMult(settings)
  if (stnMarket) val *= stnMarket
  return val
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
  let reduce = false
  for (const key of keys) {
    const item = SETTINGS_CONFIG.station.find((i) => i.key === key)
    if (!item || item.perLevel == null) continue
    const val = settings.station?.[key] ?? 0
    const capped = Math.min(val, item.maxLevel)
    total += item.perLevel * capped
    if (item.kind === 'reduce') reduce = true
  }
  if (reduce) return total > 0 ? Math.max(0, 1 - total / 100) : null
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

const STATION_MARKET_KEYS = ['market1', 'market2', 'market3', 'market4', 'market5', 'market6', 'market7']

export function getStationMarketMult(settings) {
  return getStationMult(settings, STATION_MARKET_KEYS)
}

const STATION_MANAGER_KEYS = [
  'manager1',
  'manager2',
  'manager3',
  'manager4',
  'manager5',
  'manager6',
  'manager7',
  'manager8',
]

export function getStationManagerMult(settings) {
  return getStationMult(settings, STATION_MANAGER_KEYS)
}

const STATION_PLANET_COST_KEYS = ['planetCost1', 'planetCost2', 'planetCost3', 'planetCost4', 'planetCost5']

export function getStationPlanetCostMult(settings) {
  return getStationMult(settings, STATION_PLANET_COST_KEYS)
}

export function getStationRecommendations(settings) {
  const stationSettings = settings.station || {}
  const result = []
  for (const group of STATION_GROUPS || []) {
    const subs = Array.isArray(group.subsections) && group.subsections.length
      ? group.subsections.map((s) => ({ name: s.name, keys: s.keys }))
      : Array.isArray(group.keys) && group.keys.length
        ? [{ name: group.name, keys: group.keys }]
        : []
    for (const sub of subs) {
      let best = null
      for (const key of sub.keys) {
        const item = SETTINGS_CONFIG.station.find((i) => i.key === key)
        if (!item || item.perLevel == null || !item.costs) continue
        const level = stationSettings[key] ?? 0
        const capped = item.maxLevel != null ? Math.min(level, item.maxLevel) : level
        if (capped >= item.costs.length) continue
        const nextLevel = capped + 1
        const cost = item.costs[nextLevel - 1] ?? item.costs[item.costs.length - 1]
        const gainPerCell = item.perLevel / cost
        if (!best || gainPerCell > best.gainPerCell) {
          best = {
            section: subs.length > 1 ? `${group.name} · ${sub.name}` : group.name,
            key,
            label: item.label,
            nextLevel,
            maxLevel: item.costs.length,
            cost,
            perLevel: item.perLevel,
            gainPerCell,
            kind: item.kind || 'boost',
          }
        }
      }
      if (best) result.push(best)
    }
  }
  return result.sort((a, b) => b.gainPerCell - a.gainPerCell)
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
  const station = getStationManagerMult(settings) || 1
  const ships = getShipMult(settings, 'manager') || 1
  const total = room * training * station * ships
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
  const shipMine = getShipMult(settings, 'mining')
  if (shipMine) mult *= shipMine
  const drillSub = moduleSubstatMultHelper(settings, 'drill', DRILL_MINING_STATS)
  if (drillSub) mult *= drillSub
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
  const shipSmelt = getShipMult(settings, 'smelt')
  if (shipSmelt) mult *= shipSmelt
  const synthSmeltSub = moduleSubstatMultHelper(settings, 'synth', SYNTH_SMELT_STATS)
  if (synthSmeltSub) mult *= synthSmeltSub
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
  const shipCraft = getShipMult(settings, 'craft')
  if (shipCraft) mult *= shipCraft
  const synthCraftSub = moduleSubstatMultHelper(settings, 'synth', SYNTH_CRAFT_STATS)
  if (synthCraftSub) mult *= synthCraftSub
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
  const synthValueSub = moduleSubstatMultHelper(settings, 'synth', SYNTH_VALUE_STATS)
  if (synthValueSub) price *= synthValueSub
  if (e.type === 'alloy') {
    const alloySub = moduleSubstatMultHelper(settings, 'synth', SYNTH_ALLOY_VALUE_STATS)
    if (alloySub) price *= alloySub
  } else if (e.type === 'item') {
    const itemSub = moduleSubstatMultHelper(settings, 'synth', SYNTH_ITEM_VALUE_STATS)
    if (itemSub) price *= itemSub
  }
  const shipValueStat =
    e.type === 'ore' ? 'oreValue' : e.type === 'alloy' ? 'alloyValue' : e.type === 'item' ? 'itemValue' : null
  if (shipValueStat) {
    const shipValue = getShipMult(settings, shipValueStat)
    if (shipValue) price *= shipValue
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
