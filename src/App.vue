<template>
  <div class="container">
    <div class="top-bar">
      <h1>Idle Planet Optimizer</h1>
      <div class="header-actions">
        <button
class="profile-btn" @click="showProfile = true" title="Profile"><User :size="18" /></button>
        <div class="btn-badge-wrap">
          <button
class="game-btn" @click="showGame = true; showGameBadge = false" title="Game"><Gamepad2 :size="18" /></button>
          <span v-if="showGameBadge" class="badge-dot" />
        </div>
        <button
class="reset-btn" @click="resetAll" title="Reset playthrough"><RotateCcw :size="18" /></button>
        <div class="backup-wrap">
          <button
class="backup-btn" @click="backupOpen = !backupOpen">Backup</button>
          <div v-if="backupOpen" class="backup-dropdown">
            <button @click="exportProfile(); backupOpen = false"><Download :size="16" /> Export</button>
            <button @click="triggerImport(); backupOpen = false"><Upload :size="16" /> Import</button>
          </div>
        </div>
        <input ref="fileInput"
type="file" accept=".json" hidden @change="handleImport"
/>
      </div>
    </div>
    <div class="subtitle">Idle Planet Miner — optimal crafting &amp; smelting</div>

    <div v-if="loadError" class="error-banner">{{ loadError }}</div>

    <div v-if="!loading"
class="content-row">
      <div class="stats-bar">
        <div class="stats-title">Multipliers</div>
      <span class="stats-item">
        Smelt: <strong>{{ debugStats.smeltRate }}</strong>
        <span class="info-icon"
:data-tip="debugStats.smeltInfo" @click.stop="toggleTip">i</span>
      </span>
      <span class="stats-item">
        Craft: <strong>{{ debugStats.craftRate }}</strong>
        <span class="info-icon"
:data-tip="debugStats.craftInfo" @click.stop="toggleTip">i</span>
      </span>
      <span class="stats-item">
        Smelt Cost: <strong>{{ debugStats.smeltCost }}</strong>
        <span class="info-icon" :data-tip="debugStats.smeltCostInfo" @click.stop="toggleTip"
        >i</span>
      </span>
      <span class="stats-item">
        Craft Cost: <strong>{{ debugStats.craftCost }}</strong>
        <span class="info-icon" :data-tip="debugStats.craftCostInfo" @click.stop="toggleTip"
        >i</span>
      </span>
      <span class="stats-item">
        Mine Rate: <strong>{{ debugStats.mineRate }}</strong>
        <span class="info-icon"
:data-tip="debugStats.mineInfo" @click.stop="toggleTip">i</span>
      </span>
      <span class="stats-item">
        Alloy Value: <strong>{{ debugStats.alloyVal }}</strong>
        <span class="info-icon"
:data-tip="debugStats.alloyInfo" @click.stop="toggleTip">i</span>
      </span>
      <span class="stats-item">
        Item Value: <strong>{{ debugStats.itemVal }}</strong>
        <span class="info-icon"
:data-tip="debugStats.itemInfo" @click.stop="toggleTip">i</span>
      </span>
      <span class="stats-item">
        Planet Cost: <strong>{{ debugStats.planetUpgradeCost }}</strong>
        <span class="info-icon" :data-tip="debugStats.planetCostInfo" @click.stop="toggleTip"
        >i</span>
      </span>
    </div>
      <MarketPanel />
    </div>

    <div class="header-row">
      <div class="tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="tab"
          :class="{ active: activeTab === t.key }"
          @click="switchTab(t.key)"
        >
          {{ t.label }} <span class="count">({{ t.count }})</span>
        </button>
      </div>
    </div>

    <div v-if="loading"
class="loading">
      <div class="spinner" />
      <div>Loading data...</div>
    </div>

    <template v-else>
      <div v-show="activeTab === 'ores'" class="tab-content">
        <OresTable @show-detail="detailId = $event" />
      </div>
      <div v-show="activeTab === 'alloys'" class="tab-content">
        <CraftableTable type="alloy"
