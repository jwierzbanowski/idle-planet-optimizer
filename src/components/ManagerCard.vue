<template>
  <div class="mgr-card">
    <div class="mgr-row">
      <button class="mgr-btn" :disabled="manager.stars <= 1" @click="$emit('update:stars', manager.stars - 1)">−</button>
      <span class="mgr-value">{{ manager.stars }}</span>
      <button class="mgr-btn" :disabled="manager.stars >= 7" @click="$emit('update:stars', manager.stars + 1)">+</button>
      <button class="mgr-remove" @click="$emit('remove')">&times;</button>
    </div>

    <div class="mgr-row">
      <button class="mgr-btn" @click="cyclePrimary(-1)">◀</button>
      <span class="mgr-skill-name">{{ primaryLabel }}</span>
      <button class="mgr-btn" @click="cyclePrimary(1)">▶</button>
      <span class="mgr-effect">{{ primaryEffect }}</span>
    </div>

    <div class="mgr-row">
      <button class="mgr-btn" :disabled="manager.stars < 3" @click="cycleSecondary(-1)">◀</button>
      <span class="mgr-skill-name">{{ secondaryLabel }}</span>
      <button class="mgr-btn" :disabled="manager.stars < 3" @click="cycleSecondary(1)">▶</button>
      <span class="mgr-effect">{{ secondaryEffect }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MANAGER_PRIMARY_SKILLS, MANAGER_SECONDARY_SKILLS, PRIMARY_EFFECTS, SECONDARY_EFFECTS } from '../utils/config'

const props = defineProps({
  manager: { type: Object, required: true }
})

const emit = defineEmits(['remove', 'update:primarySkill', 'update:secondarySkill', 'update:stars'])

const primaryLabel = computed(() => {
  const found = MANAGER_PRIMARY_SKILLS.find(s => s.value === props.manager.primarySkill)
  return found ? found.label : '—'
})

const secondaryLabel = computed(() => {
  const found = MANAGER_SECONDARY_SKILLS.find(s => s.value === props.manager.secondarySkill)
  return found ? found.label : '—'
})

const primaryEffect = computed(() => {
  const arr = PRIMARY_EFFECTS[props.manager.primarySkill]
  if (!arr) return '—'
  const stars = props.manager.stars
  if (arr.length >= stars) return '×' + arr[stars - 1].toFixed(2)
  return '—'
})

const secondaryEffect = computed(() => {
  const arr = SECONDARY_EFFECTS[props.manager.secondarySkill]
  if (!arr) return '—'
  const stars = props.manager.stars
  if (arr.length >= stars && arr[stars - 1] != null) return '×' + arr[stars - 1].toFixed(2)
  return '—'
})

function cyclePrimary(dir) {
  const idx = MANAGER_PRIMARY_SKILLS.findIndex(s => s.value === props.manager.primarySkill)
  if (idx === -1) return
  const next = (idx + dir + MANAGER_PRIMARY_SKILLS.length) % MANAGER_PRIMARY_SKILLS.length
  emit('update:primarySkill', MANAGER_PRIMARY_SKILLS[next].value)
}

function cycleSecondary(dir) {
  if (props.manager.stars < 3) return
  const skip = MANAGER_SECONDARY_SKILLS.filter(s => s.value !== 'empty')
  const idx = skip.findIndex(s => s.value === props.manager.secondarySkill)
  if (idx === -1) return
  const next = (idx + dir + skip.length) % skip.length
  emit('update:secondarySkill', skip[next].value)
}


</script>

<style scoped>
.mgr-card {
  background: #0d1520;
  border-radius: 6px;
  padding: 6px;
  border: 1px solid #1a2235;
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 140px;
}

.mgr-remove {
  width: 18px;
  height: 18px;
  border: 1px solid #2a3a4a;
  border-radius: 3px;
  background: transparent;
  color: #ef5350;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin-left: auto;
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

.mgr-value {
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: #ffd54f;
  margin: 0 2px;
}

.mgr-skill-name {
  flex: 1;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #c8d0dc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mgr-effect {
  font-size: 11px;
  font-weight: 600;
  color: #4fc3f7;
  min-width: 40px;
  text-align: right;
}
</style>
