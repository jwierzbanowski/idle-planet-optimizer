<template>
  <div>
    <div class="credits-goal">
      <label class="goal-label">Run value goal</label>
      <div class="goal-row">
        <input
          v-model="goalInput"
          class="goal-input"
          placeholder="e.g. 5T"
          @input="parseGoal"
        />
        <span v-if="parsedGoal" class="goal-result">
          <strong>{{ goalCredits }}</strong> credits
          <span class="goal-detail">({{ goalMilestones }} milestones)</span>
          <span v-if="loungeMult > 1" class="goal-lounge">
            ×{{ loungeMult.toFixed(2) }} with Lounge
          </span>
        </span>
        <span v-else class="goal-hint">Enter a value to see total credits</span>
      </div>
    </div>
    <div class="credits-content">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Value</th>
              <th>Credits</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(m, idx) in milestones" :key="m.n">
              <tr
                v-if="idx > 0 && m.tierStart"
                class="tier-separator"
              >
                <td colspan="3" />
              </tr>
              <tr
                :class="{
                  goal: goalMilestones > 0 && m.n <= goalMilestones,
                  selected: selected && selected.n === m.n,
                }"
                @click="selectMilestone(m)"
              >
                <td class="milestone-n">{{ m.n }}</td>
                <td class="milestone-val">{{ m.display }}</td>
                <td class="credits-cell">{{ m.credits }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <CreditsBreakdown :milestone="selectedBreakdown" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettings } from '../composables/useSettings'
import { getModifier } from '../utils/calc'
import CreditsBreakdown from './CreditsBreakdown.vue'

const { settings } = useSettings()

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'q', 'Q', 's', 'S', 'O', 'N', 'D']
const HARDCODED_CREDITS = [10, 30, 60, 101, 150, 210, 285, 367, 459]

function triangular(n) {
  return (n * (n + 1)) / 2
}

function getCredits(n) {
  if (n <= HARDCODED_CREDITS.length) return HARDCODED_CREDITS[n - 1]
  return triangular(n) * 10
}

function fmtVal(num, suffix) {
  const v = Math.round(num)
  if (suffix === '') return v.toString()
  return v + suffix
}

function buildMilestones() {
  const result = []
  let n = 1
  let cumul = 0
  const startSuffixIdx = 2

  for (const coeff of [10, 100]) {
    const value = coeff * Math.pow(10, startSuffixIdx * 3)
    const credits = getCredits(n)
    cumul += credits
    result.push({
      n,
      value,
      display: fmtVal(coeff, SUFFIXES[startSuffixIdx]),
      credits,
      cumul,
      tierStart: false,
    })
    n++
  }

  for (let si = startSuffixIdx + 1; si < SUFFIXES.length; si++) {
    for (const coeff of [1, 10, 100]) {
      const value = coeff * Math.pow(10, si * 3)
      const credits = getCredits(n)
      cumul += credits
      result.push({
        n,
        value,
        display: fmtVal(coeff, SUFFIXES[si]),
        credits,
        cumul,
        tierStart: coeff === 1,
      })
      n++
    }
  }
  return result
}

const milestones = buildMilestones()

const loungeMult = computed(() => {
  const m = getModifier('rooms', 'lounge', settings)
  return m != null ? m : 1
})

const selected = ref(null)

const selectedBreakdown = computed(() => {
  if (!selected.value) return null
  return { display: selected.value.display, credits: selected.value.credits }
})

function selectMilestone(m) {
  selected.value = m
}

function parseUnfmt(str) {
  const clean = str.trim().toUpperCase()
  const match = clean.match(/^(\d+(?:\.\d+)?)\s*([KMBTqQsSOND]?)$/)
  if (!match) return null
  const num = parseFloat(match[1])
  const suffix = match[2] || ''
  const idx = SUFFIXES.indexOf(suffix)
  if (idx === -1) return null
  return num * Math.pow(10, idx * 3)
}

const goalInput = ref('')
const parsedGoal = ref(null)
const goalMilestones = ref(0)
const goalCredits = ref(0)

function parseGoal() {
  const v = parseUnfmt(goalInput.value)
  if (v == null || v <= 0) {
    parsedGoal.value = null
    goalMilestones.value = 0
    goalCredits.value = 0
    return
  }
  parsedGoal.value = v
  let reached = 0
  let total = 0
  for (const m of milestones) {
    if (v >= m.value) {
      reached = m.n
      total = m.cumul
    } else {
      break
    }
  }
  goalMilestones.value = reached
  goalCredits.value = Math.round(total * loungeMult.value)
}
</script>

<style scoped>
.credits-goal {
  background: #0d1520;
  border: 1px solid #1a2235;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 16px;
}
.goal-label {
  font-size: 12px;
  font-weight: 700;
  color: #6b7a8f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  display: block;
}
.goal-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.goal-input {
  width: 140px;
  background: #121824;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  color: #e8edf5;
  font-size: 16px;
  font-weight: 600;
  padding: 8px 12px;
  outline: none;
  font-family: inherit;
}
.goal-input:focus {
  border-color: #4fc3f7;
}
.goal-input::placeholder {
  color: #3a4a5a;
  font-weight: 400;
}
.goal-result {
  font-size: 14px;
  color: #c8d0dc;
}
.goal-result strong {
  color: #4fc3f7;
  font-size: 18px;
}
.goal-detail {
  color: #6b7a8f;
  font-size: 12px;
  margin-left: 8px;
}
.goal-lounge {
  color: #e8c547;
  font-size: 12px;
  margin-left: 4px;
}
.goal-hint {
  color: #3a4a5a;
  font-size: 13px;
}

tr.tier-separator td {
  height: 8px;
  padding: 0;
  background: #0d1520;
  border-bottom: none;
}
tr.tier-separator:hover td {
  background: #0d1520;
}
tr.goal {
  background: rgba(30, 136, 229, 0.12);
}
tr.goal:hover {
  background: rgba(30, 136, 229, 0.2);
}
tr.selected {
  background: rgba(79, 195, 247, 0.15);
  outline: 1px solid rgba(79, 195, 247, 0.35);
}
tr.selected:hover {
  background: rgba(79, 195, 247, 0.22);
}
.milestone-n {
  color: #6b7a8f;
  font-size: 12px;
  width: 40px;
}
.milestone-val {
  font-weight: 600;
  color: #e8edf5;
}
.credits-cell {
  color: #4fc3f7;
  font-weight: 600;
}
.credits-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.credits-content .table-wrap {
  flex: 7;
  min-width: 0;
}
@media (max-width: 768px) {
  .credits-content {
    flex-direction: column;
  }
}
</style>
