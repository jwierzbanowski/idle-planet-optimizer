<template>
  <div class="profile-overlay"
@click.self="$emit('close')">
    <div class="profile-modal">
      <div class="profile-header">
        <h2 class="profile-title">Profile</h2>
        <label class="global-mine-toggle">
          <span class="profile-desc">Global Mine Speed ×1.2</span>
          <button
            class="toggle-btn"
            :class="{ active: getRawSetting('station', 'miningGlobal') }"
            title="Global mine speed ×1.2"
            @click="toggleMiningGlobal()"
          >
            <span class="toggle-knob" />
          </button>
        </label>
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
        <template v-else-if="activeCat === 'station'">
          <div v-for="group in stationGroups"
 :key="group.name" class="station-group">
            <template v-for="row in group.rows"
  :key="row.item ? row.item.key : row.type + row.label">
              <div v-if="row.type === 'title'"
  class="project-group-title">{{ row.label }}</div>
              <div v-else-if="row.type === 'subtitle'"
  class="station-subtitle">{{ row.label }}</div>
              <div v-else
  class="settings-row" :class="{ 'prev-best-row': recFor(row.item.key) }">
                <span class="settings-label">{{ row.item.label }}</span>
                <div class="settings-info">
                  <span v-if="row.item.desc"
  class="settings-desc">{{ row.item.desc }}</span>
                </div>
                <span v-if="recFor(row.item.key)"
  class="prev-best-label"><Star :size="11" fill="currentColor" />Recommended</span>
                <template v-if="isNumeric(row.item)">
                  <div class="star-controls">
                    <button
                      class="star-btn"
                      title="Ctrl: +5, Shift: +10, Ctrl+Shift: +50"
                      :disabled="getVal(row.item.key) <= 0"
                      @click="change(row.item.key, -1, $event)"
                    >
                      {{ minusLabel }}
                    </button>
                    <span class="star-count"
                      >{{ getVal(row.item.key)
                      }}{{ row.item.maxLevel != null ? '/' + row.item.maxLevel : '' }}</span
                    >
                    <button
                      class="star-btn"
                      title="Ctrl: +5, Shift: +10, Ctrl+Shift: +50"
                      :disabled="row.item.maxLevel != null && getVal(row.item.key) >= row.item.maxLevel"
                      @click="change(row.item.key, 1, $event)"
                    >
                      {{ plusLabel }}
                    </button>
                  </div>
                  <span class="settings-effect"
  style="color: #4caf50">
                    <template v-if="row.item.perLevel != null">
                      <template v-if="getVal(row.item.key) > 0">
                        <template v-if="row.item.kind === 'reduce'"
                          >-{{ (row.item.perLevel * getVal(row.item.key)).toFixed(1) }}%</template
                        >
                        <template v-else>{{ (1 + row.item.perLevel * getVal(row.item.key)).toFixed(2) }}×</template>
                      </template>
                      <template v-else>{{ row.item.kind === 'reduce' ? '-0.0%' : '0×' }}</template>
                    </template>
                  </span>
                </template>
                <template v-else>
                  <button
                    class="toggle-btn"
                    :class="{ active: getVal(row.item.key) }"
                    @click="toggleItem(row.item.key)"
                  >
                    <span class="toggle-knob" />
                  </button>
                </template>
              </div>
            </template>
          </div>
        </template>
        <template v-else-if="activeCat === 'beacon'">
          <template v-if="currentConfig.length === 0">
            <div class="settings-empty">No settings yet</div>
          </template>
          <div v-else class="beacon-grid">
            <div v-for="item in currentConfig"
 :key="item.key" class="settings-row">
              <span class="settings-label">{{ item.label }}</span>
              <div class="settings-info">
                <span v-if="item.desc"
 class="settings-desc">{{ item.desc }}</span>
              </div>
              <template v-if="isNumeric(item)">
                <div class="star-controls">
                  <button
                    class="star-btn"
                    title="Ctrl: +5, Shift: +10, Ctrl+Shift: +50"
                    :disabled="getVal(item.key) <= 0"
                    @click="change(item.key, -1, $event)"
                  >
                    {{ minusLabel }}
                  </button>
                  <span class="star-count"
                    >{{ getVal(item.key)
                    }}{{ item.maxLevel != null ? '/' + item.maxLevel : '' }}</span
                  >
                  <button
                    class="star-btn"
                    title="Ctrl: +5, Shift: +10, Ctrl+Shift: +50"
                    :disabled="item.maxLevel != null && getVal(item.key) >= item.maxLevel"
                    @click="change(item.key, 1, $event)"
                  >
                    {{ plusLabel }}
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
            <span class="settings-label">{{ item.label }}</span>
            <div class="settings-info">
              <span v-if="item.desc"
 class="settings-desc">{{ item.desc }}</span>
            </div>
              <template v-if="isNumeric(item)">
                <div class="star-controls">
                  <button
                    class="star-btn"
                    title="Ctrl: +5, Shift: +10, Ctrl+Shift: +50"
                    :disabled="getVal(item.key) <= 0"
                    @click="change(item.key, -1, $event)"
                  >
                    {{ minusLabel }}
                  </button>
                  <span class="star-count"
                    >{{ getVal(item.key)
                    }}{{ item.maxLevel != null ? '/' + item.maxLevel : '' }}</span
                  >
                  <button
                    class="star-btn"
                    title="Ctrl: +5, Shift: +10, Ctrl+Shift: +50"
                    :disabled="item.maxLevel != null && getVal(item.key) >= item.maxLevel"
                    @click="change(item.key, 1, $event)"
                  >
                    {{ plusLabel }}
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
import { useGame } from '../composables/useGame'
import { useModifierKeys } from '../composables/useModifierKeys'
import { useSettings } from '../composables/useSettings'
import { SETTINGS_CONFIG, STATION_GROUPS } from '../utils/config'
import { getStationRecommendations } from '../utils/calc'
import { Star } from '@lucide/vue'
import ManagerCard from './ManagerCard.vue'

