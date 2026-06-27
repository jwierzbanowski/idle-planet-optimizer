<template>
  <div class="mgr-card">
    <button
class="mgr-remove" @click="$emit('remove')">&times;</button>
    <div class="mgr-stars-grid" @mouseleave="hoveredStar = 0">
      <span></span>
      <div class="mgr-stars-content">
        <svg
          v-for="i in 6"
          :key="i"
          viewBox="0 0 20 20"
          width="14"
          height="14"
          class="mgr-star"
          :class="{ filled: hoveredStar ? i <= hoveredStar : i <= manager.stars }"
          @mouseenter="hoveredStar = i"
          @click="setStars(i)"
        >
          <path d="M10 1l2.5 5.1 5.6.8-4 4 .9 5.6L10 14l-5 2.6.9-5.6-4-4 5.6-.8z" />
        </svg>
      </div>
      <span></span>
      <span></span>
    </div>

    <div class="mgr-skill-row">
      <button class="mgr-btn" @click="cyclePrimary(-1)">◀</button>
      <span class="mgr-skill-name">{{ primaryLabel }}</span>
      <button class="mgr-btn" @click="cyclePrimary(1)">▶</button>
      <span class="mgr-effect">{{ primaryEffect }}</span>
    </div>

    <div class="mgr-skill-row">
      <button class="mgr-btn" :disabled="manager.stars < 3" @click="cycleSecondary(-1)">◀</button>
      <span class="mgr-skill-name">{{ secondaryLabel }}</span>
      <button class="mgr-btn" :disabled="manager.stars < 3" @click="cycleSecondary(1)">▶</button>
      <span class="mgr-effect">{{ secondaryEffect }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  MANAGER_PRIMARY_SKILLS,
  MANAGER_SECONDARY_SKILLS,
  PRIMARY_EFFECTS,
  SECONDARY_EFFECTS,
} from '../utils/config'

const props = defineProps({
  manager: { type: Object, required: true },
})

const emit = defineEmits(['remove', 'update:primarySkill', 'update:secondarySkill', 'update:stars'])

const hoveredStar = ref(0)

const primaryLabel = computed(() => {
  const found = MANAGER_PRIMARY_SKILLS.find((s) => s.value === props.manager.primarySkill)
  return found ? found.label : '—'
})

const secondaryLabel = computed(() => {
  const found = MANAGER_SECONDARY_SKILLS.find((s) => s.value === props.manager.secondarySkill)
  return found ? found.label : '—'
})

const primaryEffect = computed(() => {
  const arr = PRIMARY_EFFECTS[props.manager.primarySkill]
  if (!arr) return '—'
  const stars = props.manager.stars
  if (stars <= 0) return '—'
  if (arr.length >= stars) return '×' + arr[stars - 1].toFixed(2)
  return '—'
})

const secondaryEffect = computed(() => {
  const arr = SECONDARY_EFFECTS[props.manager.secondarySkill]
  if (!arr) return '—'
  const stars = props.manager.stars
  if (stars <= 0) return '—'
  if (arr.length >= stars && arr[stars - 1] != null) return '×' + arr[stars - 1].toFixed(2)
  return '—'
})

function setStars(n) {
  const next = props.manager.stars === n ? 0 : n
  emit('update:stars', next)
}

function cyclePrimary(dir) {
  const idx = MANAGER_PRIMARY_SKILLS.findIndex((s) => s.value === props.manager.primarySkill)
  if (idx === -1) return
  const next = (idx + dir + MANAGER_PRIMARY_SKILLS.length) % MANAGER_PRIMARY_SKILLS.length
  emit('update:primarySkill', MANAGER_PRIMARY_SKILLS[next].value)
}

function cycleSecondary(dir) {
  if (props.manager.stars < 3) return
  const skip = MANAGER_SECONDARY_SKILLS.filter((s) => s.value !== 'empty')
  const idx = skip.findIndex((s) => s.value === props.manager.secondarySkill)
  if (idx === -1) return
  const next = (idx + dir + skip.length) % skip.length
  emit('update:secondarySkill', skip[next].value)
}
</script>

<style scoped>
.mgr-card {
  background: #0d1520;
  border-radius: 6px;
  padding: 8px;
  border: 1px solid #1a2235;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  position: relative;
}

.mgr-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: 1px solid #2a3a4a;
  border-radius: 3px;
  background: #0d1520;
  color: #ef5350;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 1;
}

.mgr-remove:hover {
  border-color: #ef5350;
  background: rgba(239, 83, 80, 0.1);
}

.mgr-row {
  display: flex;
  align-items: center;
  gap: 3px;
}

.mgr-btn {
  width: 18px;
  height: 18px;
  border: 1px solid #2a3a4a;
  border-radius: 3px;
  background: #0d1520;
  color: #6b7a8f;
  font-size: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  user-select: none;
}

.mgr-btn:hover {
  border-color: #4fc3f7;
  color: #4fc3f7;
}

.mgr-btn:active {
  background: #1a2235;
}

.mgr-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.mgr-stars-grid {
  display: grid;
  grid-template-columns: 18px 1fr 18px 45px;
  gap: 6px;
  align-items: center;
  width: 100%;
}
.mgr-stars-content {
  display: flex;
  gap: 2px;
  justify-content: center;
}
.mgr-star {
  fill: none;
  stroke: #6b7a8f;
  stroke-width: 1.2;
  transition: fill 0.15s, stroke 0.15s, transform 0.12s;
  cursor: pointer;
}
.mgr-star:hover {
  transform: scale(1.25);
}
.mgr-star.filled {
  fill: #ffffff;
  stroke: #ffffff;
}

.mgr-skill-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.mgr-skill-row .mgr-btn {
  flex: 0 0 18px;
  width: 18px;
  min-width: 18px;
}

.mgr-skill-name {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #c8d0dc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mgr-effect {
  flex: 0 0 45px;
  width: 45px;
  min-width: 45px;
  font-size: 11px;
  font-weight: 600;
  color: #4fc3f7;
  text-align: right;
  overflow: hidden;
}
</style>
