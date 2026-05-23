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
      <!-- Managers: dynamic cards -->
      <template v-if="activeCat === 'managers'">
        <div v-for="(mgr, i) in managers" :key="i" class="mgr-card">
          <select class="mgr-select" :value="mgr.skill" @change="updateManagerSkill(i, $event.target.value)">
            <option v-for="opt in skillOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input type="number" step="0.01" min="0" class="mgr-value"
            :value="mgr.value" @input="updateManagerValue(i, $event.target.value)">
          <button class="mgr-remove" @click="removeManager(i)">&times;</button>
        </div>
        <button class="mgr-add" @click="addManager">+ Add Manager</button>
      </template>

      <!-- Other categories: config-based -->
      <template v-else>
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
            <span v-else-if="item.perLevel != null && getVal(item.key) > 0" class="settings-effect" style="color:#4caf50">
              {{ (1 + item.perLevel * getVal(item.key)).toFixed(2) }}×
            </span>
          </template>
          <template v-else>
            <button class="toggle-btn" :class="{ active: getVal(item.key) }" @click="toggleItem(item.key)">
              <span class="toggle-knob"></span>
            </button>
            <span v-if="getVal(item.key) && item.baseEffect != null" class="settings-effect">{{ item.baseEffect }}×</span>
            <span v-else-if="item.baseEffect != null" class="settings-effect" style="color:#6b7a8f">—</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettings } from '../composables/useSettings'
import { SETTINGS_CONFIG, MANAGER_SKILLS } from '../utils/config'

const {
  getRawSetting, setSetting, getManagers, addManager,
  removeManager, updateManagerSkill, updateManagerValue
} = useSettings()

const open = ref(false)
const activeCat = ref('rooms')
const categories = [
  { key: 'rooms', label: 'Rooms' },
  { key: 'station', label: 'Station' },
  { key: 'projects', label: 'Projects' },
  { key: 'beacon', label: 'Beacon' },
  { key: 'managers', label: 'Managers' },
]

const currentConfig = computed(() => SETTINGS_CONFIG[activeCat.value] || [])
const managers = computed(() => getManagers())
const skillOptions = MANAGER_SKILLS

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
