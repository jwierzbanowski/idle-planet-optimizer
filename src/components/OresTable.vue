<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Base Price</th><th>Smelted Into</th><th>Effective Price</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="id in ORDER.ores" :key="id" @click="$emit('show-detail', id)">
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
</template>

<script setup>
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
