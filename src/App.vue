<template>
  <div class="container">
    <h1>IPM ROI Calculator</h1>
    <div class="subtitle">Idle Planet Miner — optimal crafting &amp; smelting</div>

    <SettingsPanel />

    <div v-if="!loading" class="debug-bar">
      <span class="debug-item">
        Smelt: <strong>{{ debugStats.smeltRate }}</strong>
        <span class="info-icon" :data-tip="debugStats.smeltInfo">i</span>
      </span>
      <span class="debug-item">
        Craft: <strong>{{ debugStats.craftRate }}</strong>
        <span class="info-icon" :data-tip="debugStats.craftInfo">i</span>
      </span>
      <span class="debug-item">
        Smelt Cost: <strong>{{ debugStats.smeltCost }}</strong>
        <span class="info-icon" :data-tip="debugStats.smeltCostInfo">i</span>
      </span>
      <span class="debug-item">
        Craft Cost: <strong>{{ debugStats.craftCost }}</strong>
        <span class="info-icon" :data-tip="debugStats.craftCostInfo">i</span>
      </span>
      <span class="debug-item">
        Mine Rate: <strong>{{ debugStats.mineRate }}</strong>
        <span class="info-icon" :data-tip="debugStats.mineInfo">i</span>
      </span>
      <span class="debug-item">
        Alloy Value: <strong>{{ debugStats.alloyVal }}</strong>
        <span class="info-icon" :data-tip="debugStats.alloyInfo">i</span>
      </span>
      <span class="debug-item">
        Item Value: <strong>{{ debugStats.itemVal }}</strong>
        <span class="info-icon" :data-tip="debugStats.itemInfo">i</span>
      </span>
    </div>

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
      <div class="tab-content" v-show="activeTab === 'mining'" v-html="miningHtml"></div>
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
  getModifier, getMiningSpeedMult, getBeaconMult, getSmeltSpeedMult, getCraftSpeedMult,
  getProjectMultiplier, getStationMult, getStationValueMult, renderTree, buildTree
} from './utils/calc'
import { fmtPrice, fmtTime, fmtQty } from './utils/format'
import { MARKET_VALS } from './utils/config'

const { DB, ORDER, getEntity } = useData()
const { overrides, getStars, getMarket, getMiningLevel, setOverride, resetOverrides } = useOverrides()
const { settings, managerVersion } = useSettings()

const activeTab = ref('ores')
const detailId = ref(null)
const counts = reactive({ ores: 0, alloys: 0, items: 0, mining: 0 })
const loading = ref(true)

const tabs = computed(() => [
  { key: 'ores', label: 'Ores', count: counts.ores },
  { key: 'alloys', label: 'Alloys', count: counts.alloys },
  { key: 'items', label: 'Items', count: counts.items },
  { key: 'mining', label: 'Mining', count: counts.mining },
])

// ===== DATA LOADING =====
import { loadData } from './composables/useData'
loadData()
  .then(c => {
    counts.ores = c.oresCount
    counts.alloys = c.alloysCount
    counts.items = c.itemsCount
    counts.mining = c.miningCount
    loading.value = false
  })
  .catch(e => {
    console.error('Failed to load data:', e)
    loading.value = false
  })

// ===== DEBUG STATS =====
function infoLines(title, rows, total) {
  const active = rows.filter(r => r[1] != null)
  const lines = [title]
  for (const [label, val] of active) {
    lines.push('  ' + label + ': ' + val.toFixed(2) + '×')
  }
  if (active.length > 1) lines.push('  ─────────────────')
  lines.push('  Result: ' + (total != null ? total.toFixed(2) + '×' : '1.00×'))
  return lines.join('\n')
}

