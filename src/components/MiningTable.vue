<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Planet</th><th>Base Price</th><th>Resources</th><th>Mining Lv</th><th>Colonies</th><th>Probe</th><th>Rate</th><th>Profit / s</th><th>Upgrade Payback</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedRows" :key="row.id">
          <td class="name-cell">{{ row.name }}</td>
          <td class="price">{{ fmtPrice(row.basePrice) }}</td>
          <td><span class="ingredient-list">{{ row.resStr }}</span></td>
          <td>
            <div class="mining-level-select">
              <button class="star-btn" :disabled="row.lvl <= 1" @click="setOverride(row.id, 'miningLevel', row.lvl - 1)">−</button>
              <input type="number" class="mining-level-input" :value="row.lvl" min="1" max="100"
                @change="setOverride(row.id, 'miningLevel', Math.max(1, Math.min(100, parseInt($event.target.value) || 1)))">
              <button class="star-btn" :disabled="row.lvl >= 100" @click="setOverride(row.id, 'miningLevel', row.lvl + 1)">+</button>
            </div>
          </td>
          <td>
            <div class="mining-level-select">
              <button class="star-btn" :disabled="row.colonies <= 0" @click="setOverride(row.id, 'colonies', row.colonies - 1)">−</button>
              <input type="number" class="mining-level-input" :value="row.colonies" min="0" max="100"
                @change="setOverride(row.id, 'colonies', Math.max(0, Math.min(100, parseInt($event.target.value) || 0)))">
              <button class="star-btn" :disabled="row.colonies >= 100" @click="setOverride(row.id, 'colonies', row.colonies + 1)">+</button>
            </div>
          </td>
          <td class="price">
            <input type="checkbox" class="probe-check" :checked="row.probe"
              @change="setProbe(row.id, $event.target.checked)">
            <template v-if="row.probe">
              &nbsp;×<input type="number" class="probe-input" :value="row.probeMult" min="0" step="0.01"
                @change="setOverride(row.id, 'probeSpeed', Math.max(0, parseFloat($event.target.value) || 1))">
            </template>
          </td>
          <td class="price">
            {{ row.rate.toFixed(3) }}/s
            <span class="info-icon" :data-tip="row.rateTooltip" @click.stop="toggleTip">i</span>
          </td>
          <template v-if="row.hasProfit">
            <td :class="profitClass(row.profitPerSec)" style="font-weight:600">{{ fmtPrice(row.profitPerSec) }}/s</td>
            <td v-if="isFinite(row.paybackHours)" class="price-small">
              {{ fmtDuration(row.paybackHours) }}
              <span class="info-icon" :data-tip="'Upgrade cost: ' + fmtPrice(Math.round(row.upgradeCost))"
                @click.stop="toggleTip">i</span>
            </td>
            <td v-else class="price-small">—</td>
          </template>
          <template v-else>
            <td class="price-small">—</td>
            <td class="price-small">—</td>
          </template>
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
import { effectivePrice, getMiningSpeedMult, getBeaconMult, getProjectMultiplier, getStationMult, getModifier } from '../utils/calc'
import { fmtPrice, fmtDuration, toggleTip } from '../utils/format'

const { DB, ORDER } = useData()
const { overrides, getMiningLevel, getMiningColonies, getProbe, getProbeSpeed, setOverride } = useOverrides()
const { settings } = useSettings()

function setProbe(id, val) {
  setOverride(id, 'probe', val)
  if (!val) setOverride(id, 'probeSpeed', 0)
}

const engineering = computed(() => getModifier('rooms', 'engineering', settings))
const miningProj = computed(() => getProjectMultiplier(settings, ['advancedMining', 'superiorMining']))
const stnMine = computed(() => getStationMult(settings, ['mining1', 'mining2']))
const global12 = computed(() => settings.station?.miningGlobal ? 1.2 : null)
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
  lines.push('  Colonies (×' + row.colonies + '): 1 + 0.3×' + row.colonies + ' = ' + (1 + 0.3 * row.colonies).toFixed(2) + '×')
  if (row.probe) lines.push('  Probe: ' + row.probeMult.toFixed(2) + '×')
  if (engineering.value || miningProj.value || stnMine.value || global12.value || row.probe) {
    lines.push('  ─────────────────')
  }
  lines.push('  Result: ' + row.rate.toFixed(3) + '/s')
  return lines.join('\n')
}

const sortedRows = computed(() => {
  return ORDER.value.planets.map(id => {
    const p = DB.value.planets[id]
    const lvl = getMiningLevel(id)
    const colonies = getMiningColonies(id)
    const probe = getProbe(id)
    const probeMult = probe ? (getProbeSpeed(id) || 1) : 1
    const miningLevel = DB.value.mining['lvl' + lvl] || DB.value.mining['lvl1']
    const beaconMult = getBeaconMult(p.number, settings)
    const coloniesMult = 1 + 0.3 * colonies
    const rate = miningLevel.rate * miningMult.value * beaconMult * coloniesMult * probeMult

    let profitPerSec = 0
    let weightedPrice = 0

    if (p.distance != null && p.distance > 0) {
      for (const r of p.resources) {
        const ore = DB.value.ores[r.ore]
        if (ore) weightedPrice += (r.yield / 100) * effectivePrice(ore.id, overrides, settings)
      }
      profitPerSec = rate * weightedPrice
    }

    let upgradeCost = 0
    let paybackHours = Infinity
    if (p.distance != null && p.distance > 0 && lvl < 100) {
      upgradeCost = (p.basePrice / 20) * Math.pow(1.3, lvl - 1)
      if (astronomyMod.value) upgradeCost *= astronomyMod.value
      const nextMiningLevel = DB.value.mining['lvl' + (lvl + 1)] || miningLevel
      const rateNext = nextMiningLevel.rate * miningMult.value * beaconMult * coloniesMult * probeMult
      const incProfit = (rateNext - rate) * weightedPrice
      if (incProfit > 0) paybackHours = upgradeCost / (incProfit * 3600)
    }

    const resStr = p.resources.map(r => {
      const ore = DB.value.ores[r.ore]
      return (ore ? ore.name : r.ore) + ' ' + r.yield + '%'
    }).join(', ')

    return {
      id: p.id, name: p.name, number: p.number, basePrice: p.basePrice,
      distance: p.distance, lvl, colonies, probe, probeMult,
      rate, baseRate: miningLevel.rate, resStr,
      profitPerSec, upgradeCost, paybackHours, hasProfit: p.distance != null && p.distance > 0,
    }
  }).sort((a, b) => a.number - b.number).map(row => ({
    ...row, rateTooltip: buildRateTooltip(row),
  }))
})

function profitClass(v) {
  return v >= 0 ? 'positive' : 'negative'
}


</script>

<style scoped>
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

.probe-check { cursor: pointer; accent-color: #4fc3f7; }
.probe-input {
  width: 64px; background: #0d1520; border: 1px solid #2a3a4a; border-radius: 4px;
  color: #e8edf5; font-size: 13px; font-weight: 600; text-align: center;
  padding: 3px 4px; outline: none;
}
.probe-input:focus { border-color: #4fc3f7; }
.probe-input::-webkit-inner-spin-button { opacity: 0.5; }
</style>
