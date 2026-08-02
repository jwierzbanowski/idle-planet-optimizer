<template>
  <div>
    <div class="session-panel">
      <div class="session-header" @click="sessionPanelOpen = !sessionPanelOpen">
        <div class="session-controls" @click.stop>
          <label class="session-label">
            ⏱ Session:
            <select v-model.number="sessionDuration" class="session-select">
              <option value="0.5">30m</option>
              <option value="1">1h</option>
              <option value="2">2h</option>
              <option value="3">3h</option>
              <option value="4">4h</option>
              <option value="8">8h</option>
              <option value="12">12h</option>
              <option value="24">24h</option>
              <option value="48">48h</option>
              <option value="-1">Custom</option>
            </select>
          </label>
          <span class="session-label" v-if="sessionDuration === -1">
            Custom:
            <TimePicker v-model="customSessionHours" class="session-time-picker" />
          </span>
          <label class="session-label" v-if="effectiveSessionHours > 0">
            Elapsed:
            <input
              type="range"
              :min="0"
              :max="effectiveSessionHours"
              :step="elapsedStep / 60"
              v-model.number="elapsedTime"
              class="session-slider"
            />
            <span class="session-val">{{ fmtTimeHm(elapsedTime) }}</span>
          </label>
          <span class="session-step" v-if="effectiveSessionHours > 0">
            <button class="step-btn" :class="{ active: elapsedStep === 5 }" @click="elapsedStep = 5">5m</button>
            <button class="step-btn" :class="{ active: elapsedStep === 15 }" @click="elapsedStep = 15">15m</button>
            <button class="step-btn" :class="{ active: elapsedStep === 30 }" @click="elapsedStep = 30">30m</button>
          </span>
          <span class="session-remaining" v-if="effectiveSessionHours > 0">
            Remaining: <strong>{{ fmtTimeHm(remainingTime) }}</strong>
          </span>
        </div>
        <span class="panel-toggle">
          <span class="toggle-label">Roadmap</span>
          <ChevronDown v-if="sessionPanelOpen" :size="16" />
          <ChevronRight v-else :size="16" />
        </span>
      </div>
      <div class="panel-body" :class="{ open: sessionPanelOpen }">
        <div class="best-upgrade-bar" v-if="bestUpgradeSteps.length">
          <div class="best-label">Roadmap ({{ bestUpgradeSteps.length }} steps):</div>
          <label class="include-new-cb">
            <input type="checkbox" v-model="includeNewPlanets" />
            Include planet purchases
          </label>
          <span class="step-size-group">
            <button class="step-size-btn" :class="{ active: roadmapStepSize === 1 }" @click="roadmapStepSize = 1">1 lvl</button>
            <button class="step-size-btn" :class="{ active: roadmapStepSize === 5 }" @click="roadmapStepSize = 5">5 lvls</button>
            <button class="step-size-btn" :class="{ active: roadmapStepSize === 10 }" @click="roadmapStepSize = 10">10 lvls</button>
          </span>
          <div class="roadmap-table-wrap">
            <table class="roadmap-table">
              <thead>
                <tr>
                  <th
                    class="sortable"
                    :class="{ 'sort-active': roadmapSortKey === 'rank' }"
                    @click="setRoadmapSort('rank')"
                  ># {{ roadmapSortKey === 'rank' ? (roadmapSortDir === 'asc' ? '▲' : '▼') : '⇅' }}</th>
                  <th
                    class="sortable"
                    :class="{ 'sort-active': roadmapSortKey === 'number' }"
                    @click="setRoadmapSort('number')"
                  >Planet {{ roadmapSortKey === 'number' ? (roadmapSortDir === 'asc' ? '▲' : '▼') : '⇅' }}</th>
                  <th>Levels</th>
                  <th
                    class="sortable"
                    :class="{ 'sort-active': roadmapSortKey === 'cost' }"
                    @click="setRoadmapSort('cost')"
                  >Cost {{ roadmapSortKey === 'cost' ? (roadmapSortDir === 'asc' ? '▲' : '▼') : '⇅' }}</th>
                  <th
                    class="sortable"
                    :class="{ 'sort-active': roadmapSortKey === 'profit' }"
                    @click="setRoadmapSort('profit')"
                  >Profit {{ roadmapSortKey === 'profit' ? (roadmapSortDir === 'asc' ? '▲' : '▼') : '⇅' }}</th>
                  <th>Upgrade</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="s in sortedRoadmapSteps"
                  :key="s.rank"
                  :class="{
                    'step-repeat-green': stepCounts[s.id] > 3,
                    'step-repeat-yellow': stepCounts[s.id] > 2 && stepCounts[s.id] <= 3,
                    'step-repeat-orange': stepCounts[s.id] > 1 && stepCounts[s.id] <= 2
                  }"
                >
                  <td class="roadmap-rank">{{ s.rank }}</td>
                  <td>
                    <template v-if="s.isBuying">Buy </template>{{ s.number }}. {{ s.name }}
                    <span v-if="stepCounts[s.id] > 1" class="step-repeat-badge">{{ stepCounts[s.id] }}×</span>
                  </td>
                  <td>lvl {{ s.fromLvl }}→{{ s.toLvl }}</td>
                  <td>{{ fmtPrice(Math.round(s.upgradeCost)) }}</td>
                  <td class="positive">+{{ fmtPrice(s.incProfit) }}/s</td>
                  <td>
                    <button class="apply-step-btn" @click="setOverride(s.id, 'miningLevel', s.toLvl)" title="Apply this upgrade">+{{ s.toLvl - s.fromLvl }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="filter-tabs">
      <div class="filter-tabs-left">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          class="filter-tab"
          :class="{ active: activeGroup === tab.key }"
          @click="activeGroup = tab.key"
        >
          {{ tab.label }} <span class="count">({{ tab.count }})</span>
        </button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Planet</th>
            <th>Base Price</th>
            <th>Resources</th>
            <th>Mining Lv</th>
            <th>Colonies</th>
            <th>Probe</th>
            <th>Rate</th>
            <th>Profit / s</th>
            <th>Upgrade Payback</th>
            <th>Max Lv</th>
            <th>Manager</th>
            <th>Alchemy</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in visibleRows"
            :key="row.id"
          >
            <td class="name-cell">{{ row.number }}. {{ row.name }}</td>
            <td class="price">
              {{ fmtPrice(row.basePrice) }}
            </td>
            <td>
              <template v-if="row.oreTargetMult && row.resList">
                <div
                  v-for="r in row.resList"
                  :key="r.ore"
                  class="ore-target-row"
                  :class="{ 'ore-targeted': r.isTargeted }"
                  @click="setOreTarget(row.id, r.ore, r.isTargeted)"
                >
                  <span class="ore-target-name">{{ r.name }}</span>
                  <span class="ore-target-yield">{{ r.displayYield }}%</span>
                  <span v-if="r.alchemyNext" class="ore-target-alchemy">↓ {{ r.alchemyNext }}</span>
                  <span v-if="r.isTargeted" class="ore-target-badge">TARGET</span>
                </div>
              </template>
              <span v-else
class="ingredient-list">{{ row.resStr }}</span>
            </td>
            <td>
              <div class="mining-level-select">
                <button
                  class="star-btn ml-btn"
                  :disabled="row.lvl <= 0"
                  @click="adjustMiningLvl(row.id, 1, -1, $event)"
                >{{ multiplier === 1 ? '−' : '−' + multiplier }}</button>
                <input
                  type="number"
                  class="mining-level-input"
                  :value="row.lvl"
                  min="0"
                  max="100"
                  @change="
                    setOverride(
                      row.id,
                      'miningLevel',
                      Math.max(0, Math.min(100, parseInt($event.target.value) || 0))
                    )
                  "
                  @focus="$event.target.select()"
                />
                <button
                  class="star-btn ml-btn"
                  :disabled="row.lvl >= 100"
                  @click="adjustMiningLvl(row.id, 1, 1, $event)"
                >{{ multiplier === 1 ? '+' : '+' + multiplier }}</button>
              </div>
            </td>
            <td>
              <div class="mining-level-select">
                <button
                  class="star-btn ml-btn"
                  :disabled="row.colonies <= 0"
                  @click="adjustColonies(row.id, 1, -1, $event)"
                >{{ multiplier === 1 ? '−' : '−' + multiplier }}</button>
                <input
                  type="number"
                  class="mining-level-input"
                  :value="row.colonies"
                  min="0"
                  max="100"
                  @change="
                    setOverride(
                      row.id,
                      'colonies',
                      Math.max(0, Math.min(100, parseInt($event.target.value) || 0))
                    )
                  "
                  @focus="$event.target.select()"
                />
                <button
                  class="star-btn ml-btn"
                  :disabled="row.colonies >= 100"
                  @click="adjustColonies(row.id, 1, 1, $event)"
                >{{ multiplier === 1 ? '+' : '+' + multiplier }}</button>
              </div>
            </td>
            <td class="price">
              <input
                type="checkbox"
                class="probe-check"
                :checked="row.probe"
                @change="setProbe(row.id, $event.target.checked)"
              />
              <template v-if="row.probe">
                &nbsp;×<input
                  type="number"
                  class="probe-input"
                  :value="row.probeMult"
                  min="0"
                  step="0.01"
                  @change="
                    setOverride(
                      row.id,
                      'probeSpeed',
                      Math.max(0, parseFloat($event.target.value) || 1)
                    )
                  "
                />
              </template>
            </td>
            <td class="price">
              {{ (row.displayRate || row.rate).toFixed(3) }}/s
              <span class="info-icon"
:data-tip="row.rateTooltip" @click.stop="toggleTip">i</span>
            </td>
            <template v-if="row.hasProfit">
              <td :class="profitClass(row.profitPerSec)"
style="font-weight: 600">
                {{ fmtPrice(row.profitPerSec) }}/s
              </td>
              <td v-if="isFinite(row.paybackHours)"
 class="price-small" :class="row.paybackClass">
                <div>Next: {{ fmtDuration(row.paybackHours) }}</div>
                <div v-if="isFinite(row.totalPaybackHours)"
 class="total-payback">
                  Total: {{ fmtDuration(row.totalPaybackHours) }}
                </div>
                <span
                  class="info-icon"
                  :data-tip="buildPaybackTooltip(row)"
                  @click.stop="toggleTip"
                  >i</span
                >
              </td>
              <td
 v-else class="price-small" :class="row.paybackClass">—</td>
              <td class="price-small">
                <span
                  v-if="row.maxProfitableLevel > 0"
                  class="max-lv-click"
                  @click="setOverride(row.id, 'miningLevel', row.maxProfitableLevel)"
                >{{ row.maxProfitableLevel }}</span>
                <span v-else>—</span>
              </td>
              <td class="manager-cell">
                <select
                  :value="row.managerIdx"
                  @change="
                    setManager(
                      row.id,
                      $event.target.value === '-1' ? -1 : parseInt($event.target.value)
                    )
                  "
                >
                  <option :value="-1">—</option>
                  <option
                    v-for="m in miningManagers"
                    :key="m._origIdx"
                    :value="m._origIdx"
                  >
                    {{ mgrLabel(m) }}
                  </option>
                </select>
              </td>
              <td class="alchemy-cell">
                <label class="alchemy-cb">
                  <input type="checkbox" :checked="row.alchemyLevel === 1 && row.alchemyOre" @change="toggleAlchemy(row.id, 1, $event.target.checked)" />+1
                </label>
                <label class="alchemy-cb">
                  <input type="checkbox" :checked="row.alchemyLevel === 2 && row.alchemyOre" @change="toggleAlchemy(row.id, 2, $event.target.checked)" />+2
                </label>
                <label class="alchemy-cb">
                  <input type="checkbox" :checked="row.alchemyLevel === 3 && row.alchemyOre" @change="toggleAlchemy(row.id, 3, $event.target.checked)" />+3
                </label>
                <div v-if="row.alchemyLevel > 0 && !row.alchemyOre" class="alchemy-opts">
                  <div v-for="r in row.alchemyResources" :key="r.ore"
                       class="alchemy-opt"
                       :class="{ 'alchemy-sel': row.alchemyOre === r.ore }"
                       @click="selectAlchemyOre(row.id, r.ore, row.alchemyLevel)">
                    {{ r.oreName }} ↓ {{ r.nextName }}
                  </div>
                </div>
              </td>
            </template>
            <template v-else>
              <td class="price-small">—</td>
              <td class="price-small">—</td>
              <td class="price-small">—</td>
              <td class="price-small">—</td>
              <td class="price-small">—</td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ChevronDown, ChevronRight } from '@lucide/vue'