const debugStats = computed(() => {
  managerVersion.value // force re-evaluate on manager changes

  const forge = getModifier('rooms', 'forge', settings)
  const workshop = getModifier('rooms', 'workshop', settings)
  const underforge = getModifier('rooms', 'underforge', settings)
  const dorm = getModifier('rooms', 'dorm', settings)
  const engineering = getModifier('rooms', 'engineering', settings)
  const sales = getModifier('rooms', 'sales', settings)

  const furnaceProj = getProjectMultiplier(settings, ['advancedFurnace', 'superiorFurnace'])
  const crafterProj = getProjectMultiplier(settings, ['advancedCrafter', 'superiorCrafter'])
  const miningProj = getProjectMultiplier(settings, ['advancedMining', 'superiorMining'])
  const alloyProj = getProjectMultiplier(settings, ['advancedAlloyValue', 'superiorAlloyValue'])
  const itemProj = getProjectMultiplier(settings, ['advancedItemValue', 'superiorItemValue'])

  const stnSmelt = getStationMult(settings, ['smelting1','smelting2','smelting3','smelting4','smelting5'])
  const stnCraft = getStationMult(settings, ['crafting1','crafting2','crafting3','crafting4','crafting5'])
  const stnMine = getStationMult(settings, ['mining1', 'mining2'])
  const stnValue = getStationValueMult(settings)

  const global12 = settings.station?.miningGlobal ? 1.2 : null

  const mgrSmelt = (m => m > 1 ? m : null)(countManagers(settings, 'allSmeltSpeed'))
  const mgrCraft = (m => m > 1 ? m : null)(countManagers(settings, 'allCraftSpeed'))

  const smeltRate = getSmeltSpeedMult(settings)
  const craftRate = getCraftSpeedMult(settings)
  const mineRate = getMiningSpeedMult(settings)

  const salesMod = sales || 1
  const stnVal = stnValue || 1
  const alloyV = (salesMod * stnVal * (alloyProj || 1)).toFixed(2) + '×'
  const itemV = (salesMod * stnVal * (itemProj || 1)).toFixed(2) + '×'

  const fmt = v => v ? v.toFixed(2) + '×' : '1.00×'

  const smeltInfo = infoLines('Smelt Rate', [
    ['Forge room', forge],
    ['Furnace projects', furnaceProj],
    ['Smelting stations', stnSmelt],
    ['Manager (allSmeltSpeed)', mgrSmelt],
  ], smeltRate)

  const craftInfo = infoLines('Craft Rate', [
    ['Workshop room', workshop],
    ['Crafter projects', crafterProj],
    ['Crafting stations', stnCraft],
    ['Manager (allCraftSpeed)', mgrCraft],
  ], craftRate)

  const smeltCostInfo = infoLines('Smelt Cost', [
    ['Underforge room', underforge],
  ], underforge)

  const craftCostInfo = infoLines('Craft Cost', [
    ['Dorm room', dorm],
  ], dorm)

  const mineInfo = infoLines('Mine Rate', [
    ['Engineering room', engineering],
    ['Mining projects', miningProj],
    ['Mining stations', stnMine],
    ['Global 1.2×', global12],
  ], mineRate)

  const alloyInfo = infoLines('Alloy Value', [
    ['Sales room', sales],
    ['Station value', stnValue],
    ['Alloy value projects', alloyProj],
  ], salesMod * stnVal * (alloyProj || 1))

  const itemInfo = infoLines('Item Value', [
    ['Sales room', sales],
    ['Station value', stnValue],
    ['Item value projects', itemProj],
  ], salesMod * stnVal * (itemProj || 1))

  return {
    mineRate: fmt(mineRate),
    smeltRate: fmt(smeltRate),
    craftRate: fmt(craftRate),
    smeltCost: fmt(underforge),
    craftCost: fmt(dorm),
    alloyVal: alloyV,
    itemVal: itemV,
    smeltInfo, craftInfo, smeltCostInfo, craftCostInfo, mineInfo, alloyInfo, itemInfo,
  }
})

