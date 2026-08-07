<template>
  <div v-if="perXRows.length > 0" class="mm-panel">
    <div class="mm-header">Modules Modifiers</div>
    <div class="mm-section">
      <div v-for="row in perXRows" :key="row.dep" class="mm-row">
        <span class="mm-name">{{ row.label }}</span>
        <div :class="['mm-controls', { 'mm-controls-full': row.maxX > 5 }]">
          <template v-if="row.maxX > 5">
            <input
              type="range"
              class="mm-slider"
              :min="0"
              :max="row.maxX"
              :value="row.value"
              @input="setPerX(row.dep, Number($event.target.value))"
            />
            <span class="mm-val">{{ row.value }}</span>
          </template>
          <template v-else>
            <button
              class="star-btn"
              :disabled="row.value <= 0"
              @click="changePerX(row, -1)"
            >
              −
            </button>
            <span class="mm-val">{{ row.value }}</span>
            <button
              class="star-btn"
              :disabled="row.value >= row.maxX"
              @click="changePerX(row, 1)"
            >
              +
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { PER_X_DEPS } from '../utils/config'
import { useOverrides } from '../composables/useOverrides'
import { useProfile } from '../composables/useProfile'
import { parsePerXString } from '../utils/calc'
import { MODULES } from '../utils/registry'

const { getPerX, setPerX } = useOverrides()
const { getModuleSlots } = useProfile()

const perXRows = computed(() => {
  const catalog = MODULES.value
  if (!catalog || !catalog.substats) return []
  const slots = getModuleSlots()
  const activeCats = ['drill', 'synth']
  const found = {}
  const rows = []
  for (const cat of activeCats) {
    const slot = slots[cat]
    if (!slot || !Array.isArray(slot.substats)) continue
    const catCatalog = catalog.substats[cat]
    if (!Array.isArray(catCatalog)) continue
    for (const s of slot.substats) {
      if (!s || !s.key) continue
      for (const [dep, def] of Object.entries(PER_X_DEPS)) {
        if (!def.keys.includes(s.key)) continue
        const defEntry = catCatalog.find((d) => d.key === s.key)
        if (!defEntry || !defEntry.values) continue
        const rarity = s.rarity || slot.rarity
        if (!rarity) continue
        const raw = defEntry.values[rarity]
        if (!raw) continue
        const parsed = parsePerXString(raw)
        if (!parsed) continue
        if (!found[dep]) {
          found[dep] = { dep, label: def.label, value: getPerX(dep), maxX: parsed.maxX }
          rows.push(found[dep])
        } else {
          found[dep].maxX = Math.min(found[dep].maxX, parsed.maxX)
        }
      }
    }
  }
  rows.sort((a, b) => a.label.localeCompare(b.label))
  return rows
})

function changePerX(row, dir) {
  const next = row.value + dir
  const capped = Math.max(0, Math.min(next, row.maxX))
  setPerX(row.dep, capped)
}
</script>

<style scoped>
.mm-panel {
  background: #121824;
  border-radius: 10px;
  border: 1px solid #1e2a3a;
  min-height: 0;
}

.mm-header {
  font-size: 11px;
  font-weight: 700;
  color: #6b7a8f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 12px 0;
}

.mm-section {
  padding: 4px 12px 10px;
}

.mm-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0 2px;
}

.mm-name {
  flex: 1;
  font-size: 13px;
  color: #c8d0dc;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mm-controls {
  display: flex;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}

.mm-controls-full {
  flex: 1;
  gap: 8px;
}

.mm-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #1e2a3a;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.mm-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4caf50;
  border: none;
  cursor: pointer;
}

.mm-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4caf50;
  border: none;
  cursor: pointer;
}

.mm-val {
  min-width: 32px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #e8edf5;
  margin: 0 4px;
}
</style>
