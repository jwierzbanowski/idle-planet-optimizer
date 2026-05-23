<template>
  <div class="container">
    <h1>IPM ROI Calculator</h1>
    <div class="subtitle">Idle Planet Miner — optimal crafting &amp; smelting</div>

    <SettingsPanel />

    <div class="header-row">
      <div class="tabs">
        <button v-for="t in tabs" :key="t.key" class="tab"
          :class="{ active: activeTab === t.key }"
          @click="switchTab(t.key)">
          {{ t.label }} <span class="count">({{ t.count }})</span>
        </button>
      </div>
      <button id="resetBtn" @click="resetAll">Reset overrides</button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <div>Loading data...</div>
    </div>

    <template v-else>
      <div class="tab-content" v-show="activeTab === 'ores'" v-html="oresHtml"></div>
      <div class="tab-content" v-show="activeTab === 'alloys'" v-html="alloysHtml"></div>
      <div class="tab-content" v-show="activeTab === 'items'" v-html="itemsHtml"></div>
    </template>

    <DetailPanel :detailId="detailId" @close="detailId = null" />
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import SettingsPanel from './components/SettingsPanel.vue'
import DetailPanel from './components/DetailPanel.vue'
import { useData } from './composables/useData'
import { useOverrides } from './composables/useOverrides'
import { useSettings } from './composables/useSettings'
import {
  effectivePrice, calcMaterialCost, calcTotalTime,
  getModifier, renderTree, buildTree
} from './utils/calc'
import { fmtPrice, fmtTime } from './utils/format'
import { MARKET_VALS } from './utils/config'

const { DB, ORDER, getEntity } = useData()
const { overrides, getStars, getMarket, setOverride, resetOverrides } = useOverrides()
const { settings } = useSettings()

const activeTab = ref('ores')
const detailId = ref(null)
const counts = reactive({ ores: 0, alloys: 0, items: 0 })
const loading = ref(true)

const tabs = computed(() => [
  { key: 'ores', label: 'Ores', count: counts.ores },
  { key: 'alloys', label: 'Alloys', count: counts.alloys },
  { key: 'items', label: 'Items', count: counts.items },
])

// ===== DATA LOADING =====
import { loadData } from './composables/useData'
loadData()
  .then(c => {
    counts.ores = c.oresCount
    counts.alloys = c.alloysCount
    counts.items = c.itemsCount
    loading.value = false
  })
  .catch(e => {
    console.error('Failed to load data:', e)
    loading.value = false
  })

function switchTab(tab) { activeTab.value = tab }

function resetAll() {
  if (!confirm('Reset all star and market overrides?')) return
  resetOverrides()
  detailId.value = null
}

// ===== STAR / MARKET CONTROLS (HTML) =====
function starControlsHtml(id) {
  const s = getStars(id)
  return '<div class="star-controls">'
    + '<button class="star-btn" onclick="event.stopPropagation();window.__setOverride(\'' + id + '\',\'stars\',' + Math.max(0, s - 1) + ')"' + (s === 0 ? ' disabled' : '') + '>−</button>'
    + '<span class="star-count">' + s + '</span>'
    + '<button class="star-btn" onclick="event.stopPropagation();window.__setOverride(\'' + id + '\',\'stars\',' + (s + 1) + ')">+</button>'
    + '</div>'
}

function marketControlsHtml(id) {
  let m = getMarket(id)
  let idx = MARKET_VALS.indexOf(m)
  if (idx === -1) { idx = 2; m = 1 }
  return '<div class="star-controls">'
    + '<button class="star-btn" onclick="event.stopPropagation();window.__setOverride(\'' + id + '\',\'market\',' + MARKET_VALS[idx - 1] + ')"' + (idx <= 0 ? ' disabled' : '') + '>−</button>'
    + '<span class="star-count' + (m < 1 ? ' negative' : '') + '">x' + m.toFixed(2) + '</span>'
    + '<button class="star-btn" onclick="event.stopPropagation();window.__setOverride(\'' + id + '\',\'market\',' + MARKET_VALS[idx + 1] + ')"' + (idx >= MARKET_VALS.length - 1 ? ' disabled' : '') + '>+</button>'
    + '</div>'
}

// expose for onclick in HTML strings
window.__setOverride = setOverride

