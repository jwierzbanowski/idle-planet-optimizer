<template>
  <div>
    <div class="filter-tabs">
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
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in visibleRows"
            :key="row.id"
            :class="{ 'best-row': row.id === bestRowId }"
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
                  <span v-if="r.isTargeted"
class="ore-target-badge">TARGET</span>
                </div>
              </template>
              <span v-else
class="ingredient-list">{{ row.resStr }}</span>
            </td>
            <td>
              <div class="mining-level-select">
                <button
                  class="star-btn"
                  :disabled="row.lvl <= 1"
                  @click="setOverride(row.id, 'miningLevel', row.lvl - 1)"
                >
                  −
                </button>
                <input
                  type="number"
                  class="mining-level-input"
                  :value="row.lvl"
                  min="1"
                  max="100"
                  @change="
                    setOverride(
                      row.id,
                      'miningLevel',
                      Math.max(1, Math.min(100, parseInt($event.target.value) || 1))
                    )
                  "
                />
                <button
                  class="star-btn"
                  :disabled="row.lvl >= 100"
                  @click="setOverride(row.id, 'miningLevel', row.lvl + 1)"
                >
                  +
                </button>
              </div>
            </td>
            <td>
              <div class="mining-level-select">
                <button
                  class="star-btn"
                  :disabled="row.colonies <= 0"
                  @click="setOverride(row.id, 'colonies', row.colonies - 1)"
                >
                  −
                </button>
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
                />
                <button
                  class="star-btn"
                  :disabled="row.colonies >= 100"
                  @click="setOverride(row.id, 'colonies', row.colonies + 1)"
                >
                  +
                </button>
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
class="price-small">
                <div>Next: {{ fmtDuration(row.paybackHours) }}</div>
                <div v-if="isFinite(row.totalPaybackHours)"
class="total-payback">
                  Total: {{ fmtDuration(row.totalPaybackHours) }}
                </div>
                <span
                  class="info-icon"
                  :data-tip="
                    'Next upgrade cost: ' +
                    fmtPrice(Math.round(row.upgradeCost)) +
                    '\nTotal invested: ' +
                    fmtPrice(Math.round(row.totalInvestment))
                  "
                  @click.stop="toggleTip"
                  >i</span
                >
              </td>
              <td
v-else class="price-small">—</td>
            </template>
            <template v-else>
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
import { useData } from '../composables/useData'
import { useOverrides } from '../composables/useOverrides'
import { useSettings } from '../composables/useSettings'
import {
  effectivePrice,
  getMiningSpeedMult,
  getBeaconMult,
  getProjectMultiplier,
  getStationMult,
  getModifier,
  getOreTargetingMult,
} from '../utils/calc'
import { fmtPrice, fmtDuration, toggleTip } from '../utils/format'

const { DB, ORDER } = useData()
const { overrides, getMiningLevel, getMiningColonies, getProbe, getProbeSpeed, setOverride } =
  useOverrides()
const { settings } = useSettings()

const PLANET_GROUPS = [
  { label: '10M-100M', min: 1, max: 13 },
  { label: '100M-1B', min: 14, max: 22 },
  { label: '1B-100B', min: 23, max: 76 },
]

const activeGroup = ref('all')

function setProbe(id, val) {
  setOverride(id, 'probe', val)
  if (!val) setOverride(id, 'probeSpeed', 0)
}

function setOreTarget(planetId, oreId, isCurrentlyTargeted) {
  setOverride(planetId, 'oreTarget', isCurrentlyTargeted ? null : oreId)
}

const engineering = computed(() => getModifier('rooms', 'engineering', settings))
const miningProj = computed(() =>
  getProjectMultiplier(settings, ['advancedMining', 'superiorMining'])
)
const stnMine = computed(() => getStationMult(settings, ['mining1', 'mining2']))
const global12 = computed(() => (settings.station?.miningGlobal ? 1.2 : null))
const miningMult = computed(() => getMiningSpeedMult(settings) || 1)
const astronomyMod = computed(() => getModifier('rooms', 'astronomy', settings))