function breakdownSmelt(s) {
  const parts = []
  const f = getModifier('rooms', 'forge', s)
  if (f) parts.push('Forge×' + f.toFixed(2))
  const fp = getProjectMultiplier(s, ['advancedFurnace', 'superiorFurnace'])
  if (fp) parts.push('Proj×' + fp.toFixed(2))
  const ss = getStationMult(s, ['smelting1','smelting2','smelting3','smelting4','smelting5'])
  if (ss && ss > 1) parts.push('Stn×' + ss.toFixed(2))
  const mgrS = countManagers(s, 'allSmeltSpeed')
  if (mgrS) parts.push('Mgr×' + mgrS.toFixed(2))
  return parts.length ? parts.join(' + ') : 'none'
}

function breakdownCraft(s) {
  const parts = []
  const w = getModifier('rooms', 'workshop', s)
  if (w) parts.push('Workshop×' + w.toFixed(2))
  const cp = getProjectMultiplier(s, ['advancedCrafter', 'superiorCrafter'])
  if (cp) parts.push('Proj×' + cp.toFixed(2))
  const sc = getStationMult(s, ['crafting1','crafting2','crafting3','crafting4','crafting5'])
  if (sc && sc > 1) parts.push('Stn×' + sc.toFixed(2))
  const mgrC = countManagers(s, 'allCraftSpeed')
  if (mgrC) parts.push('Mgr×' + mgrC.toFixed(2))
  return parts.length ? parts.join(' + ') : 'none'
}

function countManagers(s, skill) {
  const mgrs = s.managers
  if (!Array.isArray(mgrs)) return 0
  let mult = 1
  for (const m of mgrs) {
    if (m.skill === skill && m.value > 0) mult *= m.value
  }
  return mult > 1 ? mult : 0
}

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
  managerVersion.value
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
    const smeltMult = getSmeltSpeedMult(settings)
    const ufMod = getModifier('rooms', 'underforge', settings)
    const ingStr = row.ingredients.map(i => {
      const e = getEntity(i.id)
      const q = ufMod ? (i.qty * ufMod) : i.qty
      return (q > 1 ? fmtQty(q) + '× ' : '') + (e ? e.name : i.id)
    }).join('<br>')
    html += '<tr onclick="window.__showDetail(\'' + id + '\',\'alloy\')">'
    html += '<td class="name-cell">' + row.name + starControlsHtml(id) + '</td>'
    html += '<td>' + fmtTime((smeltMult && row.time) ? row.time / smeltMult : row.time) + '</td>'
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
  managerVersion.value
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
    const craftMult = getCraftSpeedMult(settings)
    const dormMod = getModifier('rooms', 'dorm', settings)
    const ingStr = row.ingredients.map(i => {
      const e = getEntity(i.id)
      const q = dormMod ? (i.qty * dormMod) : i.qty
      return (q > 1 ? fmtQty(q) + '× ' : '') + (e ? e.name : i.id)
    }).join('<br>')
    html += '<tr onclick="window.__showDetail(\'' + id + '\',\'item\')">'
    html += '<td class="name-cell">' + row.name + starControlsHtml(id) + '</td>'
    html += '<td>' + fmtTime((craftMult && row.time) ? row.time / craftMult : row.time) + '</td>'
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

function fmtDuration(hours) {
  if (!isFinite(hours) || hours <= 0) return '∞'
  if (hours < 1) return (hours * 60).toFixed(0) + 'm'
  if (hours < 24) return hours.toFixed(1) + 'h'
  if (hours < 720) return (hours / 24).toFixed(1) + 'd'
  if (hours < 8760) return (hours / 720).toFixed(1) + 'mo'
  return (hours / 8760).toFixed(1) + 'y'
}

