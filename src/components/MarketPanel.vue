<template>
  <div class="market-bar">
    <button id="marketToggle" @click="toggle">{{ open ? '▼ Current Market' : '▶ Current Market' }}</button>
  </div>
  <div class="market-panel" :class="{ open }">
    <div class="market-search-wrap">
      <input type="text" class="market-search" placeholder="Search ore, alloy, item..." v-model="query" @input="onSearch" @keydown.escape="query = ''">
      <div class="market-results" v-if="query.length > 0">
        <div v-for="item in results" :key="item.id" class="market-result-row" @click="pinItem(item.id)">
          <span class="market-result-type" :class="item.type">{{ item.typeLabel }}</span>
          <span class="market-result-name">{{ item.name }}</span>
          <span v-if="isPinned(item.id)" class="market-check">&#10003;</span>
        </div>
        <div v-if="results.length === 0" class="market-no-results">No matches</div>
      </div>
    </div>
    <div class="market-pinned" v-if="pinnedItems.length > 0">
      <div class="market-pinned-title">Pinned Items</div>
      <div v-for="item in pinnedItems" :key="item.id" class="market-pinned-row">
        <span class="market-result-type" :class="item.type">{{ item.typeLabel }}</span>
        <span class="market-result-name">{{ item.name }}</span>
        <div class="market-controls">
          <button class="star-btn" @click="changeMarket(item.id, -1)" :disabled="marketIdx(item.id) <= 0">−</button>
          <span class="market-val" :class="{ negative: getMarket(item.id) < 1 }">×{{ getMarket(item.id).toFixed(2) }}</span>
          <button class="star-btn" @click="changeMarket(item.id, 1)" :disabled="marketIdx(item.id) >= MARKET_VALS.length - 1">+</button>
          <button class="market-reset-btn" @click="unpinItem(item.id)">&times;</button>
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

const { DB, ORDER } = useData()
const { overrides, getMarket, setOverride } = useOverrides()
const { settings, setPinnedItems } = useSettings()

const open = ref(false)
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
  return allItems.value.filter(i =>
    !isPinned(i.id) && (i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
  ).slice(0, 50)
})

const pinnedItems = computed(() => {
  const ids = loadPinned()
  const m = itemMap.value
  return ids.map(id => m[id]).filter(Boolean)
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
  const list = loadPinned().filter(i => i !== id)
  savePinned(list)
  setOverride(id, 'market', MARKET_VALS[2])
}

function marketIdx(id) {
  return MARKET_VALS.indexOf(getMarket(id))
}

function changeMarket(id, dir) {
  const idx = marketIdx(id)
  const newIdx = idx + dir
  if (newIdx >= 0 && newIdx < MARKET_VALS.length) {
    setOverride(id, 'market', MARKET_VALS[newIdx])
  }
}

function onSearch() {}

function toggle() { open.value = !open.value }
</script>