@show-detail="detailId = $event" />
      </div>
      <div v-show="activeTab === 'items'" class="tab-content">
        <CraftableTable type="item"
@show-detail="detailId = $event" />
      </div>
      <div v-show="activeTab === 'mining'" class="tab-content">
        <MiningTable />
      </div>
    </template>

    <DetailPanel :detail-id="detailId"
@close="detailId = null" />

    <ProfilePanel v-if="showProfile"
@close="showProfile = false" />
    <GamePanel v-if="showGame"
@close="showGame = false" />

    <div v-if="modal.show" class="modal-overlay" @click="handleModalCancel">
      <div class="modal-box" @click.stop>
        <p>{{ modal.message }}</p>
        <div class="modal-actions">
          <button v-if="modal.onConfirm" class="modal-btn" @click="handleModalCancel">Cancel</button>
          <button class="modal-btn modal-confirm" @click="handleModalConfirm">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import MarketPanel from './components/MarketPanel.vue'
import DetailPanel from './components/DetailPanel.vue'
import ProfilePanel from './components/ProfilePanel.vue'
import GamePanel from './components/GamePanel.vue'
import OresTable from './components/OresTable.vue'
import CraftableTable from './components/CraftableTable.vue'
import MiningTable from './components/MiningTable.vue'
import { useOverrides } from './composables/useOverrides'
import { useSettings } from './composables/useSettings'
import { useProfile } from './composables/useProfile'
import { useGame } from './composables/useGame'
import { loadData } from './composables/useData'
import {
  getModifier,
  getMiningSpeedMult,
  getSmeltSpeedMult,
  getCraftSpeedMult,
  getProjectMultiplier,
  getStationMult,
  getStationValueMult,
  getManagerSecondaryMult,
} from './utils/calc'
import { toggleTip } from './utils/format'
import { User, Gamepad2, RotateCcw, Download, Upload } from '@lucide/vue'

const { resetTemporary } = useOverrides()
const { settings, managerVersion } = useSettings()
const { resetGame } = useGame()
const { exportProfile, importProfile } = useProfile()

const fileInput = ref(null)

const activeTab = ref('ores')
const detailId = ref(null)
const showProfile = ref(false)
const showGame = ref(false)
const showGameBadge = ref(false)
const backupOpen = ref(false)
const counts = reactive({ ores: 0, alloys: 0, items: 0, mining: 0 })
const loading = ref(true)
const loadError = ref('')

const modal = ref({ show: false, message: '', onConfirm: null })

function showAlert(message) {
  modal.value = { show: true, message, onConfirm: null }
}

function showConfirm(message) {
  return new Promise((resolve) => {
    modal.value = { show: true, message, onConfirm: resolve }
  })
}

function handleModalConfirm() {
  const cb = modal.value.onConfirm
  modal.value = { show: false, message: '', onConfirm: null }
  if (cb) cb(true)
}

function handleModalCancel() {
  const cb = modal.value.onConfirm
  modal.value = { show: false, message: '', onConfirm: null }
  if (cb) cb(false)
}

const tabs = computed(() => [
  { key: 'ores', label: 'Ores', count: counts.ores },
  { key: 'alloys', label: 'Alloys', count: counts.alloys },
  { key: 'items', label: 'Items', count: counts.items },
  { key: 'mining', label: 'Mining', count: counts.mining },
])

// ===== DATA LOADING =====
loadData()
  .then((c) => {
    counts.ores = c.oresCount
    counts.alloys = c.alloysCount
    counts.items = c.itemsCount
    counts.mining = c.miningCount
    loading.value = false
  })
  .catch((e) => {
    console.error('Failed to load data:', e)
    loadError.value = 'Failed to load game data. Check browser console for details.'
    loading.value = false
  })