import { useData } from '../composables/useData'
import { useModifierKeys } from '../composables/useModifierKeys'
import { useOverrides } from '../composables/useOverrides'
import { useSettings } from '../composables/useSettings'
import { useMode } from '../composables/useMode'
import TimePicker from './TimePicker.vue'
import {
  effectivePrice,
  getMiningSpeedMult,
  getBeaconMult,
  getProjectMultiplier,
  getStationMult,
  getModifier,
  getOreTargetingMult,
  getTotalManagerBuff,
} from '../utils/calc'
import { fmtPrice, fmtDuration, toggleTip } from '../utils/format'
import { PRIMARY_EFFECTS } from '../utils/config'

const { DB, ORDER } = useData()
const { overrides, getMiningLevel, getMiningColonies, getProbe, getProbeSpeed, getManager, setManager, setOverride } =
  useOverrides()
const { settings } = useSettings()
const { multiplier } = useModifierKeys()
const { panelMode } = useMode()

const PLANET_GROUPS = [
  { label: '100M', min: 1, max: 13 },
  { label: '10B', min: 14, max: 22 },
  { label: '10T', min: 23, max: 34 },
  { label: '10q', min: 35, max: 49 },
]

const BASIC_PRICE_GROUPS = [
  { label: '10M-100M', min: 10_000_000, max: 100_000_000 },
  { label: '100M-1B', min: 100_000_000, max: 1_000_000_000 },
  { label: '1B-10B', min: 1_000_000_000, max: 10_000_000_000 },
  { label: '10B-100B', min: 10_000_000_000, max: 100_000_000_000 },
  { label: '100B-1T', min: 100_000_000_000, max: 1_000_000_000_000 },
]

