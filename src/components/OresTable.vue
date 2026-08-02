<template>
  <div>
    <div class="filter-tabs">
      <div class="filter-tabs-left">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          class="filter-tab"
          :class="{ active: activeGroup === tab.key }"
          @click="activeGroup = tab.key"
        >
          {{ tab.label }} <span class="count">({{ tab.count }})</span>
        </button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Base Price</th>
            <th>Smelted Into</th>
            <th>Effective Price</th>
            <th>Production</th>
            <th>Mining Profit/s</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="id in visibleIds"
 :key="id" :class="{ 'prev-best-row': id === prevGroupBest?.id && activeGroup !== 'all' }">
            <td class="name-cell">
              {{ DB.ores[id].name }}
              <span v-if="id === prevGroupBest?.id && activeGroup !== 'all'" class="prev-best-label">(best from {{ prevGroupBest.label }})</span>
              <StarControls
                :model-value="getStars(id)"
                @update:model-value="setOverride(id, 'stars', $event)"
              />
            </td>
            <td class="price">
              {{ fmtPrice(DB.ores[id].basePrice) }}
            </td>
            <td>
              <template v-if="DB.ores[id].smeltedInto">
                {{ getEntity(DB.ores[id].smeltedInto)?.name }}
              </template>
              <span v-else
class="price-small">—</span>
            </td>
            <td class="price">
              {{ fmtPrice(effectivePrice(id, overrides, settings)) }}
            </td>
            <td class="price">{{ fmtQty(oreMiningData[id]?.rate || 0) }}/s</td>
            <td class="price">
              {{ fmtPrice(oreMiningData[id]?.profit || 0) }}/s
              <span class="info-icon" :data-tip="oreProfitTooltip(id)" @click.stop="toggleTip"
              >i</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../composables/useData'
import { useOverrides } from '../composables/useOverrides'
import { useSettings } from '../composables/useSettings'
import { useMode } from '../composables/useMode'
import {
  effectivePrice,
  getMiningSpeedMult,
  getBeaconMult,
  getOreTargetingMult,
} from '../utils/calc'
import { fmtPrice, fmtQty, toggleTip } from '../utils/format'
import { getEntity } from '../utils/registry'
import StarControls from './StarControls.vue'

const { DB, ORDER } = useData()
const {
  overrides,
  getStars,
  getMiningLevel,
  getMiningColonies,
  getProbe,
  getProbeSpeed,
  setOverride,
} = useOverrides()
const { settings } = useSettings()
const { panelMode } = useMode()

const BASIC_PRICE_GROUPS = [
  { label: '10M-100M', min: 10_000_000, max: 100_000_000 },
  { label: '100M-1B', min: 100_000_000, max: 1_000_000_000 },
  { label: '1B-10B', min: 1_000_000_000, max: 10_000_000_000 },
  { label: '10B-100B', min: 10_000_000_000, max: 100_000_000_000 },
  { label: '100B-1T', min: 100_000_000_000, max: 1_000_000_000_000 },
]

const ORE_GROUPS = [
  { label: '100M', ids: ['copper', 'iron', 'lead', 'silica', 'aluminium', 'silver'] },
  { label: '10B', ids: ['gold', 'diamond', 'platinum', 'titanium'] },
  { label: '10T', ids: ['iridium', 'palladium', 'osmium', 'rhodium'] },
  { label: '10q', ids: ['inerton', 'quadium', 'scrith', 'uru', 'vibranium'] },
  {
    label: 'Other',
    ids: [
      'aether',
      'viterium',
      'xynium',
      'quolium',
      'luterium',
      'wraith',
      'aqualite',
      'opalite',
    ],
  },
]

const activeGroup = ref('all')

const groupedOres = computed(() => {
  const available = new Set(ORDER.value.ores)
  if (panelMode.value === 'basic') {
    return BASIC_PRICE_GROUPS.map((g) => ({
      key: g.label.toLowerCase().replace(/[-\s]+/g, '_'),
      label: g.label,
      ids: ORDER.value.ores.filter((id) => {
        if (!available.has(id)) return false
        const price = DB.value.ores[id].basePrice
        return price >= g.min && price < g.max
      }),
    })).filter((g) => g.ids.length > 0)
  }
  return ORE_GROUPS.map((g) => ({
    key: g.label.toLowerCase().replace(/\s+/g, '_'),
    label: g.label,
    ids: g.ids.filter((id) => available.has(id)),
  })).filter((g) => g.ids.length > 0)
})

const filterTabs = computed(() => {
  const allCount = groupedOres.value.reduce((sum, g) => sum + g.ids.length, 0)
  const tabs = []
  for (const g of groupedOres.value) {
    tabs.push({ key: g.key, label: g.label, count: g.ids.length })
  }
  tabs.push({ key: 'all', label: 'All', count: allCount })
  return tabs
})

const visibleIds = computed(() => {
  if (activeGroup.value === 'all') return ORDER.value.ores
  const group = groupedOres.value.find((g) => g.key === activeGroup.value)
  const ids = group ? [...group.ids] : []
  if (prevGroupBest.value && !ids.includes(prevGroupBest.value.id)) {
    ids.unshift(prevGroupBest.value.id)
  }
  return ids
})

