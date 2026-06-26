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
        <div v-if="activeCat === 'managers'" class="mgr-list">
          <ManagerCard
            v-for="(mgr, i) in managers" :key="i"
            :manager="mgr"
            @remove="removeManager(i)"
            @update:primarySkill="updateManagerPrimarySkill(i, $event)"
            @update:secondarySkill="updateManagerSecondarySkill(i, $event)"
            @update:stars="updateManagerStars(i, $event)"
          />
          <button class="mgr-add" @click="addManager">+ Add</button>
        </div>
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
import { useGame } from '../composables/useGame'
import { SETTINGS_CONFIG } from '../utils/config'
import ManagerCard from './ManagerCard.vue'

defineEmits(['close'])

const { getRawSetting, setSetting, getManagers, addManager, removeManager, updateManagerStars, updateManagerPrimarySkill, updateManagerSecondarySkill } = useGame()

const activeCat = ref('projects')
const categories = [
  { key: 'projects', label: 'Projects' },
  { key: 'managers', label: 'Managers' },
]

const projectGroups = computed(() => {
  const all = SETTINGS_CONFIG.projects
  if (!all) return []
  const groups = [
    { name: 'Mining', keys: ['advancedMining', 'superiorMining', 'oreTargeting'] },
    { name: 'Smelting', keys: ['advancedFurnace', 'superiorFurnace', 'smeltingEfficiency'] },
    { name: 'Crafting', keys: ['advancedCrafter', 'superiorCrafter', 'craftingEfficiency'] },
    { name: 'Alloy Value', keys: ['advancedAlloyValue', 'superiorAlloyValue'] },
    { name: 'Item Value', keys: ['advancedItemValue', 'superiorItemValue'] },
  ]
  return groups.map(g => ({ name: g.name, items: g.keys.map(k => all.find(i => i.key === k)).filter(Boolean) }))
})

const managers = computed(() => getManagers())

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
  width: 95%;
  max-width: 1000px;
  max-height: 92vh;
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
  padding: 8px; border: 1px dashed #2a3a4a; border-radius: 4px;
  background: transparent; color: #4fc3f7; font-size: 13px; cursor: pointer;
  text-align: center;
}

.mgr-add:hover { border-color: #4fc3f7; background: rgba(79,195,247,0.05); }
</style>