const activeGroup = ref('all')
const includeNewPlanets = ref(false)
const roadmapStepSize = ref(1)

function setProbe(id, val) {
  setOverride(id, 'probe', val)
  if (!val) setOverride(id, 'probeSpeed', 0)
}

function setOreTarget(planetId, oreId, isCurrentlyTargeted) {
  setOverride(planetId, 'oreTarget', isCurrentlyTargeted ? null : oreId)
}

function adjustMiningLvl(id, baseStep, direction, e) {
  let m = 1
  if (e.ctrlKey) m = 5
  if (e.shiftKey) m = 10
  if (e.ctrlKey && e.shiftKey) m = 50
  const step = baseStep * m
  let current = getMiningLevel(id)
  if (direction > 0 && current === 0 && m > 1) current = 1
  setOverride(id, 'miningLevel', Math.max(0, Math.min(100, current + direction * step)))
}

function adjustColonies(id, baseStep, direction, e) {
  let m = 1
  if (e.ctrlKey) m = 5
  if (e.shiftKey) m = 10
  if (e.ctrlKey && e.shiftKey) m = 50
  const step = baseStep * m
  const current = getMiningColonies(id)
  setOverride(id, 'colonies', Math.max(0, Math.min(100, current + direction * step)))
}

function fmtTimeHm(hours) {
  const mins = Math.round(hours * 60)
  if (mins < 60) return mins + 'm'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? h + 'h ' + m + 'm' : h + 'h'
}

function toggleAlchemy(id, level, checked) {
  if (!checked) {
    setOverride(id, 'alchemyLevel', 0)
    setOverride(id, 'alchemyOre', null)
  } else {
    const cur = overrides[id]?.alchemyLevel || 0
    setOverride(id, 'alchemyLevel', level)
    if (cur !== level) setOverride(id, 'alchemyOre', null)
  }
}

function selectAlchemyOre(id, ore, level) {
  for (const pid of ORDER.value.planets) {
    if (pid !== id && (overrides[pid]?.alchemyLevel || 0) === level) {
      setOverride(pid, 'alchemyLevel', 0)
      setOverride(pid, 'alchemyOre', null)
    }
  }
  setOverride(id, 'alchemyOre', ore)
}

const engineering = computed(() => getModifier('rooms', 'engineering', settings))
const miningProj = computed(() =>
  getProjectMultiplier(settings, ['advancedMining', 'superiorMining'])
)
const stnMine = computed(() => getStationMult(settings, ['mining1', 'mining2']))
const global12 = computed(() => (settings.station?.miningGlobal ? 1.2 : null))
const miningMult = computed(() => getMiningSpeedMult(settings) || 1)
const astronomyMod = computed(() => getModifier('rooms', 'astronomy', settings))
const managerRoomMult = computed(() => getTotalManagerBuff(settings))