const oreMiningData = computed(() => {
  const data = {}
  const miningMult = getMiningSpeedMult(settings) || 1
  for (const pid of ORDER.value.planets) {
    const p = DB.value.planets[pid]
    if (!p || !p.resources || p.distance == null || p.distance <= 0) continue
    const lvl = getMiningLevel(pid)
    const colonies = getMiningColonies(pid)
    const probe = getProbe(pid)
    const probeMult = probe ? getProbeSpeed(pid) || 1 : 1
    const miningLevel = DB.value.mining['lvl' + lvl] || DB.value.mining['lvl1']
    const beaconMult = getBeaconMult(p.number, settings)
    const coloniesMult = 1 + 0.3 * colonies
    const rate = miningLevel.rate * miningMult * beaconMult * coloniesMult * probeMult
    const oreTargetMult = getOreTargetingMult(settings)
    let bestOreId = null
    if (oreTargetMult) {
      let bestPrice = 0
      for (const r of p.resources) {
        const ore = DB.value.ores[r.ore]
        if (ore) {
          const price = effectivePrice(ore.id, overrides, settings)
          if (price > bestPrice) {
            bestPrice = price
            bestOreId = ore.id
          }
        }
      }
    }
    for (const r of p.resources) {
      const ore = DB.value.ores[r.ore]
      if (!ore) continue
      const effYield =
        oreTargetMult && ore.id === bestOreId ? r.yield + (oreTargetMult - 1) * 100 : r.yield
      const oreRate = (rate * effYield) / 100
      if (!data[ore.id]) data[ore.id] = { rate: 0, profit: 0 }
      data[ore.id].rate += oreRate
      data[ore.id].profit += oreRate * effectivePrice(ore.id, overrides, settings)
    }
  }
  return data
})

function oreProfitTooltip(oreId) {
  const lines = ['Mining Profit/s']
  const miningMult = getMiningSpeedMult(settings) || 1
  for (const pid of ORDER.value.planets) {
    const p = DB.value.planets[pid]
    if (!p || !p.resources || p.distance == null || p.distance <= 0) continue
    const res = p.resources.find((r) => r.ore === oreId)
    if (!res) continue
    const lvl = getMiningLevel(pid)
    const colonies = getMiningColonies(pid)
    const probe = getProbe(pid)
    const probeMult = probe ? getProbeSpeed(pid) || 1 : 1
    const miningLevel = DB.value.mining['lvl' + lvl] || DB.value.mining['lvl1']
    const beaconMult = getBeaconMult(p.number, settings)
    const coloniesMult = 1 + 0.3 * colonies
    const rate = miningLevel.rate * miningMult * beaconMult * coloniesMult * probeMult
    let oreRate = rate * (res.yield / 100)
    const oreTargetMult = getOreTargetingMult(settings)
    if (oreTargetMult) {
      let bestPrice = 0
      let bestOreId = null
      for (const r of p.resources) {
        const ore = DB.value.ores[r.ore]
        if (ore) {
          const price = effectivePrice(ore.id, overrides, settings)
          if (price > bestPrice) {
            bestPrice = price
            bestOreId = ore.id
          }
        }
      }
      if (oreId === bestOreId) oreRate = (rate * (res.yield + (oreTargetMult - 1) * 100)) / 100
    }
    const price = effectivePrice(oreId, overrides, settings)
    lines.push(
      `  ${p.name}: ${oreRate.toFixed(3)}/s × $${price.toFixed(2)} = $${(oreRate * price).toFixed(2)}/s`
    )
  }
  const total = oreMiningData.value[oreId]?.profit || 0
  lines.push('  ─────────────────')
  lines.push(`  Total: $${total.toFixed(2)}/s`)
  return lines.join('\n')
}

const prevGroupBest = computed(() => {
  if (activeGroup.value === 'all') return null
  const idx = groupedOres.value.findIndex((g) => g.key === activeGroup.value)
  if (idx <= 0) return null
  const prevGroup = groupedOres.value[idx - 1]
  let bestId = null
  let bestProfit = -Infinity
  for (const id of prevGroup.ids) {
    const profit = oreMiningData.value[id]?.profit || 0
    if (profit > bestProfit) {
      bestProfit = profit
      bestId = id
    }
  }
  if (bestId == null) return null
  return { id: bestId, label: prevGroup.label }
})
</script>

<style scoped>
.filter-tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  background: #121824;
  border-radius: 10px;
  padding: 4px;
}
.filter-tabs-left {
  display: flex;
  gap: 4px;
}
.filter-tab {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #6b7a8f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}
.filter-tab:hover {
  color: #c8d0dc;
  background: #1a2235;
}
.filter-tab.active {
  color: #fff;
  background: #1e88e5;
}
.filter-tab .count {
  color: #6b7a8f;
  font-size: 11px;
  margin-left: 4px;
  font-weight: 400;
}
.filter-tab.active .count {
  color: rgba(255, 255, 255, 0.6);
}
.star-controls {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 5px;
}
.star-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  background: #0d1520;
  color: #6b7a8f;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  user-select: none;
}
.star-btn:hover {
  border-color: #4fc3f7;
  color: #4fc3f7;
}
.star-btn:active {
  background: #1a2235;
}
.star-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.star-count {
  min-width: 44px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #e8edf5;
}
.prev-best-row {
  background: rgba(30, 136, 229, 0.08);
}
.prev-best-label {
  font-size: 10px;
  color: #64b5f6;
  margin-left: 6px;
  font-weight: 400;
  vertical-align: middle;
}
</style>