// ===== DEBUG STATS =====
function infoLines(title, rows, total) {
  const active = rows.filter((r) => r[1] != null)
  const lines = [title]
  for (const [label, val] of active) {
    lines.push('  ' + label + ': ' + val.toFixed(2) + '×')
  }
  if (active.length >= 1) lines.push('  ─────────────────')
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
  const astronomy = getModifier('rooms', 'astronomy', settings)

  const furnaceProj = getProjectMultiplier(settings, ['advancedFurnace', 'superiorFurnace'])
  const crafterProj = getProjectMultiplier(settings, ['advancedCrafter', 'superiorCrafter'])
  const miningProj = getProjectMultiplier(settings, ['advancedMining', 'superiorMining'])
  const alloyProj = getProjectMultiplier(settings, ['advancedAlloyValue', 'superiorAlloyValue'])
  const itemProj = getProjectMultiplier(settings, ['advancedItemValue', 'superiorItemValue'])

  const stnSmelt = getStationMult(settings, [
    'smelting1',
    'smelting2',
    'smelting3',
    'smelting4',
    'smelting5',
  ])
  const stnCraft = getStationMult(settings, [
    'crafting1',
    'crafting2',
    'crafting3',
    'crafting4',
    'crafting5',
  ])
  const stnMine = getStationMult(settings, ['mining1', 'mining2'])
  const stnValue = getStationValueMult(settings)

  const global12 = settings.station?.miningGlobal ? 1.2 : null

  const mgrSmelt = getManagerSecondaryMult(settings, 'allSmeltSpeed')
  const mgrCraft = getManagerSecondaryMult(settings, 'allCraftSpeed')

  const smeltRate = getSmeltSpeedMult(settings)
  const craftRate = getCraftSpeedMult(settings)
  const mineRate = getMiningSpeedMult(settings)

  const salesMod = sales || 1
  const stnVal = stnValue || 1
  const alloyV = (salesMod * stnVal * (alloyProj || 1)).toFixed(2) + '×'
  const itemV = (salesMod * stnVal * (itemProj || 1)).toFixed(2) + '×'

  const fmt = (v) => (v ? v.toFixed(2) + '×' : '1.00×')

  const smeltInfo = infoLines(
    'Smelt Rate',
    [
      ['Forge room', forge],
      ['Furnace projects', furnaceProj],
      ['Smelting stations', stnSmelt],
      ['Manager (allSmeltSpeed)', mgrSmelt],
    ],
    smeltRate
  )

  const craftInfo = infoLines(
    'Craft Rate',
    [
      ['Workshop room', workshop],
      ['Crafter projects', crafterProj],
      ['Crafting stations', stnCraft],
      ['Manager (allCraftSpeed)', mgrCraft],
    ],
    craftRate
  )

  const smeltCostInfo = infoLines('Smelt Cost', [['Underforge room', underforge]], underforge)

  const craftCostInfo = infoLines('Craft Cost', [['Dorm room', dorm]], dorm)

  const mineInfo = infoLines(
    'Mine Rate',
    [
      ['Engineering room', engineering],
      ['Mining projects', miningProj],
      ['Mining stations', stnMine],
      ['Global 1.2×', global12],
    ],
    mineRate
  )

  const alloyInfo = infoLines(
    'Alloy Value',
    [
      ['Sales room', sales],
      ['Station value', stnValue],
      ['Alloy value projects', alloyProj],
    ],
    salesMod * stnVal * (alloyProj || 1)
  )

  const itemInfo = infoLines(
    'Item Value',
    [
      ['Sales room', sales],
      ['Station value', stnValue],
      ['Item value projects', itemProj],
    ],
    salesMod * stnVal * (itemProj || 1)
  )

  const planetCostInfo = infoLines(
    'Planet Upgrade Cost',
    [['Astronomy room', astronomy]],
    astronomy
  )

  return {
    mineRate: fmt(mineRate),
    smeltRate: fmt(smeltRate),
    craftRate: fmt(craftRate),
    smeltCost: fmt(underforge),
    craftCost: fmt(dorm),
    alloyVal: alloyV,
    itemVal: itemV,
    planetUpgradeCost: fmt(astronomy),
    smeltInfo,
    craftInfo,
    smeltCostInfo,
    craftCostInfo,
    mineInfo,
    alloyInfo,
    itemInfo,
    planetCostInfo,
  }
})