const sessionPanelOpen = ref(true)
const sessionDuration = ref(2)
const elapsedTime = ref(0)
const elapsedStep = ref(15)
const customSessionHours = ref(2)
const effectiveSessionHours = computed(() =>
  sessionDuration.value === -1 ? Math.max(0, customSessionHours.value) : sessionDuration.value
)
const remainingTime = computed(() =>
  Math.max(0, effectiveSessionHours.value - elapsedTime.value)
)

const nextOreMap = computed(() => {
  const map = {}
  const ores = ORDER.value.ores
  for (let i = 0; i < ores.length - 1; i++) {
    map[ores[i]] = ores[i + 1]
  }
  return map
})

const miningManagers = computed(() =>
  (settings.managers || [])
    .map((m, origIdx) => ({ ...m, _origIdx: origIdx }))
    .filter((m) => m.primarySkill === 'mineRate')
)

function mgrLabel(m) {
  const stars = '★'.repeat(Math.min(m.stars, 5)) + (m.stars > 5 ? '+' + (m.stars - 5) : '')
  const base = PRIMARY_EFFECTS.mineRate[Math.min(m.stars - 1, 6)]
  const mult = 1 + (base - 1) * (managerRoomMult.value || 1)
  return stars + ' ' + mult.toFixed(2) + '×'
}

function buildRateTooltip(row) {
  const lines = ['Mine Rate']
  if (row.lvl <= 0) {
    lines.push('  No mining — planet not upgraded')
  } else {
    lines.push('  baseRate (lvl' + row.lvl + '): ' + row.baseRate.toFixed(3) + '/s')
  if (engineering.value) lines.push('  Engineering room: ' + engineering.value.toFixed(2) + '×')
  if (miningProj.value) lines.push('  Mining projects: ' + miningProj.value.toFixed(2) + '×')
  if (stnMine.value) lines.push('  Mining stations: ' + stnMine.value.toFixed(2) + '×')
  if (global12.value) lines.push('  Global 1.2×: 1.20×')
  const beaconMult = getBeaconMult(row.number, settings)
  lines.push('  Beacon: ' + beaconMult.toFixed(2) + '×')
  lines.push(
    '  Colonies (×' +
      row.colonies +
      '): 1 + 0.3×' +
      row.colonies +
      ' = ' +
      (1 + 0.3 * row.colonies).toFixed(2) +
      '×'
  )
  if (row.probe) lines.push('  Probe: ' + row.probeMult.toFixed(2) + '×')
  const oreTargetMult = getOreTargetingMult(settings)
  if (oreTargetMult) lines.push('  Ore Targeting: ' + oreTargetMult.toFixed(2) + '×')
  if (
    engineering.value ||
    miningProj.value ||
    stnMine.value ||
    global12.value ||
    row.probe ||
    oreTargetMult
  ) {
    lines.push('  ─────────────────')
  }
    lines.push('  Result: ' + (row.displayRate || row.rate).toFixed(3) + '/s')
  }
  return lines.join('\n')
}

function buildPaybackTooltip(row) {
  const lines = []
  for (const s of ['+1', '+5', '+10']) {
    const proj = row.paybackProjection[s]
    if (proj) {
      lines.push(
        s + ' levels: ' + fmtDuration(proj.hours) +
        ' (cost: ' + fmtPrice(Math.round(proj.cost)) +
        ', +' + fmtPrice(proj.incProfit) + '/s)'
      )
    } else {
      const stepsNum = parseInt(s)
      if (row.lvl + stepsNum > 100) {
        lines.push(s + ' levels: — (max level)')
      } else {
        lines.push(s + ' levels: ∞ (no profit increase)')
      }
    }
  }
  lines.push('Total invested: ' + fmtPrice(Math.round(row.totalInvestment)))
  return lines.join('\n')
}