// ===== MINING TABLE =====
const miningHtml = computed(() => {
  // planets table
  let html = '<div class="table-wrap"><table>'
  html += '<thead><tr>'
  html += '<th>Planet</th><th>Base Price</th><th>Resources</th><th>Mining Lv</th><th>Rate</th><th>Profit / s</th><th>Profit / h</th><th>Payback</th>'
  html += '</tr></thead><tbody>'

  const rows = ORDER.value.planets.map(id => {
    const p = DB.value.planets[id]
    const lvl = getMiningLevel(id)
    const md = DB.value.mining['lvl' + lvl] || DB.value.mining['lvl1']
    const miningMult = getMiningSpeedMult(settings) || 1
    const beaconMult = getBeaconMult(p.number, settings)
    const rate = md.rate * miningMult * beaconMult, speed = md.speed, cargo = md.cargo
    const dist = p.distance
    let profitPerSec = 0, profitPerHour = 0

    if (dist != null && dist > 0) {
      let weightedPrice = 0
      for (const r of p.resources) {
        const ore = DB.value.ores[r.ore]
        if (ore) weightedPrice += (r.yield / 100) * ore.basePrice
      }
      const cargoValue = cargo * weightedPrice
      const mineTime = cargo / rate
      const cycleTime = 2 * (dist / speed) + mineTime
      profitPerSec = cycleTime > 0 ? cargoValue / cycleTime : 0
      profitPerHour = profitPerSec * 3600
    }

    const price = md.price
    const paybackHours = profitPerHour > 0 ? price / profitPerHour : Infinity
    return { id: p.id, name: p.name, number: p.number, basePrice: p.basePrice, resources: p.resources, distance: dist, lvl, rate, profitPerSec, profitPerHour, paybackHours }
  })

  rows.sort((a, b) => a.number - b.number)

  for (const row of rows) {
    const resStr = row.resources.map(r => {
      const ore = DB.value.ores[r.ore]
      return (ore ? ore.name : r.ore) + ' ' + r.yield + '%'
    }).join('<br>')

    const lvl = row.lvl
    html += '<tr>'
    html += '<td class="name-cell">' + row.name + '</td>'
    html += '<td class="price">' + fmtPrice(row.basePrice) + '</td>'
    html += '<td><span class="ingredient-list">' + resStr + '</span></td>'
    html += '<td><div class="mining-level-select" style="display:inline-flex">'
      + '<button class="star-btn" onclick="event.stopPropagation();window.__setMiningLevel(\'' + row.id + '\',' + (lvl - 1) + ')"' + (lvl <= 1 ? ' disabled' : '') + '>−</button>'
      + '<input type="number" class="mining-level-input" value="' + lvl + '" min="1" max="100" style="width:48px" onchange="event.stopPropagation();window.__setMiningLevel(\'' + row.id + '\',parseInt(this.value)||1)">'
      + '<button class="star-btn" onclick="event.stopPropagation();window.__setMiningLevel(\'' + row.id + '\',' + (lvl + 1) + ')"' + (lvl >= 100 ? ' disabled' : '') + '>+</button>'
    + '</div></td>'
    html += '<td class="price">' + row.rate.toFixed(3) + '/s</td>'
    if (row.distance != null && row.distance > 0) {
      html += '<td class="' + (row.profitPerSec >= 0 ? 'positive' : 'negative') + '" style="font-weight:600">' + fmtPrice(row.profitPerSec) + '/s</td>'
      html += '<td class="' + (row.profitPerHour >= 0 ? 'positive' : 'negative') + '">' + fmtPrice(row.profitPerHour) + '/h</td>'
      html += '<td class="price-small">' + fmtDuration(row.paybackHours) + '</td>'
    } else {
      html += '<td class="price-small">—</td><td class="price-small">—</td><td class="price-small">—</td>'
    }
    html += '</tr>'
  }

  html += '</tbody></table></div>'
  return html
})

