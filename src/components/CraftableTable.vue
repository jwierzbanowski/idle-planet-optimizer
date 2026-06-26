<template>
  <div>
    <div class="filter-tabs">
      <button v-for="tab in filterTabs" :key="tab.key" class="filter-tab"
        :class="{ active: activeGroup === tab.key }"
        @click="activeGroup = tab.key">
        {{ tab.label }} <span class="count">({{ tab.count }})</span>
      </button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th v-if="isAlloy">Smelt Time</th>
            <th v-if="!isAlloy">Craft Time</th>
            <th>Ingredients</th>
            <th>Base Price</th>
            <th>Effective Price</th>
            <th>Material Cost</th>
            <th>Profit / Craft</th>
            <th>Profit / sec</th>
            <th>Total Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="id in visibleIds" :key="id" :class="{ 'best-row': bestInGroup.has(id) }" @click="$emit('show-detail', id)">
            <td class="name-cell">
              {{ getEntity(id)?.name }}
              <StarControls :modelValue="getStars(id)" @update:modelValue="setOverride(id, 'stars', $event)" />
            </td>
            <td v-if="isAlloy">{{ fmtTime(effectiveTime(id)) }}</td>
            <td v-if="!isAlloy">{{ fmtTime(itemCraftTime(id)) }}</td>
            <td><span class="ingredient-list">{{ ingredientList(id) }}</span></td>
            <td class="price">{{ fmtPrice(getEntity(id)?.basePrice || 0) }}</td>
            <td class="price">{{ fmtPrice(effectivePrice(id, overrides, settings)) }}</td>
            <td class="price-small">{{ fmtPrice(calcMaterialCost(id, 1, overrides, settings)) }}</td>
            <td :class="profitClass(id)">{{ fmtPrice(profit(id)) }}</td>
            <td :class="profitClass(id)" style="font-weight:600">{{ fmtPrice(pps(id)) }}/s</td>
            <td class="price-small">{{ fmtTime(calcTotalTime(id, 1, overrides, settings)) }}</td>
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
import { effectivePrice, calcMaterialCost, calcTotalTime, calcCraftTime, getSmeltSpeedMult, getCraftSpeedMult, getModifier, getIngredientMod } from '../utils/calc'
import { fmtPrice, fmtTime, fmtQty } from '../utils/format'
import { getEntity } from '../utils/registry'
import StarControls from './StarControls.vue'

const GROUPS = {
  alloy: [
    { label: '10M-100M', ids: ['copper_bar', 'iron_bar', 'lead_bar', 'silicon_bar', 'aluminium_bar'] },
    { label: '100M-1B', ids: ['silver_bar', 'gold_bar', 'bronze_bar', 'steel_bar', 'platinum_bar', 'titanium_bar'] },
    { label: '1B-100B', ids: ['iridium_bar', 'palladium_bar', 'osmium_bar', 'rhodium_bar', 'inerton_alloy'] },
    { label: 'End Game', ids: ['quadium_alloy', 'scrith_alloy', 'uru_alloy', 'vibranium_alloy', 'aether_alloy', 'viterium_alloy', 'xynium_alloy', 'quolium_alloy', 'luterium_alloy', 'wraith_alloy', 'aqualite_alloy', 'opalite_alloy'] },
  ],
  item: [
    { label: '10M-100M', ids: ['copper_wire', 'iron_nail', 'battery', 'hammer', 'glass', 'circuit'] },
    { label: '100M-1B', ids: ['lens', 'laser', 'basic_computer', 'solar_panel'] },
    { label: '1B-100B', ids: ['laser_torch', 'advanced_battery', 'thermal_scanner', 'advanced_computer', 'navigation_module', 'plasma_torch', 'radio_tower'] },
    { label: 'End Game', ids: ['telescope', 'satellite_dish', 'motor', 'accumulator', 'nuclear_capsule', 'wind_turbine', 'space_probe', 'nuclear_reactor', 'collider', 'gravity_chamber', 'robot', 'fusion_capsule', 'teleporter', 'fusion_reactor', 'subspace_relay', 'advanced_robot', 'advanced_teleporter', 'quantum_cpu', 'deflector_shield', 'warp_core', 'deep_space_scanner', 'antimatter_cell'] },
  ],
}

const props = defineProps({ type: { type: String, required: true } })
defineEmits(['show-detail'])

const { ORDER } = useData()
const { overrides, getStars, setOverride } = useOverrides()
const { settings, managerVersion } = useSettings()

