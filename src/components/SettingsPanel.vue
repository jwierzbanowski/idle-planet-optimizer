<template>
  <div class="settings-bar">
    <button id="settingsToggle"
@click="toggle">
      {{ open ? '▼ Settings' : '▶ Settings' }}
    </button>
  </div>
  <div class="settings-panel"
:class="{ open }">
    <div class="settings-categories">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="settings-cat"
        :class="{ active: activeCat === cat.key }"
        @click="switchCat(cat.key)"
      >
        {{ cat.label }}
      </button>
    </div>
    <div class="settings-content">
      <!-- Managers: vertical cards -->
      <div v-if="activeCat === 'managers'"
class="mgr-list">
        <ManagerCard
          v-for="(mgr, i) in managers"
          :key="i"
          :manager="mgr"
          @remove="removeManager(i)"
          @update:primary-skill="updateManagerPrimarySkill(i, $event)"
          @update:secondary-skill="updateManagerSecondarySkill(i, $event)"
          @update:stars="updateManagerStars(i, $event)"
        />
        <button
class="mgr-add" @click="addManager">+ Add</button>
      </div>

      <!-- Projects: grouped with checkboxes -->
      <template v-else-if="activeCat === 'projects'">
        <div v-for="group in projectGroups"
:key="group.name" class="project-group">
          <div class="project-group-title">
            {{ group.name }}
          </div>
          <label v-for="item in group.items"
:key="item.key" class="project-check-row">
            <input
              type="checkbox"
              class="project-check"
              :checked="getVal(item.key)"
              @change="toggleItem(item.key)"
            />
            <span class="settings-label">{{ item.label }}</span>
            <span
v-if="getVal(item.key) && item.baseEffect" class="settings-effect"
              >{{ item.baseEffect }}×</span
            >
          </label>
        </div>
      </template>

      <!-- Other categories: config-based -->
      <template v-else>
        <template v-if="currentConfig.length === 0">
          <div class="settings-empty">No settings yet</div>
        </template>
        <div v-for="item in currentConfig"
:key="item.key" class="settings-row">
          <div class="settings-info">
            <span class="settings-label">{{ item.label }}</span>
            <span v-if="item.desc"
class="settings-desc">{{ item.desc }}</span>
          </div>
          <template v-if="isNumeric(item)">
            <div class="star-controls">
              <button
                class="star-btn"
                :disabled="getVal(item.key) <= 0"
                @click="change(item.key, -1)"
              >
                −
              </button>
              <span class="star-count"
                >{{ getVal(item.key) }}{{ item.maxLevel != null ? '/' + item.maxLevel : '' }}</span
              >
              <button
                class="star-btn"
                :disabled="item.maxLevel != null && getVal(item.key) >= item.maxLevel"
                @click="change(item.key, 1)"
              >
                +
              </button>
            </div>
            <span
              v-if="item.baseEffect != null"
              class="settings-effect"
              :style="{ color: item.baseEffect < 1 ? '#4caf50' : undefined }"
            >
              <template v-if="getVal(item.key) > 0">
                <template v-if="item.baseEffect >= 1">
                  {{ (item.baseEffect + item.perLevel * (getVal(item.key) - 1)).toFixed(2) }}×
                </template>
                <template v-else>
                  -{{
                    Math.round(
                      (1 - (item.baseEffect + item.perLevel * (getVal(item.key) - 1))) * 100
                    )
                  }}%
                </template>
              </template>
              <template v-else>—</template>
            </span>
            <span v-else-if="item.perLevel != null"
class="settings-effect" style="color: #4caf50">
              {{
                getVal(item.key) > 0
                  ? (1 + item.perLevel * getVal(item.key)).toFixed(2) + '×'
                  : '×1.00'
              }}
            </span>
          </template>
          <template v-else>
            <button
              class="toggle-btn"
              :class="{ active: getVal(item.key) }"
              @click="toggleItem(item.key)"
            >
              <span class="toggle-knob" />
            </button>
            <span
v-if="getVal(item.key) && item.baseEffect != null" class="settings-effect"
              >{{ item.baseEffect }}×</span
            >
            <span v-else-if="item.baseEffect != null" class="settings-effect" style="color: #6b7a8f"
            >—</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettings } from '../composables/useSettings'
import { SETTINGS_CONFIG } from '../utils/config'
import ManagerCard from './ManagerCard.vue'

const {
  getRawSetting,
  setSetting,
  getManagers,
  addManager,
  removeManager,
  updateManagerStars,
  updateManagerPrimarySkill,
  updateManagerSecondarySkill,
} = useSettings()

const open = ref(false)
const activeCat = ref('projects')
const categories = [
  { key: 'projects', label: 'Projects' },
  { key: 'managers', label: 'Managers' },
]