const sortedRows = computed(() => {
  return ORDER.value.planets
    .map((id) => {
      const p = DB.value.planets[id]
      const lvl = getMiningLevel(id)
      const colonies = getMiningColonies(id)
      const probe = getProbe(id)
      const probeMult = probe ? getProbeSpeed(id) || 1 : 1
      const miningLevel = DB.value.mining['lvl' + lvl] || DB.value.mining['lvl1']
      const beaconMult = getBeaconMult(p.number, settings)
      const coloniesMult = 1 + 0.3 * colonies
      const managerIdx = getManager(id)
      let managerLabel = ''
      let mgrMult = 1
      if (managerIdx >= 0 && managerIdx < settings.managers.length) {
        const m = settings.managers[managerIdx]
        if (m.primarySkill === 'mineRate') {
          managerLabel = mgrLabel(m)
          mgrMult = 1 + (PRIMARY_EFFECTS.mineRate[Math.min(m.stars - 1, 6)] - 1) * (managerRoomMult.value || 1)
        }
      }

      const alchemyLevel = overrides[id]?.alchemyLevel || 0
      const alchemyOre = overrides[id]?.alchemyOre || null

      function getNextOre(oreId, steps) {
        let cur = oreId
        for (let i = 0; i < steps; i++) {
          cur = nextOreMap.value[cur]
          if (!cur) return null
        }
        return cur
      }

      const rate = lvl <= 0 ? 0 : miningLevel.rate * miningMult.value * beaconMult * coloniesMult * probeMult * mgrMult

      let profitPerSec = 0
      let weightedPrice = 0

      const oreTargetMult = getOreTargetingMult(settings)
      let targetId = null

      if (p.distance != null && p.distance > 0) {
        for (const r of p.resources) {
          const ore = DB.value.ores[r.ore]
          if (!ore) continue
          const priceId = alchemyLevel > 0 && alchemyOre === r.ore
            ? (getNextOre(r.ore, alchemyLevel) || r.ore)
            : r.ore
          weightedPrice += (r.yield / 100) * effectivePrice(priceId, overrides, settings)
        }
        if (oreTargetMult) {
          let bestPrice = 0
          let autoBestOreId = null
          for (const r of p.resources) {
            const ore = DB.value.ores[r.ore]
            if (ore) {
              const price = effectivePrice(ore.id, overrides, settings)
              if (price > bestPrice) {
                bestPrice = price
                autoBestOreId = r.ore
              }
            }
          }
          const userTarget = overrides[id]?.oreTarget
          const validUser = userTarget && p.resources.some((r) => r.ore === userTarget)
          targetId = validUser ? userTarget : autoBestOreId
          if (targetId) {
            const targetPrice = effectivePrice(targetId, overrides, settings)
            if (targetPrice > 0) weightedPrice += (oreTargetMult - 1) * targetPrice
          }
        }
        profitPerSec = rate * weightedPrice
      }

      let upgradeCost = 0
      let paybackHours = Infinity
      let totalInvestment = 0
      let totalPaybackHours = Infinity
      if (p.distance != null && p.distance > 0 && lvl < 100) {
        const ratio = 1.3
        const astroMod = astronomyMod.value || 1
        const baseCost = p.basePrice / 20

        upgradeCost = baseCost * Math.pow(ratio, lvl - 1) * astroMod

        if (lvl % 2 === 1) {
          const h = Math.floor((lvl + 1) / 2)
          upgradeCost += 2 * baseCost * Math.pow(ratio, h - 1) * astroMod
        }

        const nextMiningLevel = DB.value.mining['lvl' + (lvl + 1)] || miningLevel
        const rateNext =
          nextMiningLevel.rate * miningMult.value * beaconMult * coloniesMult * probeMult * mgrMult
        const incProfit = (rateNext - rate) * weightedPrice
        if (incProfit > 0) paybackHours = upgradeCost / (incProfit * 3600)
      }
      const paybackProjection = {}
      if (p.distance != null && p.distance > 0) {
        const ratio = 1.3
        const astroMod = astronomyMod.value || 1
        const baseCost = p.basePrice / 20

        for (const steps of [1, 5, 10]) {
          if (lvl + steps > 100) { paybackProjection['+' + steps] = null; continue }
          let totalCost = 0
          for (let i = 0; i < steps; i++) {
            totalCost += baseCost * Math.pow(ratio, lvl + i - 1) * astroMod
          }
          const fromHalf = Math.floor(lvl / 2)
          const toHalf = Math.floor((lvl + steps) / 2)
          for (let h = fromHalf + 1; h <= toHalf; h++) {
            totalCost += 2 * baseCost * Math.pow(ratio, h - 1) * astroMod
          }
          const targetLevel = DB.value.mining['lvl' + (lvl + steps)]
          const rateTarget = targetLevel.rate * miningMult.value * beaconMult * coloniesMult * probeMult * mgrMult
          const incProj = (rateTarget - rate) * weightedPrice
          paybackProjection['+' + steps] = incProj > 0
            ? { cost: totalCost, incProfit: incProj, hours: totalCost / (incProj * 3600) }
            : null
        }
      }
      if (p.distance != null && p.distance > 0) {
        totalInvestment = p.basePrice
        if (lvl > 1) {
          const ratio = 1.3
          const astroMod = astronomyMod.value || 1
          const baseCost = p.basePrice / 20

          const mineSum = (Math.pow(ratio, lvl - 1) - 1) / (ratio - 1)
          totalInvestment += baseCost * mineSum * astroMod

          const halfLvl = Math.floor(lvl / 2)
          if (halfLvl > 0) {
            const csSum = (Math.pow(ratio, halfLvl) - 1) / (ratio - 1)
            totalInvestment += 2 * baseCost * csSum * astroMod
          }
        }
        if (profitPerSec > 0) totalPaybackHours = totalInvestment / (profitPerSec * 3600)
      }

      let maxProfitableLevel = 0
      const sessionTime = remainingTime.value > 0 ? remainingTime.value : effectiveSessionHours.value
      if (effectiveSessionHours.value > 0 && weightedPrice > 0) {
        const ratio = 1.3
        const astroMod = astronomyMod.value || 1
        const baseCost = p.basePrice / 20
        const rateMult = miningMult.value * beaconMult * coloniesMult * probeMult * mgrMult
        for (let L = 1; L < 100; L++) {
          let cost = baseCost * Math.pow(ratio, L - 1) * astroMod
          if (L % 2 === 1) {
            cost += 2 * baseCost * Math.pow(ratio, (L - 1) / 2) * astroMod
          }
          const rateL = DB.value.mining['lvl' + L]
          const rateL1 = DB.value.mining['lvl' + (L + 1)]
          if (!rateL || !rateL1) continue
          const incProfit = (rateL1.rate - rateL.rate) * rateMult * weightedPrice
          if (incProfit <= 0) continue
          if (cost / (incProfit * 3600) <= sessionTime) {
            maxProfitableLevel = L + 1
          }
        }
      }

      const resList = oreTargetMult
        ? p.resources.map((r) => {
            const ore = DB.value.ores[r.ore]
            const isTargeted = r.ore === targetId
            const displayYield = isTargeted ? r.yield + (oreTargetMult - 1) * 100 : r.yield
            const isAlchemy = alchemyLevel > 0 && alchemyOre === r.ore
            const nextId = isAlchemy ? getNextOre(r.ore, alchemyLevel) : null
            const nextOre = nextId ? DB.value.ores[nextId] : null
            return {
              ore: r.ore,
              name: ore ? ore.name : r.ore,
              yield: r.yield,
              displayYield: displayYield.toFixed(0),
              isTargeted,
              alchemyNext: isAlchemy && nextOre ? nextOre.name : null,
            }
          })
        : null

      const resStr = p.resources
        .map((r) => {
          const ore = DB.value.ores[r.ore]
          const isAlchemy = alchemyLevel > 0 && alchemyOre === r.ore
          const nextId = isAlchemy ? getNextOre(r.ore, alchemyLevel) : null
          const nextOre = nextId ? DB.value.ores[nextId] : null
          let line = (ore ? ore.name : r.ore) + ' ' + r.yield + '%'
          if (isAlchemy && nextOre) line += ' ↓ ' + nextOre.name
          if (oreTargetMult && targetId && r.ore === targetId) {
            line = (ore ? ore.name : r.ore) + ' ' + (r.yield + (oreTargetMult - 1) * 100).toFixed(0) + '%'
            if (isAlchemy && nextOre) line += ' ↓ ' + nextOre.name
          }
          return line
        })
        .join('\n')

      let groupKey = 'all'
      if (panelMode.value === 'basic') {
        for (const g of BASIC_PRICE_GROUPS) {
          if (p.basePrice >= g.min && p.basePrice < g.max) {
            groupKey = g.label.toLowerCase().replace(/[-\s]+/g, '_')
            break
          }
        }
      } else {
        for (const g of PLANET_GROUPS) {
          if (p.number >= g.min && p.number <= g.max) {
            groupKey = g.label.toLowerCase().replace(/\s+/g, '_')
          }
        }
      }

      const displayRate = oreTargetMult ? rate * oreTargetMult : rate

      return {
        id: p.id,
        name: p.name,
        number: p.number,
        basePrice: p.basePrice,
        distance: p.distance,
        lvl,
        colonies,
        probe,
        probeMult,
        managerIdx,
        managerLabel,
        alchemyLevel,
        alchemyOre,
        alchemyResources: alchemyLevel > 0 ? p.resources.map((r) => {
          const ore = DB.value.ores[r.ore]
          const nextId = getNextOre(r.ore, alchemyLevel)
          const nextOre = nextId ? DB.value.ores[nextId] : null
          return {
            ore: r.ore,
            oreName: ore ? ore.name : r.ore,
            nextName: nextOre ? nextOre.name : '—',
            yield: r.yield,
          }
        }) : [],
        rate,
        baseRate: lvl <= 0 ? 0 : miningLevel.rate,
        displayRate,
        resStr,
        resList,
        oreTargetMult,
        profitPerSec,
        upgradeCost,
        paybackHours,
        paybackProjection,
        totalInvestment,
        totalPaybackHours,
        maxProfitableLevel,
        paybackClass:
          isFinite(paybackHours) && paybackHours > 0
            ? (effectiveSessionHours.value > 0
                ? paybackHours < sessionTime
                  ? 'payback-green'
                  : paybackHours <= sessionTime * 1.15
                    ? 'payback-yellow'
                    : 'payback-red'
                : isFinite(totalPaybackHours) && totalPaybackHours > 0
                  ? paybackHours < totalPaybackHours
                    ? 'payback-green'
                    : paybackHours <= totalPaybackHours * 1.15
                      ? 'payback-yellow'
                      : 'payback-red'
                  : '')
            : '',
        hasProfit: p.distance != null && p.distance > 0,
        groupKey,
      }
    })
    .sort((a, b) => a.number - b.number)
    .map((row) => ({
      ...row,
      rateTooltip: buildRateTooltip(row),
    }))
})