function switchTab(tab) {
  activeTab.value = tab
}

async function resetAll() {
  const ok = await showConfirm(
    'Reset playthrough? Projects, market & mining overrides will be cleared. Managers, pinned items, and profile stay unchanged.'
  )
  if (!ok) return
  resetGame()
  resetTemporary()
  showGameBadge.value = true
  detailId.value = null
}

function triggerImport() {
  fileInput.value?.click()
}

function handleImport(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      importProfile(reader.result)
    } catch (e) {
      showAlert('Import failed: ' + e.message)
    }
  }
  reader.onerror = () => showAlert('Failed to read file')
  reader.readAsText(file)
  event.target.value = ''
}

document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.backup-wrap')
  if (wrap && !wrap.contains(e.target)) {
    backupOpen.value = false
  }
  document.querySelectorAll('.info-icon.visible').forEach((icon) => {
    icon.classList.remove('visible')
  })
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0e17;
  color: #c8d0dc;
  min-height: 100vh;
  padding: 20px;
}
.container {
  max-width: 1400px;
  margin: 0 auto;
}
h1 {
  font-size: 28px;
  font-weight: 700;
  color: #4fc3f7;
  letter-spacing: 0.5px;
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.subtitle {
  color: #6b7a8f;
  font-size: 14px;
  margin-bottom: 24px;
}
.tabs {
  display: inline-flex;
  gap: 4px;
  margin-bottom: 20px;
  background: #121824;
  border-radius: 10px;
  padding: 4px;
}
.tab {
  padding: 10px 28px;
  border: none;
  background: transparent;
  color: #6b7a8f;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}
.tab:hover {
  color: #c8d0dc;
  background: #1a2235;
}
.tab.active {
  color: #fff;
  background: #1e88e5;
}
.tab .count {
  color: #6b7a8f;
  font-size: 12px;
  margin-left: 6px;
  font-weight: 400;
}
.tab.active .count {
  color: rgba(255, 255, 255, 0.6);
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.content-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: flex-start;
}
.stats-bar {
  flex: 7;
  min-width: 0;
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  background: #0d1520;
  border-radius: 6px;
  border: 1px solid #1a2235;
  font-size: 12px;
  color: #6b7a8f;
  flex-wrap: wrap;
  align-content: flex-start;
}
.stats-title {
  width: 100%;
  font-size: 11px;
  font-weight: 700;
  color: #6b7a8f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stats-item strong {
  color: #4fc3f7;
  font-weight: 600;
}
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
  cursor: pointer;
  margin-left: 4px;
  font-family: 'Times New Roman', serif;
  line-height: 1;
  vertical-align: middle;
  flex-shrink: 0;
}
.info-icon::after {
  content: attr(data-tip);
  position: absolute;
  top: calc(100% + 8px);
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
.info-icon.visible::after {
  opacity: 1;
}
.table-wrap {
  background: #121824;
  border-radius: 10px;
  border: 1px solid #1e2a3a;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 900px;
}
thead th {
  background: #0d1520;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #6b7a8f;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  border-bottom: 1px solid #1e2a3a;
  user-select: none;
}
tbody tr {
  border-bottom: 1px solid #1a2235;
  transition: background 0.15s;
  cursor: pointer;
}
tbody tr:hover {
  background: #1a2235;
}
tbody tr.expanded {
  background: #162030;
}
td {
  padding: 10px 12px;
  white-space: nowrap;
  vertical-align: middle;
}
td.name-cell {
  font-weight: 600;
  color: #e8edf5;
}
td .ingredient-list {
  color: #6b7a8f;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-line;
}
.positive {
  color: #4caf50;
}
.negative {
  color: #ef5350;
}
.price {
  color: #e8edf5;
}
.price-small {
  color: #6b7a8f;
  font-size: 11px;
}
.star-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 0;
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
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #6b7a8f;
}
.loading .spinner {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid #1e2a3a;
  border-top-color: #4fc3f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.empty {
  text-align: center;
  padding: 40px;
  color: #6b7a8f;
}

/* Detail panel */
.detail-panel {
  background: #0d1520;
  border: 1px solid #1e2a3a;
  border-radius: 10px;
  margin-top: 16px;
  padding: 20px;
  display: none;
}
.detail-panel.open {
  display: block;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #e8edf5;
}
.detail-close {
  background: none;
  border: none;
  color: #6b7a8f;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.detail-close:hover {
  color: #fff;
  background: #1a2235;
}
.detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.stat-box {
  background: #121824;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid #1e2a3a;
}
.stat-label {
  font-size: 11px;
  color: #6b7a8f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #e8edf5;
}
.tree {
  margin-top: 12px;
}
.tree-node {
  padding-left: 20px;
  border-left: 1px solid #2a3a4a;
  margin: 4px 0;
  padding: 4px 0 4px 16px;
}
.tree-node.root {
  border-left: none;
  padding-left: 0;
}
.tree-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}
.tree-item:hover {
  background: #1a2235;
}
.tree-qty {
  color: #6b7a8f;
  font-size: 12px;
  min-width: 48px;
}
.tree-name {
  color: #e8edf5;
  font-weight: 500;
}
.tree-price {
  color: #6b7a8f;
  font-size: 12px;
  margin-left: auto;
}
.tree-time {
  color: #6b7a8f;
  font-size: 12px;
  margin-left: 12px;
}
.tree-arrow {
  color: #4fc3f7;
  font-size: 10px;
  margin-right: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-btn {
  padding: 8px 10px;
  background: transparent;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  color: #6b7a8f;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
}
.icon-btn:hover {
  border-color: #ffd54f;
  color: #ffd54f;
}
.profile-btn,
.game-btn,
.reset-btn {
  padding: 8px 10px;
  background: transparent;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  color: #4fc3f7;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  display: flex;
  align-items: center;
}
.profile-btn:hover,
.game-btn:hover,
.reset-btn:hover {
  border-color: #4fc3f7;
}
.profile-btn:hover,
.game-btn:hover,
.reset-btn:hover {
  border-color: #4fc3f7;
}

.btn-badge-wrap {
  position: relative;
  display: flex;
}
.badge-dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ef5350;
  border: 2px solid #0a0e17;
}
.backup-wrap {
  position: relative;
}
.backup-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  color: #4fc3f7;
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
  line-height: 1;
  display: flex;
  align-items: center;
  min-height: 36px;
}
.backup-btn:hover {
  border-color: #4fc3f7;
  color: #4fc3f7;
}
.backup-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #121824;
  border: 1px solid #2a3a4a;
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  min-width: 150px;
}
.backup-dropdown button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #c8d0dc;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
}
.backup-dropdown button:hover {
  background: #1a2235;
  color: #fff;
}

