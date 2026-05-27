<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>{{ timeLabel }}</th>
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
        <tr v-for="id in orderIds" :key="id" @click="$emit('show-detail', id)">
          <td class="name-cell">
            {{ getEntity(id)?.name }}
            <StarControls :modelValue="getStars(id)" @update:modelValue="setOverride(id, 'stars', $event)" />
          </td>
          <td>{{ fmtTime(effectiveTime(id)) }}</td>
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
</template>

<script setup>
import { computed } from 'vue'
import { useData } from '../composables/useData'
import { useOverrides } from '../composables/useOverrides'
import { useSettings } from '../composables/useSettings'
import { effectivePrice, calcMaterialCost, calcTotalTime, getSmeltSpeedMult, getCraftSpeedMult, getModifier } from '../utils/calc'
import { fmtPrice, fmtTime, fmtQty } from '../utils/format'
import { getEntity } from '../utils/registry'
import StarControls from './StarControls.vue'

const props = defineProps({ type: { type: String, required: true } })
defineEmits(['show-detail'])

const { DB, ORDER } = useData()
const { overrides, getStars, setOverride } = useOverrides()
const { settings, managerVersion } = useSettings()

const isAlloy = computed(() => props.type === 'alloy')
const orderIds = computed(() => { managerVersion.value; return isAlloy.value ? ORDER.value.alloys : ORDER.value.items })
const timeLabel = computed(() => isAlloy.value ? 'Smelt Time' : 'Craft Time')
const speedMult = computed(() => isAlloy.value ? getSmeltSpeedMult(settings) : getCraftSpeedMult(settings))
const ingMod = computed(() => {
  if (isAlloy.value) return getModifier('rooms', 'underforge', settings)
  return getModifier('rooms', 'dorm', settings)
})

function effectiveTime(id) {
  const e = getEntity(id)
  if (!e || !e.time) return 0
  const mult = speedMult.value
  return mult ? e.time / mult : e.time
}

function ingredientList(id) {
  const e = getEntity(id)
  if (!e || !e.ingredients) return ''
  return e.ingredients.map(i => {
    const ing = getEntity(i.id)
    const mod = ingMod.value
    const q = mod != null ? i.qty * mod : i.qty
    return (q > 1 ? fmtQty(q) + '× ' : '') + (ing ? ing.name : i.id)
  }).join(', ')
}

function profit(id) {
  const eff = effectivePrice(id, overrides, settings)
  const oc = calcMaterialCost(id, 1, overrides, settings)
  return eff - oc
}

function pps(id) {
  const t = calcTotalTime(id, 1, overrides, settings)
  return t > 0 ? profit(id) / t : 0
}

function profitClass(id) {
  return profit(id) >= 0 ? 'positive' : 'negative'
}
</script>

<style scoped>
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