function groupKey(g) {
  return g.label.toLowerCase().replace(/[-\s]+/g, '_')
}

const filterTabs = computed(() => {
  const groups = panelMode.value === 'basic' ? BASIC_PRICE_GROUPS : PLANET_GROUPS
  const counts = {}
  for (const g of groups) {
    const key = groupKey(g)
    counts[key] = sortedRows.value.filter((r) => r.groupKey === key).length
  }
  const tabs = []
  for (const g of groups) {
    const key = groupKey(g)
    if (counts[key] > 0) {
      tabs.push({ key, label: g.label, count: counts[key] })
    }
  }
  tabs.push({ key: 'all', label: 'All', count: sortedRows.value.length })
  return tabs
})

const visibleRows = computed(() => {
  if (activeGroup.value === 'all') return sortedRows.value
  return sortedRows.value.filter((r) => r.groupKey === activeGroup.value)
})

const bestUpgradeSteps = computed(() => {
  const steps = []
  const simLvls = {}
  for (const id of ORDER.value.planets) {
    simLvls[id] = getMiningLevel(id)
  }

  const stepSize = roadmapStepSize.value

  for (let s = 0; s < 10; s++) {
    let best = null

    for (const id of ORDER.value.planets) {
      let lvl = simLvls[id]
      if (lvl >= 100) continue

      const isBuying = lvl < 1
      if (isBuying && !includeNewPlanets.value) continue
      if (isBuying) lvl = 0

      const p = DB.value.planets[id]
      if (p.distance == null || p.distance <= 0) continue
      if (!isBuying && lvl + stepSize > 100) continue

      const targetLvl = isBuying ? stepSize : lvl + stepSize
      const targetData = DB.value.mining['lvl' + targetLvl]
      if (!targetData) continue

      const beaconMult = getBeaconMult(p.number, settings)
      const coloniesMult = 1 + 0.3 * getMiningColonies(id)
      const probe = getProbe(id)
      const probeMult = probe ? getProbeSpeed(id) || 1 : 1

      const managerIdx = getManager(id)
      let mgrMult = 1
      if (managerIdx >= 0 && managerIdx < settings.managers.length) {
        const m = settings.managers[managerIdx]
        if (m.primarySkill === 'mineRate') {
          mgrMult = 1 + (PRIMARY_EFFECTS.mineRate[Math.min(m.stars - 1, 6)] - 1) * (managerRoomMult.value || 1)
        }
      }

      let weightedPrice = 0
      for (const r of p.resources) {
        const ore = DB.value.ores[r.ore]
        if (ore) weightedPrice += (r.yield / 100) * effectivePrice(ore.id, overrides, settings)
      }
      const oreTargetMult = getOreTargetingMult(settings)
      if (oreTargetMult && p.resources.length) {
        let bestPrice = 0
        for (const r of p.resources) {
          const ore = DB.value.ores[r.ore]
          if (ore) bestPrice = Math.max(bestPrice, effectivePrice(r.ore, overrides, settings))
        }
        weightedPrice += (oreTargetMult - 1) * bestPrice
      }
      if (weightedPrice <= 0) continue

      const rateMult = miningMult.value * beaconMult * coloniesMult * probeMult * mgrMult
      const rateNow = isBuying ? 0 : (lvl <= 0 ? 0 : DB.value.mining['lvl' + lvl]?.rate || 0) * rateMult
      const rateTarget = targetData.rate * rateMult
      const incProfit = (rateTarget - rateNow) * weightedPrice
      if (incProfit <= 0) continue

      const astroMod = astronomyMod.value || 1
      const ratio = 1.3
      const baseCost = p.basePrice / 20
      let upgradeCost = 0

      if (isBuying) {
        upgradeCost = p.basePrice * astroMod
        for (let i = 1; i < stepSize; i++) {
          upgradeCost += baseCost * Math.pow(ratio, i - 1) * astroMod
        }
        for (let L = 1; L < stepSize; L += 2) {
          const h = Math.floor((L + 1) / 2)
          upgradeCost += 2 * baseCost * Math.pow(ratio, h - 1) * astroMod
        }
      } else {
        for (let i = 0; i < stepSize; i++) {
          upgradeCost += baseCost * Math.pow(ratio, lvl + i - 1) * astroMod
        }
        const fromHalf = Math.floor(lvl / 2)
        const toHalf = Math.floor((lvl + stepSize) / 2)
        for (let h = fromHalf + 1; h <= toHalf; h++) {
          upgradeCost += 2 * baseCost * Math.pow(ratio, h - 1) * astroMod
        }
      }

      const payback = upgradeCost / (incProfit * 3600)
      if (!isFinite(payback) || payback <= 0) continue

      if (!best || payback < best.paybackHours) {
        best = {
          id,
          name: p.name,
          number: p.number,
          fromLvl: isBuying ? 0 : lvl,
          toLvl: isBuying ? stepSize : lvl + stepSize,
          paybackHours: payback,
          upgradeCost,
          incProfit,
          isBuying,
        }
      }
    }

    if (!best) break

    steps.push(best)
    simLvls[best.id] = best.toLvl
  }

  return steps
})