// expose for onclick in HTML strings
window.__showDetail = (id) => { detailId.value = id }
window.__setMiningLevel = (id, lvl) => { setOverride(id, 'miningLevel', Math.max(1, Math.min(100, lvl))) }
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
.debug-bar {
  display: flex; gap: 16px; margin-bottom: 12px; padding: 8px 12px;
  background: #0d1520; border-radius: 6px; border: 1px solid #1a2235;
  font-size: 12px; color: #6b7a8f; flex-wrap: wrap;
}
.debug-item strong { color: #4fc3f7; font-weight: 600; }
.info-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #4fc3f7;
  color: #4fc3f7;
  font-size: 10px;
  font-weight: 700;
  font-style: italic;
  cursor: help;
  margin-right: 5px;
  font-family: 'Times New Roman', serif;
  line-height: 1;
  vertical-align: middle;
  flex-shrink: 0;
}
.info-icon::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #1a2235;
  color: #c8d0dc;
  padding: 7px 11px;
  border-radius: 6px;
  font-size: 11px;
  white-space: pre-line;
  text-align: left;
  border: 1px solid #2a3a4a;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 100;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 400;
  font-style: normal;
  line-height: 1.4;
}
.info-icon:hover::after {
  opacity: 1;
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

.mining-level-select {
  display: flex; align-items: center; gap: 4px;
}
.mining-level-input {
  width: 48px; background: #0d1520; border: 1px solid #2a3a4a; border-radius: 4px;
  color: #e8edf5; font-size: 13px; font-weight: 600; text-align: center;
  padding: 3px 4px; outline: none;
}
.mining-level-input:focus { border-color: #4fc3f7; }
.mining-level-input::-webkit-inner-spin-button { opacity: 0.5; }




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
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.station-group {
  background: #0d1520; border-radius: 8px; padding: 8px; border: 1px solid #1a2235;
}
.station-group .project-group-title { padding: 0 4px; }
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
.manager-select {
  background: #0d1520; border: 1px solid #2a3a4a; border-radius: 6px;
  color: #c8d0dc; font-size: 12px; padding: 6px 8px; cursor: pointer;
  min-width: 140px;
}
.manager-select:hover { border-color: #4fc3f7; }
.manager-select option { background: #0d1520; color: #c8d0dc; }
.mgr-card {
  display: flex; align-items: center; gap: 8px;
  background: #0d1520; border-radius: 6px; padding: 8px 12px;
  border: 1px solid #1a2235; grid-column: 1 / -1;
}
.mgr-select {
  flex: 1; background: #121824; border: 1px solid #2a3a4a; border-radius: 4px;
  color: #c8d0dc; font-size: 13px; padding: 6px 8px; cursor: pointer;
}
.mgr-value {
  width: 80px; background: #121824; border: 1px solid #2a3a4a; border-radius: 4px;
  color: #c8d0dc; font-size: 13px; padding: 6px 8px; text-align: center;
}
.mgr-remove {
  width: 28px; height: 28px; border: 1px solid #2a3a4a; border-radius: 4px;
  background: transparent; color: #ef5350; font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.mgr-remove:hover { border-color: #ef5350; background: rgba(239,83,80,0.1); }
.mgr-add {
  grid-column: 1 / -1; padding: 8px; border: 1px dashed #2a3a4a; border-radius: 6px;
  background: transparent; color: #4fc3f7; font-size: 13px; cursor: pointer;
  text-align: center;
}
.mgr-add:hover { border-color: #4fc3f7; background: rgba(79,195,247,0.05); }
.toggle-btn {
  width: 40px; height: 22px; border-radius: 11px; border: 1px solid #2a3a4a;
  background: #0d1520; cursor: pointer; position: relative; transition: all 0.2s;
  padding: 0; flex-shrink: 0;
}
.toggle-btn.active { background: #1e88e5; border-color: #1e88e5; }
.toggle-knob {
  display: block; width: 16px; height: 16px; border-radius: 50%;
  background: #6b7a8f; position: absolute; top: 2px; left: 2px;
  transition: all 0.2s;
}
.toggle-btn.active .toggle-knob { background: #fff; left: 20px; }
.project-group { margin-bottom: 12px; }
.project-group:last-child { margin-bottom: 0; }
.project-group-title {
  font-size: 11px; font-weight: 700; color: #6b7a8f;
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; padding: 0 4px;
}
.project-check-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 4px; cursor: pointer;
  transition: background 0.15s;
}
.project-check-row:hover { background: #0d1520; }
.project-check { accent-color: #1e88e5; cursor: pointer; }
.project-check-row .settings-effect { margin-left: auto; }

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
