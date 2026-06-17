<template>
  <div class="game-overlay" @click.self="$emit('close')">
    <div class="game-modal">
      <div class="game-header">
        <h2 class="game-title">Game</h2>
        <span class="game-desc">Projects &amp; managers for current playthrough</span>
        <button class="game-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="settings-categories">
        <button v-for="cat in categories" :key="cat.key" class="settings-cat"
          :class="{ active: activeCat === cat.key }"
          @click="switchCat(cat.key)">{{ cat.label }}</button>
      </div>
      <div class="settings-content">
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
        <template v-else>
          <div v-for="group in projectGroups" :key="group.name" class="project-group">
            <div class="project-group-title">{{ group.name }}</div>
            <label v-for="item in group.items" :key="item.key" class="project-check-row">
              <input type="checkbox" class="project-check" :checked="getVal(item.key)" @change="toggleItem(item.key)">
              <span class="settings-label">{{ item.label }}</span>
              <span v-if="getVal(item.key) && item.baseEffect" class="settings-effect">{{ item.baseEffect }}×</span>
            </label>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettings } from '../composables/useSettings'
import { SETTINGS_CONFIG, MANAGER_SKILLS } from '../utils/config'

defineEmits(['close'])

const { getRawSetting, setSetting, getManagers, addManager, removeManager, updateManagerSkill, updateManagerValue } = useSettings()

const activeCat = ref('projects')
const categories = [
  { key: 'projects', label: 'Projects' },
  { key: 'managers', label: 'Managers' },
]

const projectGroups = computed(() => {
  const all = SETTINGS_CONFIG.projects
  if (!all) return []
  const groups = [
    { name: 'Mining', keys: ['advancedMining', 'superiorMining'] },
    { name: 'Smelting', keys: ['advancedFurnace', 'superiorFurnace', 'smeltingEfficiency'] },
    { name: 'Crafting', keys: ['advancedCrafter', 'superiorCrafter', 'craftingEfficiency'] },
    { name: 'Alloy Value', keys: ['advancedAlloyValue', 'superiorAlloyValue'] },
    { name: 'Item Value', keys: ['advancedItemValue', 'superiorItemValue'] },
  ]
  return groups.map(g => ({ name: g.name, items: g.keys.map(k => all.find(i => i.key === k)).filter(Boolean) }))
})

const managers = computed(() => getManagers())
const skillOptions = MANAGER_SKILLS

function getVal(key) { return getRawSetting('projects', key) }

function toggleItem(key) {
  const current = getRawSetting('projects', key)
  setSetting('projects', key, current ? 0 : 1)
}

function switchCat(cat) { activeCat.value = cat }
</script>

<style scoped>
.game-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.game-modal {
  background: #121824;
  border: 1px solid #1e2a3a;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  overflow-y: auto;
}
.game-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 20px 20px 0;
  position: relative;
}
.game-title {
  font-size: 20px;
  font-weight: 700;
  color: #e8edf5;
  margin: 0;
}
.game-desc {
  color: #6b7a8f;
  font-size: 13px;
}
.game-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #6b7a8f;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1;
}
.game-close:hover {
  color: #fff;
  background: #1a2235;
}
</style>
