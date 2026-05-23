<template>
  <div class="settings-bar">
    <button id="settingsToggle" @click="toggle">{{ open ? '▼ Settings' : '▶ Settings' }}</button>
  </div>
  <div class="settings-panel" :class="{ open }">
    <div class="settings-categories">
      <button v-for="cat in categories" :key="cat.key" class="settings-cat"
        :class="{ active: activeCat === cat.key }"
        @click="switchCat(cat.key)">{{ cat.label }}</button>
    </div>
    <div class="settings-content">
      <template v-if="currentConfig.length === 0">
        <div class="settings-empty">No settings yet</div>
      </template>
      <div v-for="item in currentConfig" :key="item.key" class="settings-row">
        <div class="settings-info">
          <span class="settings-label">{{ item.label }}</span>
          <span v-if="item.desc" class="settings-desc">{{ item.desc }}</span>
        </div>
        <template v-if="isNumeric(item)">
          <div class="star-controls">
            <button class="star-btn" :disabled="(getVal(item.key)) <= 0"
              @click="change(item.key, -1)">−</button>
            <span class="star-count">{{ getVal(item.key) }}{{ item.maxLevel != null ? '/' + item.maxLevel : '' }}</span>
            <button class="star-btn" :disabled="item.maxLevel != null && getVal(item.key) >= item.maxLevel"
              @click="change(item.key, 1)">+</button>
          </div>
          <span v-if="item.baseEffect != null && getVal(item.key) > 0" class="settings-effect"
            :style="{ color: item.baseEffect < 1 ? '#4caf50' : undefined }">
            <template v-if="item.baseEffect >= 1">
              {{ (item.baseEffect + item.perLevel * (getVal(item.key) - 1)).toFixed(2) }}×
            </template>
            <template v-else>
              -{{ Math.round((1 - (item.baseEffect + item.perLevel * (getVal(item.key) - 1))) * 100) }}%
            </template>
          </span>
          <span v-else-if="item.baseEffect != null" class="settings-effect" style="color:#6b7a8f">—</span>
        </template>
        <template v-else>
          <button class="toggle-btn" :class="{ active: getVal(item.key) }" @click="toggleItem(item.key)">
            <span class="toggle-knob"></span>
          </button>
          <span v-if="getVal(item.key) && item.baseEffect != null" class="settings-effect">{{ item.baseEffect }}×</span>
          <span v-else-if="item.baseEffect != null" class="settings-effect" style="color:#6b7a8f">—</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettings } from '../composables/useSettings'
import { SETTINGS_CONFIG } from '../utils/config'

const { getRawSetting, setSetting } = useSettings()

const open = ref(false)
const activeCat = ref('rooms')
const categories = [
  { key: 'rooms', label: 'Rooms' },
  { key: 'projects', label: 'Projects' },
  { key: 'beacon', label: 'Beacon' },
  { key: 'station', label: 'Station' },
]

const currentConfig = computed(() => SETTINGS_CONFIG[activeCat.value] || [])

function isNumeric(item) { return item.maxLevel != null }

function getVal(key) { return getRawSetting(activeCat.value, key) }

function change(key, delta) {
  const current = getRawSetting(activeCat.value, key)
  setSetting(activeCat.value, key, current + delta)
}

function toggleItem(key) {
  const current = getRawSetting(activeCat.value, key)
  setSetting(activeCat.value, key, current ? 0 : 1)
}

function toggle() { open.value = !open.value }
function switchCat(cat) { activeCat.value = cat }
</script>