.mining-level-select {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mining-level-input {
  width: 48px;
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #e8edf5;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 3px 4px;
  outline: none;
}
.mining-level-input:focus {
  border-color: #4fc3f7;
}
.mining-level-input::-webkit-inner-spin-button {
  opacity: 0.5;
}

.probe-check {
  cursor: pointer;
  accent-color: #4fc3f7;
}
.probe-input {
  width: 64px;
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #e8edf5;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 3px 4px;
  outline: none;
}
.probe-input:focus {
  border-color: #4fc3f7;
}
.probe-input::-webkit-inner-spin-button {
  opacity: 0.5;
}


.settings-categories {
  display: flex;
  gap: 4px;
  padding: 12px 12px 0;
  flex-wrap: wrap;
}
.settings-cat {
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
.settings-cat:hover {
  color: #c8d0dc;
  background: #1a2235;
}
.settings-cat.active {
  color: #fff;
  background: #1e88e5;
}
.settings-content {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
.station-group {
  background: #0d1520;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid #1a2235;
}
.station-group .project-group-title {
  padding: 0 4px;
}
.settings-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px;
  color: #6b7a8f;
}
.settings-row {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  align-items: center;
  gap: 12px;
  background: #0d1520;
  border-radius: 6px;
  padding: 8px 12px;
  border: 1px solid #1a2235;
}
.settings-info {
  min-width: 0;
  text-align: left;
}
.settings-label {
  grid-column: 1 / -1;
  color: #c8d0dc;
  font-size: 13px;
  font-weight: 500;
}
.settings-desc {
  display: block;
  color: #6b7a8f;
  font-size: 11px;
  margin-top: 2px;
}
.settings-effect {
  color: #4fc3f7;
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
  text-align: right;
}
.manager-select {
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  color: #c8d0dc;
  font-size: 12px;
  padding: 6px 8px;
  cursor: pointer;
  min-width: 140px;
}
.manager-select:hover {
  border-color: #4fc3f7;
}
.manager-select option {
  background: #0d1520;
  color: #c8d0dc;
}
.mgr-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0d1520;
  border-radius: 6px;
  padding: 8px 12px;
  border: 1px solid #1a2235;
  grid-column: 1 / -1;
}
.mgr-select {
  flex: 1;
  background: #121824;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #c8d0dc;
  font-size: 13px;
  padding: 6px 8px;
  cursor: pointer;
}
.mgr-value {
  width: 80px;
  background: #121824;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #c8d0dc;
  font-size: 13px;
  padding: 6px 8px;
  text-align: center;
}
.mgr-remove {
  width: 28px;
  height: 28px;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  background: transparent;
  color: #ef5350;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mgr-remove:hover {
  border-color: #ef5350;
  background: rgba(239, 83, 80, 0.1);
}
.mgr-add {
  grid-column: 1 / -1;
  padding: 8px;
  border: 1px dashed #2a3a4a;
  border-radius: 6px;
  background: transparent;
  color: #4fc3f7;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
}
.mgr-add:hover {
  border-color: #4fc3f7;
  background: rgba(79, 195, 247, 0.05);
}
.toggle-btn {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: 1px solid #2a3a4a;
  background: #0d1520;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
}
.toggle-btn.active {
  background: #1e88e5;
  border-color: #1e88e5;
}
.toggle-knob {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #6b7a8f;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.2s;
}
.toggle-btn.active .toggle-knob {
  background: #fff;
  left: 20px;
}
.project-group {
  margin-bottom: 12px;
}
.project-group:last-child {
  margin-bottom: 0;
}
.project-group-title {
  font-size: 11px;
  font-weight: 700;
  color: #6b7a8f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  padding: 0 4px;
}
.project-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}
.project-check-row:hover {
  background: #0d1520;
}
.project-check {
  accent-color: #1e88e5;
  cursor: pointer;
}
.project-check-row .settings-effect {
  margin-left: auto;
}

