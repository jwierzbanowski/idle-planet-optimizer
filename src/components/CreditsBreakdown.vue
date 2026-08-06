<template>
  <div class="breakdown-panel">
    <div class="breakdown-header">Credits</div>
    <template v-if="milestone">
      <div class="breakdown-section">
        <div class="breakdown-row">
          <span class="breakdown-label">Galaxy Value</span>
          <span class="breakdown-val">{{ milestone.display }}</span>
        </div>
        <div class="breakdown-row">
          <span class="breakdown-label">Base Reward</span>
          <span class="breakdown-val credits">{{ milestone.credits }}</span>
        </div>
        <div class="breakdown-row">
          <span class="breakdown-label">Lounge ({{ fmtMult(loungeRaw) }})</span>
          <span class="breakdown-val credits">{{ fmt(loungeCredits) }}</span>
        </div>
        <div class="breakdown-row">
          <span class="breakdown-label">Space Station ({{ fmtMult(statRaw) }})</span>
          <span class="breakdown-val credits">{{ fmt(statCredits) }}</span>
        </div>
        <div class="breakdown-row">
          <span class="breakdown-label">Module Bonus ({{ fmtMult(modRaw) }})</span>
          <span class="breakdown-val credits">{{ fmt(modCredits) }}</span>
        </div>
      </div>
      <div class="breakdown-total">
        <span class="breakdown-label">Total Reward</span>
        <span class="breakdown-total-val">{{ fmt(totalCredits) }}</span>
      </div>
    </template>
    <div v-else class="breakdown-empty">
      Click a milestone to see the breakdown
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettings } from '../composables/useSettings'
import { getModifier, getStationCreditsMult, getModuleSubstatMult, SYNTH_CREDITS_STATS } from '../utils/calc'

const props = defineProps({
  milestone: { type: Object, default: null },
})

const { settings } = useSettings()

const loungeRaw = computed(() => getModifier('rooms', 'lounge', settings) || 1)
const statRaw = computed(() => getStationCreditsMult(settings) || 1)
const modRaw = computed(() => {
  return getModuleSubstatMult(settings.modulesData, settings.modules, 'synth', SYNTH_CREDITS_STATS) || 1
})

const loungeCredits = computed(() => {
  if (!props.milestone) return 0
  return Math.round(props.milestone.credits * loungeRaw.value)
})
const statCredits = computed(() => {
  if (!props.milestone) return 0
  return Math.round(loungeCredits.value * statRaw.value)
})
const modCredits = computed(() => {
  if (!props.milestone) return 0
  return Math.round(statCredits.value * modRaw.value)
})
const totalCredits = computed(() => modCredits.value)

function fmtMult(v) {
  return '×' + v.toFixed(2)
}

function fmt(v) {
  if (v >= 1000) return v.toLocaleString()
  return v.toString()
}
</script>

<style scoped>
.breakdown-panel {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #121824;
  border-radius: 10px;
  border: 1px solid #1e2a3a;
  min-height: 0;
  min-width: 220px;
}
.breakdown-header {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  color: #e8edf5;
  border-bottom: 1px solid #1a2235;
}
.breakdown-section {
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
.breakdown-label {
  font-size: 12px;
  color: #6b7a8f;
}
.breakdown-val {
  font-size: 13px;
  color: #c8d0dc;
  font-weight: 500;
}
.breakdown-val.credits {
  color: #e8edf5;
  font-weight: 600;
}
.breakdown-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px 12px;
  border-top: 1px solid #1a2235;
  margin-top: 4px;
}
.breakdown-total-val {
  font-size: 16px;
  font-weight: 700;
  color: #4fc3f7;
}
.breakdown-empty {
  padding: 20px 16px;
  font-size: 12px;
  color: #3a4a5a;
  text-align: center;
}
</style>
