<template>
  <div class="market-panel">
    <div class="market-header">Supply &amp; Demand</div>
    <div class="market-search-section">
      <input
        v-model="query"
        type="text"
        class="market-search"
        placeholder="Search ore, alloy, item..."
        @keydown.escape="query = ''"
      />
      <div v-if="query.length > 0" class="market-results">
        <div
          v-for="item in results"
          :key="item.id"
          class="market-result-row"
          @click="pinItem(item.id)"
        >
          <span class="market-result-type"
:class="item.type">{{ item.typeLabel }}</span>
          <span class="market-result-name">{{ item.name }}</span>
          <span v-if="isPinned(item.id)"
class="market-check">&#10003;</span>
        </div>
        <div
v-if="results.length === 0" class="market-no-results">No matches</div>
      </div>
    </div>
    <div class="market-supply-section">
      <div v-if="pinnedItems.length === 0" class="market-empty">No pinned items</div>
      <div v-for="item in pinnedItems"
:key="item.id" class="market-pinned-row">
        <span class="market-result-type"
 :class="item.type">{{ item.typeLabel }}</span>
        <span class="market-result-name">{{ item.name }}</span>
        <div class="market-pinned-side">
          <div class="market-controls">
            <button
              class="star-btn"
              :disabled="marketIdx(item.id) <= 0"
              @click="changeMarket(item.id, -1)"
            >
              −
            </button>
            <span class="market-val-wrap">
              <span
                v-if="marketingMult"
                class="market-raw"
                :class="{ negative: getMarket(item.id) < 1 }"
                >{{ marketLabel(item.id) }}</span
              >
              <span
                class="market-val"
                :class="{ negative: effectiveMarket(item.id) < 1 }"
                >×{{ effectiveMarket(item.id).toFixed(2) }}</span
              >
            </span>
            <button
              class="star-btn"
              :disabled="marketIdx(item.id) >= MARKET_VALS.length - 1"
              @click="changeMarket(item.id, 1)"
            >
              +
            </button>
            <button
              class="market-reset-btn" @click="unpinItem(item.id)">&times;</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../composables/useData'
import { useOverrides } from '../composables/useOverrides'
import { useSettings } from '../composables/useSettings'
import { MARKET_VALS } from '../utils/config'
import { effectiveMarketVal, getMarketingMult } from '../utils/calc'

const { DB, ORDER } = useData()
const { getMarket, setOverride } = useOverrides()
const { settings, setPinnedItems } = useSettings()

const marketingMult = computed(() => getMarketingMult(settings))

const query = ref('')

function loadPinned() {
  return Array.isArray(settings.pinnedItems) ? settings.pinnedItems : []
}

function savePinned(list) {
  setPinnedItems(list)
}

const allItems = computed(() => {
  const items = []
  for (const id of ORDER.value.ores) {
    const e = DB.value.ores[id]
    items.push({ id, name: e.name, type: 'ore', typeLabel: 'Ore' })
  }
  for (const id of ORDER.value.alloys) {
    const e = DB.value.alloys[id]
    items.push({ id, name: e.name, type: 'alloy', typeLabel: 'Alloy' })
  }
  for (const id of ORDER.value.items) {
    const e = DB.value.items[id]
    items.push({ id, name: e.name, type: 'item', typeLabel: 'Item' })
  }
  return items
})

const itemMap = computed(() => {
  const m = {}
  for (const i of allItems.value) m[i.id] = i
  return m
})

const results = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return []
  return allItems.value
    .filter(
      (i) => !isPinned(i.id) && (i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
    )
    .slice(0, 50)
})

const pinnedItems = computed(() => {
  const ids = loadPinned()
  const m = itemMap.value
  return ids.map((id) => m[id]).filter(Boolean)
})

function isPinned(id) {
  return loadPinned().includes(id)
}

function pinItem(id) {
  const list = loadPinned()
  if (!list.includes(id)) {
    list.push(id)
    savePinned(list)
  }
  query.value = ''
}

function unpinItem(id) {
  const list = loadPinned().filter((i) => i !== id)
  savePinned(list)
  setOverride(id, 'market', MARKET_VALS[2])
}

const MARKET_LABELS = ['-2', '-1', '0', '1', '2', '3', '4']

function marketIdx(id) {
  return MARKET_VALS.indexOf(getMarket(id))
}

function marketLabel(id) {
  const idx = marketIdx(id)
  return idx >= 0 ? MARKET_LABELS[idx] : getMarket(id)
}

function effectiveMarket(id) {
  return effectiveMarketVal(getMarket(id), settings)
}

function changeMarket(id, dir) {
  const idx = marketIdx(id)
  const newIdx = idx + dir
  if (newIdx >= 0 && newIdx < MARKET_VALS.length) {
    setOverride(id, 'market', MARKET_VALS[newIdx])
  }
}

</script>

<style scoped>
.market-panel {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #121824;
  border-radius: 10px;
  border: 1px solid #1e2a3a;
  min-height: 0;
}
.market-header {
  font-size: 11px;
  font-weight: 700;
  color: #6b7a8f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 12px 0;
  flex-shrink: 0;
}

.market-search-section {
  padding: 10px 12px 0;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.market-supply-section {
  padding: 8px 12px 10px;
  min-height: 0;
}
.market-search {
  width: 100%;
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  color: #e8edf5;
  font-size: 14px;
  padding: 8px 12px;
  outline: none;
  box-sizing: border-box;
}
.market-search:focus {
  border-color: #4caf50;
}
.market-search::placeholder {
  color: #4a5a6a;
}
.market-empty {
  color: #4a5a6a;
  font-size: 12px;
  padding: 6px 0;
}
.market-result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 4px;
}
.market-result-row:hover {
  background: #1a2235;
}
.market-result-type {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 40px;
  text-align: center;
  flex-shrink: 0;
}
.market-result-type.ore {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}
.market-result-type.alloy {
  background: rgba(79, 195, 247, 0.15);
  color: #4fc3f7;
}
.market-result-type.item {
  background: rgba(255, 183, 77, 0.15);
  color: #ffb74d;
}
.market-result-name {
  flex: 1;
  font-size: 13px;
  color: #c8d0dc;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.market-reset-btn {
  width: 22px;
  height: 22px;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  background: transparent;
  color: #ef5350;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;
}
.market-reset-btn:hover {
  border-color: #ef5350;
  background: rgba(239, 83, 80, 0.1);
}
.market-no-results {
  padding: 12px;
  text-align: center;
  color: #6b7a8f;
  font-size: 13px;
}
.market-pinned-title {
  font-size: 11px;
  font-weight: 700;
  color: #6b7a8f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.market-pinned-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0 4px;
}
.market-pinned-row .market-result-type {
  min-width: 36px;
}
.market-pinned-row .market-result-name {
  flex: 1;
  font-size: 13px;
  color: #c8d0dc;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.market-pinned-side {
  flex-shrink: 0;
}
.market-controls {
  display: flex;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}
.market-val-wrap {
  position: relative;
}
.market-val {
  min-width: 44px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #e8edf5;
  margin: 0 4px;
}
.market-val.negative {
  color: #ef5350;
}
.market-raw {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: #6b7a8f;
  min-width: 0;
}
.market-raw.negative {
  color: #ef5350;
}
.market-check {
  color: #4caf50;
  font-size: 14px;
  font-weight: 700;
  margin-left: auto;
}
.market-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #121824;
  border: 1px solid #1e2a3a;
  border-radius: 6px;
  padding: 4px 0;
  max-height: 260px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
</style>