const currentConfig = computed(() => SETTINGS_CONFIG[activeCat.value] || [])

const projectGroups = computed(() => {
  const all = SETTINGS_CONFIG.projects
  if (!all) return []
  const groups = [
    { name: 'Manager', keys: ['managerTraining', 'advancedManagerTraining', 'superiorManagerTraining'] },
    { name: 'Mining', keys: ['advancedMining', 'superiorMining'] },
    { name: 'Smelting', keys: ['advancedFurnace', 'superiorFurnace', 'smeltingEfficiency'] },
    { name: 'Crafting', keys: ['advancedCrafter', 'superiorCrafter', 'craftingEfficiency'] },
    { name: 'Alloy Value', keys: ['advancedAlloyValue', 'superiorAlloyValue'] },
    { name: 'Item Value', keys: ['advancedItemValue', 'superiorItemValue'] },
  ]
  return groups.map((g) => ({
    name: g.name,
    items: g.keys.map((k) => all.find((i) => i.key === k)).filter(Boolean),
  }))
})

const managers = computed(() => getManagers())

function isNumeric(item) {
  return item.maxLevel != null || item.perLevel != null
}

function getVal(key) {
  return getRawSetting(activeCat.value, key)
}

function change(key, delta) {
  const current = getRawSetting(activeCat.value, key)
  setSetting(activeCat.value, key, current + delta)
}

function toggleItem(key) {
  const current = getRawSetting(activeCat.value, key)
  setSetting(activeCat.value, key, current ? 0 : 1)
}

function toggle() {
  open.value = !open.value
}
function switchCat(cat) {
  activeCat.value = cat
}
</script>

<style scoped>
.settings-bar {
  margin-bottom: 12px;
}
.settings-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: #121824;
  border-radius: 10px;
  border: 1px solid #1e2a3a;
}
.settings-panel.open {
  max-height: 3000px;
  overflow-y: auto;
}
.settings-categories {
  display: flex;
  gap: 4px;
  padding: 12px 12px 0;
  flex-wrap: wrap;
}
.settings-cat {
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
.settings-cat:hover {
  color: #c8d0dc;
  background: #1a2235;
}
.settings-cat.active {
  color: #fff;
  background: #1e88e5;
}
.settings-content {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
.station-group {
  background: #0d1520;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid #1a2235;
}
.station-group .project-group-title {
  padding: 0 4px;
}
.settings-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px;
  color: #6b7a8f;
}
.settings-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0d1520;
  border-radius: 6px;
  padding: 8px 12px;
  border: 1px solid #1a2235;
}
.settings-info {
  flex: 1;
  min-width: 0;
}
.settings-label {
  color: #c8d0dc;
  font-size: 13px;
  font-weight: 500;
}
.settings-desc {
  display: block;
  color: #6b7a8f;
  font-size: 11px;
  margin-top: 2px;
}
.settings-effect {
  color: #4fc3f7;
  font-size: 14px;
  font-weight: 600;
  min-width: 56px;
  text-align: right;
}
.manager-select {
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 6px;
  color: #c8d0dc;
  font-size: 12px;
  padding: 6px 8px;
  cursor: pointer;
  min-width: 140px;
}
.manager-select:hover {
  border-color: #4fc3f7;
}
.manager-select option {
  background: #0d1520;
  color: #c8d0dc;
}

.mgr-list {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.mgr-list > * {
  flex: 0 0 calc(25% - 4.5px);
  max-width: calc(25% - 4.5px);
}
.mgr-add {
  padding: 8px;
  border: 1px dashed #2a3a4a;
  border-radius: 4px;
  background: transparent;
  color: #4fc3f7;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
}
.mgr-add:hover {
  border-color: #4fc3f7;
  background: rgba(79, 195, 247, 0.05);
}
.toggle-btn {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: 1px solid #2a3a4a;
  background: #0d1520;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
}
.toggle-btn.active {
  background: #1e88e5;
  border-color: #1e88e5;
}
.toggle-knob {
  display: block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #6b7a8f;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.2s;
}
.toggle-btn.active .toggle-knob {
  background: #fff;
  left: 20px;
}
.project-group {
  margin-bottom: 12px;
}
.project-group:last-child {
  margin-bottom: 0;
}
.project-group-title {
  font-size: 11px;
  font-weight: 700;
  color: #6b7a8f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  padding: 0 4px;
}
.project-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}
.project-check-row:hover {
  background: #0d1520;
}
.project-check {
  accent-color: #1e88e5;
  cursor: pointer;
}
.project-check-row .settings-effect {
  margin-left: auto;
}
</style>
