<template>
  <div class="game-overlay"
@click.self="$emit('close')">
    <div class="game-modal">
      <div class="game-header">
        <h2 class="game-title">Game</h2>
        <span class="game-desc">Projects for current playthrough</span>
        <button
class="game-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="settings-content">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGame } from '../composables/useGame'
import { SETTINGS_CONFIG } from '../utils/config'

defineEmits(['close'])

const { getRawSetting, setSetting } = useGame()

const projectGroups = computed(() => {
  const all = SETTINGS_CONFIG.projects
  if (!all) return []
  const groups = [
    { name: 'Manager', keys: ['managerTraining', 'advancedManagerTraining', 'superiorManagerTraining'] },
    {
      name: 'Mining',
      keys: ['advancedMining', 'superiorMining', 'oreTargeting', 'advancedOreTargeting'],
    },
    { name: 'Rovers', keys: ['rover1', 'rover2'] },
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

function getVal(key) {
  return getRawSetting('projects', key)
}

function toggleItem(key) {
  const current = getRawSetting('projects', key)
  setSetting('projects', key, current ? 0 : 1)
}
</script>

<style scoped>
.game-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
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
</style>
