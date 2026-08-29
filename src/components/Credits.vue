<template>
  <div>
    <div class="credits-goal">
      <label class="goal-label">Run value goal</label>
      <div class="goal-row">
        <input
          v-model.number="goalNum"
          class="goal-input"
          type="number"
          min="1"
          @input="parseGoal"
        />
        <div class="goal-suffix">
          <button class="star-btn goal-arrow" @click="suffixDown" :disabled="suffixIdx <= 2">&lt;</button>
          <span class="goal-suffix-val">{{ suffixLabel }}</span>
          <button class="star-btn goal-arrow" @click="suffixUp" :disabled="suffixIdx >= SUFFIXES.length - 1">&gt;</button>
        </div>
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
      <CreditsBreakdown :milestone="breakdownTarget" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CreditsBreakdown from './CreditsBreakdown.vue'

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

const selected = ref(null)

const goalNum = ref(10)
const suffixIdx = ref(2)
const suffixLabel = computed(() => SUFFIXES[suffixIdx.value])

const parsedGoal = ref(null)
const rawGoalCredits = ref(0)

const breakdownTarget = computed(() => {
  if (parsedGoal.value != null) {
    const display = goalNum.value + SUFFIXES[suffixIdx.value]
    return { display, credits: rawGoalCredits.value }
  }
  if (!selected.value) return null
  return { display: selected.value.display, credits: selected.value.credits }
})

function suffixDown() {
  if (suffixIdx.value > 2) {
    suffixIdx.value--
    parseGoal()
  }
}

function suffixUp() {
  if (suffixIdx.value < SUFFIXES.length - 1) {
    suffixIdx.value++
    parseGoal()
  }
}

function selectMilestone(m) {
  selected.value = m
  const suffix = m.display.replace(/[\d.]/g, '')
  const num = parseFloat(m.display.replace(/[^\d.]/g, ''))
  const idx = SUFFIXES.indexOf(suffix)
  if (idx >= 0) suffixIdx.value = idx
  goalNum.value = num
  parseGoal()
}

selectMilestone(milestones[0])

function parseGoal() {
  const v = goalNum.value * Math.pow(10, suffixIdx.value * 3)
  if (goalNum.value <= 0 || v < 10_000_000) {
    parsedGoal.value = null
    rawGoalCredits.value = 0
    return
  }
  parsedGoal.value = v

  let lower = milestones[0]
  let upper = milestones[milestones.length - 1]
  for (let i = 0; i < milestones.length; i++) {
    if (milestones[i].value <= v) {
      lower = milestones[i]
    } else {
      upper = milestones[i]
      break
    }
  }

  let interpolated
  if (lower.value === upper.value) {
    interpolated = lower.credits
  } else {
    const ratio = (v - lower.value) / (upper.value - lower.value)
    interpolated = lower.credits + ratio * (upper.credits - lower.credits)
  }
  rawGoalCredits.value = Math.round(interpolated)
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
  width: 100px;
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
.goal-suffix {
  display: flex;
  align-items: center;
  gap: 2px;
}
.goal-arrow {
  width: 26px;
  height: 26px;
  padding: 0;
  font-size: 14px;
}
.goal-suffix-val {
  min-width: 28px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #e8edf5;
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