const isAlloy = computed(() => props.type === 'alloy')
const activeGroup = ref('all')
const allIds = computed(() => { managerVersion.value; return isAlloy.value ? ORDER.value.alloys : ORDER.value.items })

const groupedItems = computed(() => {
  const available = new Set(allIds.value)
  return GROUPS[props.type].map(g => ({
    key: g.label.toLowerCase().replace(/\s+/g, '_'),
    label: g.label,
    ids: g.ids.filter(id => available.has(id)),
  })).filter(g => g.ids.length > 0)
})

const filterTabs = computed(() => {
  const allCount = groupedItems.value.reduce((sum, g) => sum + g.ids.length, 0)
  const tabs = []
  for (const g of groupedItems.value) {
    tabs.push({ key: g.key, label: g.label, count: g.ids.length })
  }
  tabs.push({ key: 'all', label: 'All', count: allCount })
  return tabs
})

const visibleIds = computed(() => {
  if (activeGroup.value === 'all') return allIds.value
  const group = groupedItems.value.find(g => g.key === activeGroup.value)
  return group ? group.ids : []
})
const bestInGroup = computed(() => {
  const ids = new Set()
  for (const g of groupedItems.value) {
    let bestId = null
    let bestPps = -Infinity
    for (const id of g.ids) {
      const p = pps(id)
      if (p > bestPps) { bestPps = p; bestId = id }
    }
    if (bestId != null) ids.add(bestId)
  }
  return ids
})
const timeLabel = computed(() => isAlloy.value ? 'Smelt Time' : 'Craft Time')
const speedMult = computed(() => isAlloy.value ? getSmeltSpeedMult(settings) : getCraftSpeedMult(settings))
const ingMod = computed(() => getIngredientMod(isAlloy.value ? 'alloy' : 'item', settings))

function effectiveTime(id) {
  const e = getEntity(id)
  if (!e || !e.time) return 0
  const mult = speedMult.value
  return mult ? e.time / mult : e.time
}

function itemCraftTime(id) {
  return calcCraftTime(id, 1, overrides, settings)
}
function ingredientList(id) {
  const e = getEntity(id)
  if (!e || !e.ingredients) return ''
  return e.ingredients.map(i => {
    const ing = getEntity(i.id)
    const mod = ingMod.value
    const q = mod != null ? Math.floor(i.qty * mod) : i.qty
    return (q > 1 ? fmtQty(q) + '× ' : '') + (ing ? ing.name : i.id)
  }).join('\n')
}

function profit(id) {
  const eff = effectivePrice(id, overrides, settings)
  const oc = calcMaterialCost(id, 1, overrides, settings)
  return eff - oc
}

function pps(id) {
  const t = isAlloy.value ? effectiveTime(id) : itemCraftTime(id)
  return t > 0 ? profit(id) / t : 0
}

function profitClass(id) {
  return profit(id) >= 0 ? 'positive' : 'negative'
}
</script>

<style scoped>
.filter-tabs {
  display: flex; gap: 4px; margin-bottom: 12px;
  background: #121824; border-radius: 10px; padding: 4px;
  display: inline-flex;
}
.filter-tab {
  padding: 8px 20px; border: none; background: transparent;
  color: #6b7a8f; font-size: 13px; font-weight: 600;
  cursor: pointer; border-radius: 6px; transition: all 0.2s;
}
.filter-tab:hover { color: #c8d0dc; background: #1a2235; }
.filter-tab.active { color: #fff; background: #1e88e5; }
.filter-tab .count { color: #6b7a8f; font-size: 11px; margin-left: 4px; font-weight: 400; }
.filter-tab.active .count { color: rgba(255,255,255,0.6); }
.star-controls { display: flex; align-items: center; gap: 3px; margin-top: 5px; }
.star-btn {
  width: 24px; height: 24px; border: 1px solid #2a3a4a; border-radius: 4px;
  background: #0d1520; color: #6b7a8f; font-size: 16px; font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  line-height: 1; padding: 0; user-select: none;
}
.star-btn:hover { border-color: #4fc3f7; color: #4fc3f7; }
.star-btn:active { background: #1a2235; }
.star-btn:disabled { opacity: 0.3; cursor: default; }
.star-count {
  min-width: 44px; text-align: center; font-size: 14px; font-weight: 600; color: #e8edf5;
}
.best-row { background: rgba(76, 175, 80, 0.08); }
</style>