defineEmits(['close'])

const { getRawSetting, setSetting } = useProfile()
const { settings } = useSettings()
const {
  getManagers,
  addManager,
  removeManager,
  updateManagerStars,
  updateManagerPrimarySkill,
  updateManagerSecondarySkill,
} = useGame()

const activeCat = ref('rooms')
const categories = [
  { key: 'rooms', label: 'Rooms' },
  { key: 'station', label: 'Station' },
  { key: 'beacon', label: 'Beacon' },
  { key: 'managers', label: 'Managers' },
]

const managers = computed(() => getManagers())

const { multiplier } = useModifierKeys()

const plusLabel = computed(() => (multiplier.value === 1 ? '+' : '+' + multiplier.value))
const minusLabel = computed(() => (multiplier.value === 1 ? '−' : '−' + multiplier.value))

const currentConfig = computed(() => SETTINGS_CONFIG[activeCat.value] || [])

const stationGroups = computed(() => {
  const all = SETTINGS_CONFIG.station
  if (!all) return []
  return STATION_GROUPS.map((g) => {
    const rows = []
    rows.push({ type: 'title', label: g.name })
    const subs = Array.isArray(g.subsections) && g.subsections.length
      ? g.subsections.map((s) => ({ name: s.name, keys: s.keys }))
      : Array.isArray(g.keys) && g.keys.length
        ? [{ name: null, keys: g.keys }]
        : []
    for (const s of subs) {
      if (s.name) rows.push({ type: 'subtitle', label: s.name })
      for (const k of s.keys) {
        const item = all.find((i) => i.key === k)
        if (item) rows.push({ type: 'row', item })
      }
    }
    return { name: g.name, rows }
  })
})

const stationRecByKey = computed(() => {
  const map = {}
  for (const r of getStationRecommendations(settings)) map[r.key] = r
  return map
})

function recFor(key) {
  return stationRecByKey.value[key] || null
}

function isNumeric(item) {
  return item.maxLevel != null || item.perLevel != null
}

function getVal(key) {
  return getRawSetting(activeCat.value, key)
}

function change(key, delta, event) {
  let m = 1
  if (event?.ctrlKey) m = 5
  if (event?.shiftKey) m = 10
  if (event?.ctrlKey && event?.shiftKey) m = 50
  const current = getRawSetting(activeCat.value, key)
  setSetting(activeCat.value, key, current + delta * m)
}

function toggleItem(key) {
  const current = getRawSetting(activeCat.value, key)
  setSetting(activeCat.value, key, current ? 0 : 1)
}

function toggleMiningGlobal() {
  const current = getRawSetting('station', 'miningGlobal')
  setSetting('station', 'miningGlobal', current ? 0 : 1)
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
  width: 95%;
  max-width: 1000px;
  max-height: 92vh;
  overflow-y: auto;
}
.profile-header {
  display: flex;
  align-items: center;
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
.global-mine-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 4px;
  cursor: pointer;
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
.station-group .settings-row {
  position: relative;
}
.station-subtitle {
  font-size: 10px;
  color: #55637a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 6px 4px 2px;
}
.station-subtitle:not(:first-child) {
  margin-top: 2px;
  border-top: 1px solid #16202e;
}
.station-group .prev-best-row {
  background: rgba(30, 136, 229, 0.08);
  box-shadow: inset 0 0 0 1px rgba(79, 195, 247, 0.45);
}
.prev-best-label {
  position: absolute;
  top: 1px;
  right: 1px;
  display: inline-flex;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  color: #64b5f6;
  font-weight: 400;
  letter-spacing: 0.2px;
  background: rgba(30, 136, 229, 0.15);
  border-radius: 3px;
  padding: 2px 8px;
  line-height: 1;
}
.prev-best-label svg {
  flex-shrink: 0;
  display: block;
}
.station-group .project-group-title {
  padding: 0 4px;
}
.beacon-grid {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  align-items: start;
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
</style>