const stepCounts = computed(() => {
  const counts = {}
  for (const s of bestUpgradeSteps.value) {
    counts[s.id] = (counts[s.id] || 0) + 1
  }
  return counts
})

const roadmapSortKey = ref('rank')
const roadmapSortDir = ref('asc')

function setRoadmapSort(key) {
  if (roadmapSortKey.value === key) {
    roadmapSortDir.value = roadmapSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    roadmapSortKey.value = key
    roadmapSortDir.value = 'asc'
  }
}

const roadmapSteps = computed(() =>
  bestUpgradeSteps.value.map((s, i) => ({ ...s, rank: i + 1 }))
)

const sortedRoadmapSteps = computed(() => {
  const steps = [...roadmapSteps.value]
  const dir = roadmapSortDir.value === 'asc' ? 1 : -1
  switch (roadmapSortKey.value) {
    case 'number':
      steps.sort((a, b) => (a.number - b.number) * dir)
      break
    case 'cost':
      steps.sort((a, b) => (a.upgradeCost - b.upgradeCost) * dir)
      break
    case 'profit':
      steps.sort((a, b) => (a.incProfit - b.incProfit) * dir)
      break
    case 'rank':
    default:
      steps.sort((a, b) => (a.rank - b.rank) * dir)
  }
  return steps
})

function profitClass(v) {
  return v >= 0 ? 'positive' : 'negative'
}

</script>