// ===== ORES TABLE =====
const oresHtml = computed(() => {
  let html = '<div class="table-wrap"><table>'
  html += '<thead><tr>'
  html += '<th>Name</th><th>Base Price</th><th>Smelted Into</th><th>Market</th><th>Effective Price</th>'
  html += '</tr></thead><tbody>'
  for (const id of ORDER.value.ores) {
    const row = DB.value.ores[id]
    const eff = effectivePrice(id, overrides, settings)
    const smeltTarget = row.smeltedInto ? getEntity(row.smeltedInto) : null
    html += '<tr onclick="window.__showDetail(\'' + id + '\',\'ore\')">'
    html += '<td class="name-cell">' + row.name + starControlsHtml(id) + '</td>'
    html += '<td class="price">' + fmtPrice(row.basePrice) + '</td>'
    html += '<td>' + (smeltTarget ? smeltTarget.name : '<span class="price-small">—</span>') + '</td>'
    html += '<td>' + marketControlsHtml(id) + '</td>'
    html += '<td class="price">' + fmtPrice(eff) + '</td>'
    html += '</tr>'
  }
  html += '</tbody></table></div>'
  return html
})

// ===== ALLOYS TABLE =====
const alloysHtml = computed(() => {
  let html = '<div class="table-wrap"><table>'
  html += '<thead><tr>'
  html += '<th>Name</th><th>Smelt Time</th><th>Ingredients</th><th>Base Price</th><th>Market</th>'
  html += '<th>Effective Price</th><th>Material Cost</th><th>Profit / Craft</th><th>Profit / sec</th><th>Total Time</th>'
  html += '</tr></thead><tbody>'
  for (const id of ORDER.value.alloys) {
    const row = DB.value.alloys[id]
    const t = calcTotalTime(id, 1, overrides, settings)
    const oc = calcMaterialCost(id, 1, overrides, settings)
    const eff = effectivePrice(id, overrides, settings)
    const profit = eff - oc
    const pps = t > 0 ? profit / t : 0
    const forgeMod = getModifier('rooms', 'forge', settings)
    const ufMod = getModifier('rooms', 'underforge', settings)
    const ingStr = row.ingredients.map(i => {
      const e = getEntity(i.id)
      const q = ufMod ? (i.qty * ufMod) : i.qty
      return (q > 1 ? q.toFixed(1) + '× ' : '') + (e ? e.name : i.id)
    }).join('<br>')
    html += '<tr onclick="window.__showDetail(\'' + id + '\',\'alloy\')">'
    html += '<td class="name-cell"><span class="type-badge alloy">A</span>' + row.name + starControlsHtml(id) + '</td>'
    html += '<td>' + fmtTime((forgeMod && row.time) ? row.time / forgeMod : row.time) + '</td>'
    html += '<td><span class="ingredient-list">' + ingStr + '</span></td>'
    html += '<td class="price">' + fmtPrice(row.basePrice) + '</td>'
    html += '<td>' + marketControlsHtml(id) + '</td>'
    html += '<td class="price">' + fmtPrice(eff) + '</td>'
    html += '<td class="price-small">' + fmtPrice(oc) + '</td>'
    html += '<td class="' + (profit >= 0 ? 'positive' : 'negative') + '">' + fmtPrice(profit) + '</td>'
    html += '<td class="' + (pps >= 0 ? 'positive' : 'negative') + '" style="font-weight:600">' + fmtPrice(pps) + '/s</td>'
    html += '<td class="price-small">' + fmtTime(t) + '</td>'
    html += '</tr>'
  }
  html += '</tbody></table></div>'
  return html
})

