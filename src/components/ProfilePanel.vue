<template>
  <div class="profile-overlay"
@click.self="$emit('close')">
    <div class="profile-modal">
      <div class="profile-header">
        <h2 class="profile-title">Profile</h2>
        <span class="profile-desc">Rooms, station &amp; beacon settings</span>
        <button
class="profile-close" @click="$emit('close')">&times;</button>
      </div>
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
        <template v-if="activeCat === 'station'">
          <div v-for="group in stationGroups"
:key="group.name" class="station-group">
            <div class="project-group-title">
              {{ group.name }}
            </div>
            <div v-for="item in group.items"
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
                    >{{ getVal(item.key)
                    }}{{ item.maxLevel != null ? '/' + item.maxLevel : '' }}</span
                  >
                  <button
                    class="star-btn"
                    :disabled="item.maxLevel != null && getVal(item.key) >= item.maxLevel"
                    @click="change(item.key, 1)"
                  >
                    +
                  </button>
                </div>
                <span class="settings-effect"
style="color: #4caf50">
                  {{
                    item.perLevel != null
                      ? getVal(item.key) > 0
                        ? (1 + item.perLevel * getVal(item.key)).toFixed(2) + '×'
                        : '0×'
                      : ''
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
              </template>
            </div>
          </div>
        </template>
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
                  >{{ getVal(item.key)
                  }}{{ item.maxLevel != null ? '/' + item.maxLevel : '' }}</span
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
              <span
                v-else-if="item.perLevel != null"
                class="settings-effect"
                style="color: #4caf50"
              >
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
              <span
                v-else-if="item.baseEffect != null"
                class="settings-effect"
                style="color: #6b7a8f"
                >—</span
              >
            </template>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProfile } from '../composables/useProfile'
import { SETTINGS_CONFIG } from '../utils/config'

defineEmits(['close'])

const { getRawSetting, setSetting } = useProfile()

const activeCat = ref('rooms')
const categories = [
  { key: 'rooms', label: 'Rooms' },
  { key: 'station', label: 'Station' },
  { key: 'beacon', label: 'Beacon' },
]

const currentConfig = computed(() => SETTINGS_CONFIG[activeCat.value] || [])

const stationGroups = computed(() => {
  const all = SETTINGS_CONFIG.station
  if (!all) return []
  const groups = [
    { name: 'Mining', keys: ['mining1', 'mining2', 'miningGlobal'] },
    { name: 'Crafting', keys: ['crafting1', 'crafting2', 'crafting3', 'crafting4', 'crafting5'] },
    { name: 'Smelting', keys: ['smelting1', 'smelting2', 'smelting3', 'smelting4', 'smelting5'] },
    {
      name: 'Alloy & Item',
      keys: [
        'alloyItem1',
        'alloyItem2',
        'alloyItem3',
        'alloyItem4',
        'alloyItem5',
        'alloyItem6',
        'alloyItem7',
      ],
    },
  ]
  return groups.map((g) => ({
    name: g.name,
    items: g.keys.map((k) => all.find((i) => i.key === k)).filter(Boolean),
  }))
})

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

function switchCat(cat) {
  activeCat.value = cat
}
</script>

<style scoped>
.profile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.profile-modal {
  background: #121824;
  border: 1px solid #1e2a3a;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  overflow-y: auto;
}
.profile-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 20px 20px 0;
  position: relative;
}
.profile-title {
  font-size: 20px;
  font-weight: 700;
  color: #e8edf5;
  margin: 0;
}
.profile-desc {
  color: #6b7a8f;
  font-size: 13px;
}
.profile-close {
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
.profile-close:hover {
  color: #fff;
  background: #1a2235;
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
</style>