<style scoped>
.mining-level-select {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ml-btn {
  width: 28px !important;
  font-size: 13px !important;
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
  -moz-appearance: textfield;
}
.mining-level-input:focus {
  border-color: #4fc3f7;
}
.mining-level-input::-webkit-inner-spin-button,
.mining-level-input::-webkit-outer-spin-button {
  display: none;
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

.session-panel {
  margin-bottom: 12px;
  background: #121824;
  border-radius: 10px;
  border: 1px solid #1e2a3a;
}
.session-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  border-radius: 10px 10px 0 0;
}
.session-header:hover {
  background: rgba(255,255,255,0.04);
}
.session-header .session-controls {
  cursor: default;
}
.panel-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: #6b7a8f;
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.session-header:hover .panel-toggle {
  color: #4fc3f7;
}
.panel-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  border-top: 0 solid #1e2a3a;
}
.panel-body.open {
  max-height: 3000px;
  overflow-y: auto;
  border-top-width: 1px;
}
.session-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.session-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #c8d0dc;
  font-size: 13px;
  font-weight: 500;
}
.session-select {
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #e8edf5;
  font-size: 13px;
  padding: 3px 8px;
  outline: none;
  cursor: pointer;
}
.session-select:focus {
  border-color: #4fc3f7;
}
.session-slider {
  width: 120px;
  accent-color: #4fc3f7;
  cursor: pointer;
}
.session-step {
  display: flex;
  gap: 0;
  border-radius: 4px;
  overflow: hidden;
}
.step-btn {
  background: #0d1520;
  border: 1px solid #2a3a4a;
  color: #6b7a8f;
  font-size: 11px;
  padding: 2px 6px;
  cursor: pointer;
  margin: 0;
}
.step-btn:first-child { border-radius: 4px 0 0 4px; }
.step-btn:last-child { border-radius: 0 4px 4px 0; }
.step-btn.active {
  background: #1e88e5;
  color: #fff;
  border-color: #1e88e5;
}
.session-val {
  color: #e8edf5;
  font-size: 12px;
  font-weight: 600;
  min-width: 32px;
}
.session-remaining {
  color: #6b7a8f;
  font-size: 13px;
  margin-left: auto;
}
.session-remaining strong {
  color: #e8edf5;
}
.best-upgrade-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: #c8d0dc;
  flex-wrap: wrap;
}
.best-label {
  color: #4fc3f7;
  font-weight: 600;
}
.include-new-cb {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #c8d0dc;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
}
.include-new-cb input {
  accent-color: #4fc3f7;
  cursor: pointer;
}
.step-size-group {
  display: flex;
  gap: 0;
  border-radius: 4px;
  overflow: hidden;
}
.step-size-btn {
  background: #0d1520;
  border: 1px solid #2a3a4a;
  color: #6b7a8f;
  font-size: 11px;
  padding: 2px 6px;
  cursor: pointer;
  margin: 0;
}
.step-size-btn:first-child { border-radius: 4px 0 0 4px; }
.step-size-btn:last-child { border-radius: 0 4px 4px 0; }
.step-size-btn.active {
  background: #1e88e5;
  color: #fff;
  border-color: #1e88e5;
}
.roadmap-table-wrap {
  width: 100%;
  margin-top: 8px;
  overflow-x: auto;
}
.roadmap-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.roadmap-table th {
  background: #0d1520;
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: #6b7a8f;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #1e2a3a;
  white-space: nowrap;
  user-select: none;
}
.roadmap-table th.sortable {
  cursor: pointer;
}
.roadmap-table th.sortable:hover,
.roadmap-table th.sort-active {
  color: #4fc3f7;
}
.roadmap-table td {
  padding: 6px 10px;
  white-space: nowrap;
  vertical-align: middle;
}
.roadmap-table tbody tr {
  transition: background 0.15s;
}
.roadmap-table tbody tr:hover {
  background: rgba(79, 195, 247, 0.08);
}
.roadmap-table tbody tr.step-repeat-green {
  background: rgba(76, 175, 80, 0.15);
}
.roadmap-table tbody tr.step-repeat-yellow {
  background: rgba(255, 193, 7, 0.12);
}
.roadmap-table tbody tr.step-repeat-orange {
  background: rgba(255, 152, 0, 0.1);
}
.roadmap-rank {
  color: #4fc3f7;
  font-weight: 700;
}
.max-lv-click {
  cursor: pointer;
  font-weight: 400;
}
.max-lv-click:hover {
  font-weight: 700;
}
.step-repeat-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(79, 195, 247, 0.15);
  color: #4fc3f7;
  margin-left: 6px;
}
.apply-step-btn {
  background: #1e88e5;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  cursor: pointer;
  white-space: nowrap;
}
.apply-step-btn:hover {
  background: #1976d2;
}
.filter-tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  background: #121824;
  border-radius: 10px;
  padding: 4px;
}
.filter-tabs-left {
  display: flex;
  gap: 4px;
}
.filter-tab {
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
.filter-tab:hover {
  color: #c8d0dc;
  background: #1a2235;
}
.filter-tab.active {
  color: #fff;
  background: #1e88e5;
}
.filter-tab .count {
  color: #6b7a8f;
  font-size: 11px;
  margin-left: 4px;
  font-weight: 400;
}
.filter-tab.active .count {
  color: rgba(255, 255, 255, 0.6);
}

.ore-target-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
  line-height: 1.6;
}
.ore-target-row:hover {
  background: rgba(79, 195, 247, 0.08);
}
.ore-target-row.ore-targeted {
  background: rgba(76, 175, 80, 0.12);
}
.ore-target-name {
  color: #c8d0dc;
  font-size: 12px;
}
.ore-target-yield {
  color: #6b7a8f;
  font-size: 11px;
}
.ore-target-badge {
  font-size: 9px;
  font-weight: 700;
  color: #66bb6a;
  background: rgba(76, 175, 80, 0.15);
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}
.ore-target-alchemy {
  font-size: 10px;
  color: #4fc3f7;
  font-weight: 500;
}
.total-payback {
  color: #6b7a8f;
  font-size: 10px;
  margin-top: 1px;
}
.payback-green {
  background: rgba(76, 175, 80, 0.12);
  border-radius: 4px;
}
.payback-yellow {
  background: rgba(255, 193, 7, 0.12);
  border-radius: 4px;
}
.payback-red {
  background: rgba(244, 67, 54, 0.12);
  border-radius: 4px;
}
.manager-cell select {
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #e8edf5;
  font-size: 11px;
  padding: 2px 4px;
  max-width: 110px;
  outline: none;
  cursor: pointer;
}
.manager-cell select:focus {
  border-color: #4fc3f7;
}
.manager-cell select option:disabled {
  color: #4a5a6a;
}
.alchemy-cell {
  position: relative;
}
.alchemy-cb {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-right: 6px;
  color: #6b7a8f;
  font-size: 11px;
  cursor: pointer;
}
.alchemy-cb input {
  accent-color: #4fc3f7;
  cursor: pointer;
}
.alchemy-opts {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  background: #121824;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.alchemy-opt {
  color: #c8d0dc;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}
.alchemy-opt:hover {
  background: rgba(79, 195, 247, 0.12);
}
.alchemy-sel {
  color: #4fc3f7;
  background: rgba(79, 195, 247, 0.1);
  font-weight: 600;
}
</style>