// ===== ITEMS TABLE =====
const itemsHtml = computed(() => {
  let html = '<div class="table-wrap"><table>'
  html += '<thead><tr>'
  html += '<th>Name</th><th>Craft Time</th><th>Ingredients</th><th>Base Price</th><th>Market</th>'
  html += '<th>Effective Price</th><th>Material Cost</th><th>Profit / Craft</th><th>Profit / sec</th><th>Total Time</th>'
  html += '</tr></thead><tbody>'
  for (const id of ORDER.value.items) {
    const row = DB.value.items[id]
    const t = calcTotalTime(id, 1, overrides, settings)
    const oc = calcMaterialCost(id, 1, overrides, settings)
    const eff = effectivePrice(id, overrides, settings)
    const profit = eff - oc
    const pps = t > 0 ? profit / t : 0
    const workshopMod = getModifier('rooms', 'workshop', settings)
    const dormMod = getModifier('rooms', 'dorm', settings)
    const ingStr = row.ingredients.map(i => {
      const e = getEntity(i.id)
      const q = dormMod ? (i.qty * dormMod) : i.qty
      return (q > 1 ? q.toFixed(1) + '× ' : '') + (e ? e.name : i.id)
    }).join('<br>')
    html += '<tr onclick="window.__showDetail(\'' + id + '\',\'item\')">'
    html += '<td class="name-cell"><span class="type-badge item">I</span>' + row.name + starControlsHtml(id) + '</td>'
    html += '<td>' + fmtTime((workshopMod && row.time) ? row.time / workshopMod : row.time) + '</td>'
    html += '<td><span class="ingredient-list">' + ingStr + '</span></td>'
    html += '<td class="price">' + fmtPrice(row.basePrice) + '</td>'
    html += '<td>' + marketControlsHtml(id) + '</td>'
    html += '<td class="price">' + fmtPrice(eff) + '</td>'
    html += '<td class="price-small">' + fmtPrice(oc) + '</td>'
    html += '<td class="' + (profit >= 0 ? 'positive' : 'negative') + '">' + fmtPrice(profit) + '</td>'
    html += '<td class="' + (pps >= 0 ? 'positive' : 'negative') + '" style="font-weight:600">' + fmtPrice(pps) + '/s</td>'
    html += '<td class="price-small">' + fmtTime(t) + '</td>'
    html += '</tr>'
  }
  html += '</tbody></table></div>'
  return html
})