function buildRateTooltip(row) {
  const lines = ['Mine Rate']
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
      const rate = miningLevel.rate * miningMult.value * beaconMult * coloniesMult * probeMult

      let profitPerSec = 0
      let weightedPrice = 0

      const oreTargetMult = getOreTargetingMult(settings)
      let targetId = null

      if (p.distance != null && p.distance > 0) {
        for (const r of p.resources) {
          const ore = DB.value.ores[r.ore]
          if (ore) weightedPrice += (r.yield / 100) * effectivePrice(ore.id, overrides, settings)
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
        upgradeCost = (p.basePrice / 20) * Math.pow(1.3, lvl - 1)
        if (astronomyMod.value) upgradeCost *= astronomyMod.value
        const nextMiningLevel = DB.value.mining['lvl' + (lvl + 1)] || miningLevel
        const rateNext =
          nextMiningLevel.rate * miningMult.value * beaconMult * coloniesMult * probeMult
        const incProfit = (rateNext - rate) * weightedPrice
        if (incProfit > 0) paybackHours = upgradeCost / (incProfit * 3600)
      }
      if (p.distance != null && p.distance > 0) {
        totalInvestment = p.basePrice
        if (lvl > 1) {
          const ratio = 1.3
          const upgradeSum = (Math.pow(ratio, lvl - 1) - 1) / (ratio - 1)
          let upgradesCost = (p.basePrice / 20) * upgradeSum
          if (astronomyMod.value) upgradesCost *= astronomyMod.value
          totalInvestment += upgradesCost
        }
        if (profitPerSec > 0) totalPaybackHours = totalInvestment / (profitPerSec * 3600)
      }

      const resList = oreTargetMult
        ? p.resources.map((r) => {
            const ore = DB.value.ores[r.ore]
            const isTargeted = r.ore === targetId
            const displayYield = isTargeted ? r.yield + (oreTargetMult - 1) * 100 : r.yield
            return {
              ore: r.ore,
              name: ore ? ore.name : r.ore,
              yield: r.yield,
              displayYield: displayYield.toFixed(0),
              isTargeted,
            }
          })
        : null

      const resStr = p.resources
        .map((r) => {
          const ore = DB.value.ores[r.ore]
          if (oreTargetMult && targetId && r.ore === targetId) {
            return (
              (ore ? ore.name : r.ore) +
              ' ' +
              (r.yield + (oreTargetMult - 1) * 100).toFixed(0) +
              '%'
            )
          }
          return (ore ? ore.name : r.ore) + ' ' + r.yield + '%'
        })
        .join('\n')

      let groupKey = 'all'
      for (const g of PLANET_GROUPS) {
        if (p.number >= g.min && p.number <= g.max) {
          groupKey = g.label.toLowerCase().replace(/\s+/g, '_')
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
        rate,
        baseRate: miningLevel.rate,
        displayRate,
        resStr,
        resList,
        oreTargetMult,
        profitPerSec,
        upgradeCost,
        paybackHours,
        totalInvestment,
        totalPaybackHours,
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

const filterTabs = computed(() => {
  const counts = {}
  for (const g of PLANET_GROUPS) {
    const key = g.label.toLowerCase().replace(/\s+/g, '_')
    counts[key] = sortedRows.value.filter((r) => r.groupKey === key).length
  }
  const tabs = []
  for (const g of PLANET_GROUPS) {
    const key = g.label.toLowerCase().replace(/\s+/g, '_')
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

function profitClass(v) {
  return v >= 0 ? 'positive' : 'negative'
}

const bestRowId = computed(() => {
  let best = null
  let bestProfit = -Infinity
  for (const row of visibleRows.value) {
    if (row.hasProfit && row.profitPerSec > bestProfit) {
      bestProfit = row.profitPerSec
      best = row.id
    }
  }
  return best
})
</script>

<style scoped>
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

.filter-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  background: #121824;
  border-radius: 10px;
  padding: 4px;
  display: inline-flex;
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

.best-row {
  background: rgba(76, 175, 80, 0.08);
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
.total-payback {
  color: #6b7a8f;
  font-size: 10px;
  margin-top: 1px;
}
</style>
