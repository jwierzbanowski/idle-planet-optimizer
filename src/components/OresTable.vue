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
            <th>Name</th><th>Base Price</th><th>Smelted Into</th><th>Effective Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="id in visibleIds" :key="id" @click="$emit('show-detail', id)">
            <td class="name-cell">
              {{ DB.ores[id].name }}
              <StarControls :modelValue="getStars(id)" @update:modelValue="setOverride(id, 'stars', $event)" />
            </td>
            <td class="price">{{ fmtPrice(DB.ores[id].basePrice) }}</td>
            <td>
              <template v-if="DB.ores[id].smeltedInto">
                {{ getEntity(DB.ores[id].smeltedInto)?.name }}
              </template>
              <span v-else class="price-small">—</span>
            </td>
            <td class="price">{{ fmtPrice(effectivePrice(id, overrides, settings)) }}</td>
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
import { effectivePrice } from '../utils/calc'
import { fmtPrice } from '../utils/format'
import { getEntity } from '../utils/registry'
import StarControls from './StarControls.vue'

defineEmits(['show-detail'])

const { DB, ORDER } = useData()
const { overrides, getStars, setOverride } = useOverrides()
const { settings } = useSettings()

const ORE_GROUPS = [
  { label: 'Early Game', ids: ['copper', 'iron', 'lead', 'silica', 'aluminium'] },
  { label: 'Mid Game', ids: ['silver', 'gold', 'diamond', 'platinum', 'titanium'] },
  { label: 'Late Game', ids: ['iridium', 'palladium', 'osmium', 'rhodium', 'inerton'] },
  { label: 'End Game', ids: ['quadium', 'scrith', 'uru', 'vibranium', 'aether', 'viterium', 'xynium', 'quolium', 'luterium', 'wraith', 'aqualite', 'opalite'] },
]

const activeGroup = ref('all')

const groupedOres = computed(() => {
  const available = new Set(ORDER.value.ores)
  return ORE_GROUPS.map(g => ({
    key: g.label.toLowerCase().replace(/\s+/g, '_'),
    label: g.label,
    ids: g.ids.filter(id => available.has(id)),
  })).filter(g => g.ids.length > 0)
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
  const group = groupedOres.value.find(g => g.key === activeGroup.value)
  return group ? group.ids : []
})
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
</style>
