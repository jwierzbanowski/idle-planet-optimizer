<template>
  <div class="time-picker">
    <button class="tp-trigger" type="button" @click="openDialog">
      <Clock :size="14" />
      <span>{{ triggerDisplay }}</span>
    </button>
    <Teleport to="body">
      <div v-if="open" class="tp-overlay" @click.self="close">
        <div class="tp-dialog" role="dialog" aria-label="Pick time">
          <div class="tp-header">
            <div class="tp-display">{{ dialogDisplay }}</div>
            <div class="tp-tabs">
              <button :class="{ active: mode === 'hours' }" @click="mode = 'hours'">Hours</button>
              <button :class="{ active: mode === 'minutes' }" @click="mode = 'minutes'">Minutes</button>
            </div>
          </div>
          <div class="tp-dial">
            <div class="tp-dial-center"></div>
            <div class="tp-hand" :style="handStyle"></div>
            <template v-if="mode === 'hours'">
              <button
                v-for="v in 12"
                :key="'h' + v"
                class="tp-dial-marker"
                :class="{ selected: dialHour === v - 1 }"
                :style="markerStyle(v, 12)"
                @click="setDialHour(v - 1)"
              >{{ v - 1 }}</button>
            </template>
            <template v-else>
              <button
                v-for="(m, i) in minuteTicks"
                :key="'m' + m"
                class="tp-dial-marker"
                :class="{ selected: internalMinutes === m }"
                :style="markerStyle(i + 1, 12)"
                @click="internalMinutes = m"
              >{{ m }}</button>
            </template>
          </div>
          <div class="tp-steppers">
            <button class="tp-step-btn" title="Decrease" @click="step(-1)">−</button>
            <span class="tp-stepper-val">{{ mode === 'hours' ? internalHours + 'h' : internalMinutes + 'm' }}</span>
            <button class="tp-step-btn" title="Increase" @click="step(1)">+</button>
          </div>
          <div class="tp-footer">
            <button class="tp-cancel" @click="close">Cancel</button>
            <button class="tp-ok" @click="confirm">OK</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Clock } from '@lucide/vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 168 },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const mode = ref('hours')
const internalHours = ref(0)
const internalMinutes = ref(0)

const minuteTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

const dialHour = computed(() => internalHours.value % 12)
const handAngle = computed(() => {
  if (mode.value === 'hours') return (dialHour.value / 12) * 360
  return (internalMinutes.value / 60) * 360
})
const handStyle = computed(() => ({
  transform: 'translate(-50%, -100%) rotate(' + handAngle.value + 'deg)',
}))

function fmtVal(hours) {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  let s = ''
  if (h > 0) s += h + 'h '
  if (m > 0 || h === 0) s += m + 'm'
  return s.trim()
}

const triggerDisplay = computed(() => fmtVal(props.modelValue))
const dialogDisplay = computed(() => fmtVal(internalHours.value + internalMinutes.value / 60))

function openDialog() {
  const hours = props.modelValue
  let h = Math.floor(hours)
  let m = Math.round((hours - h) * 60)
  if (m === 60) {
    h += 1
    m = 0
  }
  internalHours.value = Math.min(props.max, Math.max(props.min, h))
  internalMinutes.value = m
  open.value = true
}

function close() {
  open.value = false
}

function confirm() {
  emit('update:modelValue', internalHours.value + internalMinutes.value / 60)
  open.value = false
}

function markerStyle(pos, total) {
  const angle = ((pos - 1) / total) * 2 * Math.PI - Math.PI / 2
  const r = 42
  const x = 50 + r * Math.cos(angle)
  const y = 50 + r * Math.sin(angle)
  return { left: x + '%', top: y + '%' }
}

function setDialHour(v) {
  const block = Math.floor(internalHours.value / 12)
  internalHours.value = Math.min(props.max, Math.max(props.min, block * 12 + v))
}

function step(dir) {
  if (mode.value === 'hours') {
    internalHours.value = Math.min(props.max, Math.max(props.min, internalHours.value + 12 * dir))
  } else {
    internalMinutes.value = (((internalMinutes.value + dir) % 60) + 60) % 60
  }
}
</script>

<style scoped>
.time-picker {
  display: inline-flex;
}
.tp-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #e8edf5;
  font-size: 13px;
  font-weight: 600;
  padding: 3px 10px;
  cursor: pointer;
  min-height: 24px;
}
.tp-trigger:hover {
  border-color: #4fc3f7;
  color: #4fc3f7;
}
.tp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.tp-dialog {
  background: #121824;
  border: 1px solid #2a3a4a;
  border-radius: 12px;
  padding: 20px;
  min-width: 280px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
.tp-display {
  font-size: 30px;
  font-weight: 700;
  color: #e8edf5;
  text-align: center;
  letter-spacing: 1px;
  font-variant-numeric: tabular-nums;
}
.tp-tabs {
  display: flex;
  gap: 4px;
  justify-content: center;
  margin-top: 10px;
}
.tp-tabs button {
  padding: 5px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7a8f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.tp-tabs button:hover {
  color: #c8d0dc;
}
.tp-tabs button.active {
  background: #1e88e5;
  color: #fff;
}
.tp-dial {
  position: relative;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border: 1px solid #2a3a4a;
  background: radial-gradient(circle at center, #162030, #0d1520);
  margin: 16px auto 4px;
}
.tp-dial-center {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4fc3f7;
  transform: translate(-50%, -50%);
  z-index: 2;
}
.tp-hand {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: 40%;
  background: #4fc3f7;
  border-radius: 2px;
  transform-origin: 50% 100%;
  z-index: 1;
}
.tp-dial-marker {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #6b7a8f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  z-index: 2;
  transition: all 0.15s;
}
.tp-dial-marker:hover {
  color: #fff;
  background: rgba(79, 195, 247, 0.15);
}
.tp-dial-marker.selected {
  background: #1e88e5;
  color: #fff;
  box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.3);
}
.tp-steppers {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  margin: 8px 0 4px;
}
.tp-step-btn {
  width: 36px;
  height: 30px;
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  color: #4fc3f7;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
}
.tp-step-btn:hover {
  border-color: #4fc3f7;
}
.tp-stepper-val {
  min-width: 64px;
  text-align: center;
  color: #c8d0dc;
  font-size: 13px;
  font-weight: 600;
}
.tp-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.tp-cancel,
.tp-ok {
  padding: 7px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #2a3a4a;
  background: transparent;
  color: #c8d0dc;
}
.tp-cancel:hover {
  border-color: #4fc3f7;
  color: #4fc3f7;
}
.tp-ok {
  background: #1e88e5;
  border-color: #1e88e5;
  color: #fff;
}
.tp-ok:hover {
  background: #1976d2;
  border-color: #1976d2;
  color: #fff;
}
</style>