.error-banner {
  background: #2d1111;
  border: 1px solid #ef5350;
  color: #ef9a9a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #121824;
  border: 1px solid #2a3a4a;
  border-radius: 12px;
  padding: 24px;
  max-width: 440px;
  width: 90%;
  color: #c8d0dc;
  font-size: 14px;
  line-height: 1.5;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
.modal-btn {
  padding: 8px 20px;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  background: transparent;
  color: #c8d0dc;
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
}
.modal-btn:hover {
  border-color: #4fc3f7;
  color: #4fc3f7;
}
.modal-confirm {
  background: #1e88e5;
  border-color: #1e88e5;
  color: #fff;
}
.modal-confirm:hover {
  background: #1976d2;
  border-color: #1976d2;
  color: #fff;
}

@media (max-width: 900px) {
  .settings-content {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}
@media (max-width: 768px) {
  body {
    padding: 12px;
  }
  h1 {
    font-size: 22px;
  }
  .content-row {
    flex-direction: column;
  }
  .tabs {
    width: 100%;
  }
  .tab {
    flex: 1;
    text-align: center;
    padding: 10px 12px;
    font-size: 13px;
  }
  td,
  th {
    padding: 8px 8px;
    font-size: 12px;
  }
  .stars-input {
    width: 48px;
  }
  table {
    min-width: 700px;
  }
  .settings-content {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .settings-categories {
    flex-direction: column;
  }
  .settings-cat {
    text-align: center;
  }
}
</style>