// expose for onclick in HTML strings
window.__showDetail = (id) => { detailId.value = id }
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0e17;
  color: #c8d0dc;
  min-height: 100vh;
  padding: 20px;
}
.container { max-width: 1400px; margin: 0 auto; }
h1 {
  font-size: 28px; font-weight: 700; color: #4fc3f7;
  margin-bottom: 4px; letter-spacing: 0.5px;
}
.subtitle { color: #6b7a8f; font-size: 14px; margin-bottom: 24px; }
.tabs {
  display: flex; gap: 4px; margin-bottom: 20px;
  background: #121824; border-radius: 10px; padding: 4px;
  display: inline-flex;
}
.tab {
  padding: 10px 28px; border: none; background: transparent;
  color: #6b7a8f; font-size: 15px; font-weight: 600;
  cursor: pointer; border-radius: 8px; transition: all 0.2s;
}
.tab:hover { color: #c8d0dc; background: #1a2235; }
.tab.active { color: #fff; background: #1e88e5; }
.tab .count { color: #6b7a8f; font-size: 12px; margin-left: 6px; font-weight: 400; }
.tab.active .count { color: rgba(255,255,255,0.6); }
.header-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
}
.table-wrap {
  overflow-x: auto; background: #121824; border-radius: 10px;
  border: 1px solid #1e2a3a;
}
table {
  width: 100%; border-collapse: collapse; font-size: 13px;
  min-width: 900px;
}
thead th {
  background: #0d1520; padding: 10px 12px; text-align: left;
  font-weight: 600; color: #6b7a8f; font-size: 12px; text-transform: uppercase;
  letter-spacing: 0.5px; white-space: nowrap; border-bottom: 1px solid #1e2a3a;
  user-select: none;
}
tbody tr {
  border-bottom: 1px solid #1a2235; transition: background 0.15s;
  cursor: pointer;
}
tbody tr:hover { background: #1a2235; }
tbody tr.expanded { background: #162030; }
td {
  padding: 10px 12px; white-space: nowrap; vertical-align: middle;
}
td.name-cell { font-weight: 600; color: #e8edf5; }
td .type-badge {
  display: inline-block; font-size: 10px; padding: 1px 6px;
  border-radius: 4px; margin-right: 6px; font-weight: 600;
}
.type-badge.alloy { background: #1b3a2a; color: #4caf50; }
.type-badge.item { background: #1a2a45; color: #64b5f6; }
td .ingredient-list { color: #6b7a8f; font-size: 11px; line-height: 1.5; white-space: nowrap; }
.positive { color: #4caf50; }
.negative { color: #ef5350; }
.price { color: #e8edf5; }
.price-small { color: #6b7a8f; font-size: 11px; }
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
.loading {
  text-align: center; padding: 60px 20px; color: #6b7a8f;
}
.loading .spinner {
  display: inline-block; width: 32px; height: 32px;
  border: 3px solid #1e2a3a; border-top-color: #4fc3f7;
  border-radius: 50%; animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty { text-align: center; padding: 40px; color: #6b7a8f; }

/* Detail panel */
.detail-panel {
  background: #0d1520; border: 1px solid #1e2a3a;
  border-radius: 10px; margin-top: 16px; padding: 20px;
  display: none;
}
.detail-panel.open { display: block; }
.detail-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 16px;
}
.detail-title { font-size: 20px; font-weight: 700; color: #e8edf5; }
.detail-close {
  background: none; border: none; color: #6b7a8f;
  font-size: 22px; cursor: pointer; padding: 4px 8px; border-radius: 4px;
}
.detail-close:hover { color: #fff; background: #1a2235; }
.detail-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px; margin-bottom: 20px;
}
.stat-box {
  background: #121824; border-radius: 8px; padding: 12px 16px;
  border: 1px solid #1e2a3a;
}
.stat-label { font-size: 11px; color: #6b7a8f; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.stat-value { font-size: 18px; font-weight: 600; color: #e8edf5; }
.tree { margin-top: 12px; }
.tree-node { padding-left: 20px; border-left: 1px solid #2a3a4a; margin: 4px 0; padding: 4px 0 4px 16px; }
.tree-node.root { border-left: none; padding-left: 0; }
.tree-item {
  display: flex; align-items: center; gap: 8px; padding: 4px 8px;
  border-radius: 4px; transition: background 0.15s;
}
.tree-item:hover { background: #1a2235; }
.tree-qty { color: #6b7a8f; font-size: 12px; min-width: 48px; }
.tree-name { color: #e8edf5; font-weight: 500; }
.tree-price { color: #6b7a8f; font-size: 12px; margin-left: auto; }
.tree-time { color: #6b7a8f; font-size: 12px; margin-left: 12px; }
.tree-arrow { color: #4fc3f7; font-size: 10px; margin-right: 4px; }

#resetBtn {
  padding: 8px 16px; background: transparent; border: 1px solid #2a3a4a;
  border-radius: 6px; color: #6b7a8f; font-size: 13px; cursor: pointer;
}
#resetBtn:hover { border-color: #ef5350; color: #ef5350; }




/* Settings panel (scoped) */
.settings-bar { margin-bottom: 12px; }
#settingsToggle {
  padding: 8px 16px; background: transparent; border: 1px solid #2a3a4a;
  border-radius: 6px; color: #6b7a8f; font-size: 13px; cursor: pointer;
  width: 100%; text-align: left; font-weight: 600;
}
#settingsToggle:hover { border-color: #4fc3f7; color: #4fc3f7; }
.settings-panel {
  max-height: 0; overflow: hidden;
  transition: max-height 0.3s ease;
  background: #121824; border-radius: 10px;
  border: 1px solid #1e2a3a; margin-bottom: 16px;
}
.settings-panel.open { max-height: 2000px; }
.settings-categories {
  display: flex; gap: 4px; padding: 12px 12px 0;
}
.settings-cat {
  padding: 8px 20px; border: none; background: transparent;
  color: #6b7a8f; font-size: 13px; font-weight: 600;
  cursor: pointer; border-radius: 6px; transition: all 0.2s;
}
.settings-cat:hover { color: #c8d0dc; background: #1a2235; }
.settings-cat.active { color: #fff; background: #1e88e5; }
.settings-content {
  padding: 12px; display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}
.settings-empty {
  grid-column: 1 / -1; text-align: center; padding: 20px;
  color: #6b7a8f;
}
.settings-row {
  display: flex; align-items: center; gap: 12px;
  background: #0d1520; border-radius: 6px; padding: 8px 12px;
  border: 1px solid #1a2235;
}
.settings-info {
  flex: 1; min-width: 0;
}
.settings-label {
  color: #c8d0dc; font-size: 13px; font-weight: 500;
}
.settings-desc {
  display: block; color: #6b7a8f; font-size: 11px; margin-top: 2px;
}
.settings-effect {
  color: #4fc3f7; font-size: 14px; font-weight: 600;
  min-width: 56px; text-align: right;
}

@media (max-width: 768px) {
  body { padding: 12px; }
  h1 { font-size: 22px; }
  .tabs { width: 100%; }
  .tab { flex: 1; text-align: center; padding: 10px 12px; font-size: 13px; }
  td, th { padding: 8px 8px; font-size: 12px; }
  .stars-input { width: 48px; }
  table { min-width: 700px; }
}
</style>
