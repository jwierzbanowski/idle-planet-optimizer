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
        <template v-else-if="activeCat === 'badges'">
          <div class="badge-subcats">
            <button
              v-for="cat in badgeCats"
              :key="cat.key"
              class="settings-cat"
              :class="{ active: activeBadge === cat.key }"
              @click="activeBadge = cat.key"
            >
              {{ cat.label }} <span class="count">({{ badgeList[cat.key].length }})</span>
            </button>
          </div>
          <div class="badge-cols">
            <div v-for="id in badgeList[activeBadge]"
  :key="id" class="badge-row">
              <span class="settings-label">{{ badgeName(id) }}</span>
              <StarControls
                :model-value="getStars(id)"
                @update:model-value="setOverride(id, 'stars', $event)"
              />
            </div>
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
        <template v-else-if="activeCat === 'ships'">
          <div class="ship-list">
            <div v-for="ship in ships"
  :key="ship.key" class="ship-row">
              <button
                class="toggle-btn"
                :class="{ active: getVal(ship.key) }"
                @click="toggleItem(ship.key)"
              >
                <span class="toggle-knob" />
              </button>
              <div class="ship-info">
                <div class="ship-name">{{ ship.label }}</div>
                <div class="ship-bonus">
                  <div v-for="(b, i) in shipBonuses(ship)"
  :key="i">{{ b }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="activeCat === 'modules'">
          <div
            v-for="cat in moduleCats"
            :key="cat.key"
            class="module-slot-card"
            :class="{ 'module-slot-card-disabled': moduleCategoryDisabled(cat.key) }"
          >
            <div class="module-slot-title">{{ cat.label }}</div>
            <div v-if="moduleCategoryDisabled(cat.key)" class="module-slot-disabled-note">
              Not available for calculation
            </div>
            <label class="module-special-toggle">
              <input
                type="checkbox"
                :checked="moduleSlot(cat.key).special"
                :disabled="moduleCategoryDisabled(cat.key)"
                @change="setModuleField(cat.key, 'special', $event.target.checked)"
              />
              <span>Special (S)</span>
            </label>
            <select
              v-if="moduleSlot(cat.key).special"
              class="module-select"
              :value="moduleSlot(cat.key).module"
              :disabled="moduleCategoryDisabled(cat.key)"
              @change="setModuleField(cat.key, 'module', $event.target.value)"
            >
              <option value="" disabled>— choose module —</option>
              <option v-for="m in modulesFor(cat.key)" :key="m.key" :value="m.key">
                {{ m.label }}
              </option>
            </select>
            <div v-else class="module-regular">Regular</div>
            <select
              class="module-select"
              :value="moduleSlot(cat.key).rarity"
              :disabled="moduleCategoryDisabled(cat.key)"
              :style="rarityStyle(moduleSlot(cat.key).rarity)"
              @change="setModuleField(cat.key, 'rarity', $event.target.value)"
            >
              <option value="" disabled>— rarity —</option>
              <option
                v-for="r in raritiesFor(moduleSlot(cat.key))"
                :key="r.key"
                :value="r.key"
                :style="{ color: r.color }"
              >
                {{ r.label }}
              </option>
            </select>
            <div class="star-controls">
              <button
                class="star-btn"
                title="Ctrl: +5, Shift: +10, Ctrl+Shift: +50"
                :disabled="moduleCategoryDisabled(cat.key) || moduleSlot(cat.key).level <= 0"
                @click="changeModuleLevel(cat.key, -1, $event)"
              >
                {{ minusLabel }}
              </button>
              <span class="star-count">{{ moduleSlot(cat.key).level }}/{{ MAX_MODULE_LEVEL }}</span>
              <button
                class="star-btn"
                title="Ctrl: +5, Shift: +10, Ctrl+Shift: +50"
                :disabled="moduleLevelDisabled(cat.key, 1)"
                @click="changeModuleLevel(cat.key, 1, $event)"
              >
                {{ plusLabel }}
              </button>
            </div>
            <div class="module-mult">
              <span class="settings-desc">{{ moduleMultLabel(cat) }}</span>
              <span class="settings-effect">{{ moduleMultPreview(cat.key) }}</span>
            </div>
            <div v-if="moduleEffectSegments(cat.key).length" class="module-effect-text">
              <template v-for="(seg, i) in moduleEffectSegments(cat.key)" :key="i">
                <span v-if="seg.value" class="module-effect-value">{{ seg.text }}</span>
                <template v-else>{{ seg.text }}</template>
              </template>
            </div>
            <div v-if="moduleSlot(cat.key).module" class="module-substats">
              <div class="module-substats-title">Substats</div>
              <div
                v-for="slotIndex in MAX_MODULE_SUBSTATS"
                :key="slotIndex - 1"
                class="module-substat-row"
                :class="{
                  'module-substat-row-empty': !substatSlotEntry(cat.key, slotIndex - 1),
                  'module-substat-row-locked': !substatSlotUnlocked(cat.key, slotIndex - 1),
                }"
              >
                <button
                  class="module-substat-main"
                  :disabled="
                    moduleCategoryDisabled(cat.key) || !substatSlotUnlocked(cat.key, slotIndex - 1)
                  "
                  :title="substatSlotTitle(cat.key, slotIndex - 1)"
                  @click="openSubstatDialog(cat.key, slotIndex - 1)"
                >
                  <template v-if="substatSlotEntry(cat.key, slotIndex - 1)">
                    <span class="module-substat-label">{{
                      substatSlotEntry(cat.key, slotIndex - 1).label
                    }}</span>
                    <span
                      class="module-substat-value"
                      :style="{ color: substatSlotEntry(cat.key, slotIndex - 1).color }"
                      >{{ substatSlotEntry(cat.key, slotIndex - 1).value }}</span
                    >
                  </template>
                  <span v-else class="module-substat-placeholder">{{
                    substatSlotHint(cat.key, slotIndex - 1)
                  }}</span>
                </button>
                <button
                  v-if="substatSlotEntry(cat.key, slotIndex - 1)"
                  class="module-substat-remove"
                  title="Remove substat"
                  :disabled="
                    moduleCategoryDisabled(cat.key) || !substatSlotUnlocked(cat.key, slotIndex - 1)
                  "
                  @click="setModuleSubstat(cat.key, slotIndex - 1, '', '')"
                >
                  &times;
                </button>
              </div>
            </div>
            <button
              class="module-clear"
              :disabled="moduleCategoryDisabled(cat.key)"
              @click="clearModuleSlot(cat.key)"
            >
              Clear slot
            </button>
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
    <div v-if="substatDialog.open" class="substat-dialog-overlay" @click.self="closeSubstatDialog">
      <div class="substat-dialog">
        <div class="substat-dialog-header">
          <span class="substat-dialog-title">
            Add substat #{{ substatDialogSlotNumber }} — {{ substatDialogCat }}
          </span>
          <button class="substat-dialog-close" @click="closeSubstatDialog">&times;</button>
        </div>
        <div v-if="substatDialogRarities.length" class="substat-dialog-filters">
          <button
            v-for="r in substatDialogRarities"
            :key="r.key"
            class="substat-filter"
            :class="{ active: substatFilterActive(r.key) }"
            :style="{ '--rarity-color': r.color }"
            @click="toggleSubstatFilter(r.key)"
          >
            {{ r.label }}
          </button>
        </div>
        <div class="substat-dialog-list">
          <button
            v-for="(o, i) in substatDialogOptions"
            :key="o.statKey + o.rarity + i"
            class="substat-option"
            @click="chooseSubstat(o.statKey, o.rarity)"
          >
            <span class="substat-option-label">{{ o.label }}</span>
            <span class="substat-option-variant" :style="{ color: o.color }">{{ o.value }}</span>
          </button>
        </div>
        <div v-if="substatDialogOptions.length === 0" class="substat-dialog-empty">
          No more substats available.
        </div>
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
import { useData } from '../composables/useData'
import { useOverrides } from '../composables/useOverrides'
import { getEntity } from '../utils/registry'
import {
  SETTINGS_CONFIG,
  STATION_GROUPS,
  SHIPS,
  MAX_MODULE_LEVEL,
  MAX_MODULE_SUBSTATS,
  SUBSTAT_SLOT_THRESHOLDS,
  MODULE_CATEGORY_KEYS,
  SPECIAL_RARITIES,
  DISABLED_MODULE_CATEGORIES,
} from '../utils/config'
import { getStationRecommendations, getModuleLevelMult } from '../utils/calc'
import { Star } from '@lucide/vue'
import ManagerCard from './ManagerCard.vue'
import StarControls from './StarControls.vue'

defineEmits(['close'])

const {
  getRawSetting,
  setSetting,
  getModuleSlots,
  setModuleSlot,
  clearModuleSlot,
  setModuleSubstat,
} = useProfile()
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
  { key: 'badges', label: 'Badges' },
  { key: 'ships', label: 'Ships' },
  { key: 'modules', label: 'Modules' },
]

const { ORDER, MODULES } = useData()
const { getStars, setOverride } = useOverrides()

const activeBadge = ref('ores')
const badgeCats = [
  { key: 'ores', label: 'Ores' },
  { key: 'alloys', label: 'Alloys' },
  { key: 'items', label: 'Items' },
]

const badgeList = computed(() => ({
  ores: ORDER.value.ores,
  alloys: ORDER.value.alloys,
  items: ORDER.value.items,
}))

function badgeName(id) {
  return getEntity(id)?.name || id
}

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

const ships = SHIPS

function shipBonuses(ship) {
  return ship.bonuses.map((b) => b.label + (b.mult != null ? ' ×' + b.mult : ''))
}

function toggleMiningGlobal() {
  const current = getRawSetting('station', 'miningGlobal')
  setSetting('station', 'miningGlobal', current ? 0 : 1)
}

const moduleCats = computed(() => {
  const cats = MODULES.value?.categories
  if (cats && cats.length) return cats
  return MODULE_CATEGORY_KEYS.map((k) => ({ key: k, label: k[0].toUpperCase() + k.slice(1) }))
})

function modulesFor(catKey) {
  return (MODULES.value?.modules || []).filter((m) => m.category === catKey)
}

function moduleCategoryDisabled(catKey) {
  return DISABLED_MODULE_CATEGORIES.includes(catKey)
}

function moduleLevelDisabled(catKey, dir) {
  if (moduleCategoryDisabled(catKey)) return true
  const level = moduleSlot(catKey).level
  return dir < 0 ? level <= 0 : level >= MAX_MODULE_LEVEL
}

function raritiesFor(slot) {
  const all = MODULES.value?.rarities || []
  if (!slot.special) return all
  return all.filter((r) => SPECIAL_RARITIES.includes(r.key))
}

function moduleSlot(catKey) {
  return getModuleSlots()[catKey]
}

function setModuleField(catKey, field, value) {
  const slot = moduleSlot(catKey)
  if (field === 'special' && value && !slot.module) {
    const first = modulesFor(catKey)[0]
    if (first) setModuleSlot(catKey, 'module', first.key)
  }
  const hadModule = Boolean(slot.module)
  setModuleSlot(catKey, field, value)
  const current = moduleSlot(catKey)
  if (field === 'special') {
    setModuleSlot(catKey, 'rarity', value ? 'epic' : 'common')
  } else if (!hadModule && current.module && !current.rarity) {
    setModuleSlot(catKey, 'rarity', current.special ? 'epic' : 'common')
  }
  if (!hadModule && current.module && current.level === 0) {
    setModuleSlot(catKey, 'level', 1)
  }
}

function changeModuleLevel(catKey, delta, event) {
  let m = 1
  if (event?.ctrlKey) m = 5
  if (event?.shiftKey) m = 10
  if (event?.ctrlKey && event?.shiftKey) m = 50
  const current = moduleSlot(catKey).level
  setModuleSlot(catKey, 'level', current + delta * m)
}

function moduleMultPreview(catKey) {
  const slot = moduleSlot(catKey)
  if (!slot.rarity || slot.level <= 0) return '—'
  const mult = getModuleLevelMult(MODULES.value, catKey, slot.rarity, slot.level)
  return mult != null ? mult.toFixed(3) + '×' : '—'
}

function moduleMultLabel(cat) {
  return cat.stat || ''
}

function renderEffectSegments(template, fill) {
  const segments = []
  const re = /\{([a-z]+)\}/g
  let last = 0
  let match
  while ((match = re.exec(template)) !== null) {
    if (match.index > last) {
      segments.push({ text: template.slice(last, match.index), value: false })
    }
    const val = typeof fill === 'string' ? fill : fill[match[1]]
    if (val != null && val !== '') {
      segments.push({ text: val, value: match[1] !== 'intro' })
    }
    last = match.index + match[0].length
  }
  if (last < template.length) {
    segments.push({ text: template.slice(last), value: false })
  }
  return segments
}

function moduleEffectSegments(catKey) {
  const slot = moduleSlot(catKey)
  if (!slot.special || !slot.module || !slot.rarity) return []
  const mod = (MODULES.value?.modules || []).find((m) => m.key === slot.module)
  if (!mod || !mod.effects) return []
  const tier = slot.rarity.endsWith('+') ? slot.rarity.slice(0, -1) : slot.rarity
  const effects = mod.effects
  const tierEntry = effects[tier]
  if (tierEntry && typeof tierEntry === 'object') {
    return renderEffectSegments(tierEntry.template, tierEntry.values)
  }
  if (effects.template) {
    return renderEffectSegments(effects.template, effects.values[tier])
  }
  return tierEntry ? [{ text: tierEntry, value: false }] : []
}

const BASE_RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic', 'ancestral']

function baseRarity(rarityKey) {
  return rarityKey && rarityKey.endsWith('+') ? rarityKey.slice(0, -1) : rarityKey
}

function rarityIndex(rarityKey) {
  return BASE_RARITIES.indexOf(baseRarity(rarityKey))
}

function rarityColor(rarityKey) {
  const r = (MODULES.value?.rarities || []).find((x) => x.key === baseRarity(rarityKey))
  return r?.color || ''
}

function rarityStyle(rarityKey) {
  const color = rarityColor(rarityKey)
  return color ? { color } : null
}

function substatMinIndex(stat) {
  return Math.min(...Object.keys(stat.values).map((k) => rarityIndex(k)))
}

function substatOptions(catKey) {
  const slot = moduleSlot(catKey)
  const cap = slot.rarity ? rarityIndex(slot.rarity) : BASE_RARITIES.length - 1
  return (MODULES.value?.substats?.[catKey] || [])
    .filter((s) => substatMinIndex(s) <= cap)
    .sort((a, b) => substatMinIndex(a) - substatMinIndex(b))
}

function selectedSubstatPairs(catKey) {
  const slot = moduleSlot(catKey)
  return new Set(
    (slot.substats || [])
      .filter((s) => s?.key)
      .map((s) => s.key + '|' + (s.rarity || baseRarity(slot.rarity) || ''))
  )
}

function formatSubstatValue(value) {
  if (value == null) return '—'
  if (typeof value === 'string') return value
  if (value >= 1) return Number(value.toFixed(3)) + '×'
  return Math.round(value * 1000) / 10 + '%'
}

function rarityLabel(rarityKey) {
  const r = (MODULES.value?.rarities || []).find((x) => x.key === rarityKey)
  return r?.label || rarityKey
}

function substatSlotEntry(catKey, index) {
  const slot = moduleSlot(catKey)
  const entry = slot.substats?.[index]
  if (!entry || !entry.key) return null
  const stat = (MODULES.value?.substats?.[catKey] || []).find((s) => s.key === entry.key)
  if (!stat) return null
  const rarity = entry.rarity || (slot.rarity ? baseRarity(slot.rarity) : null)
  const statValue = rarity ? (stat.values[rarity] ?? null) : null
  return {
    index,
    key: entry.key,
    label: stat.label,
    color: entry.rarity ? rarityColor(entry.rarity) : '',
    value: formatSubstatValue(statValue),
  }
}

function rarityRank(rarityKey) {
  const rarities = MODULES.value?.rarities || []
  const idx = rarities.findIndex((r) => r.key === rarityKey)
  return idx >= 0 ? idx : -1
}

function substatSlotRequirement(index) {
  return SUBSTAT_SLOT_THRESHOLDS[index - 2] || null
}

function substatSlotUnlocked(catKey, index) {
  const t = substatSlotRequirement(index)
  if (!t) return true
  const slot = moduleSlot(catKey)
  if (!slot.rarity || slot.level < t.minLevel) return false
  return rarityRank(slot.rarity) >= rarityRank(t.minRarity)
}

function substatSlotTitle(catKey, index) {
  const t = substatSlotRequirement(index)
  if (!t || substatSlotUnlocked(catKey, index)) return ''
  return 'Requires level ' + t.minLevel + ' and ' + t.label + ' rarity'
}

function substatSlotHint(catKey, index) {
  const t = substatSlotRequirement(index)
  if (!t || substatSlotUnlocked(catKey, index)) return '+ Add substat'
  return 'Locked · Lv ' + t.minLevel + ' · ' + t.label
}

const substatDialog = ref({ open: false, cat: null, index: 0 })
const substatDialogFilter = ref([])

const substatDialogSlotNumber = computed(() => substatDialog.value.index + 1)

const substatDialogCat = computed(() => {
  const cat = moduleCats.value.find((c) => c.key === substatDialog.value.cat)
  return cat?.label || ''
})

const substatDialogRarities = computed(() => {
  const cat = substatDialog.value.cat
  const slot = cat ? moduleSlot(cat) : null
  const cap = slot?.rarity ? rarityIndex(slot.rarity) : BASE_RARITIES.length - 1
  const out = []
  for (let i = 0; i <= cap; i++) {
    const key = BASE_RARITIES[i]
    out.push({ key, label: rarityLabel(key), color: rarityColor(key) })
  }
  return out
})

const substatDialogOptions = computed(() => {
  const cat = substatDialog.value.cat
  if (!cat) return []
  const slot = moduleSlot(cat)
  const cap = slot.rarity ? rarityIndex(slot.rarity) : BASE_RARITIES.length - 1
  const filter = substatDialogFilter.value
  const selected = selectedSubstatPairs(cat)
  const out = []
  for (const stat of substatOptions(cat)) {
    const min = Math.min(substatMinIndex(stat), cap)
    for (let i = min; i <= cap; i++) {
      const rarity = BASE_RARITIES[i]
      const value = stat.values[rarity]
      if (value == null) continue
      if (filter.length && !filter.includes(rarity)) continue
      if (selected.has(stat.key + '|' + rarity)) continue
      out.push({
        statKey: stat.key,
        label: stat.label,
        rarity,
        rarityLabel: rarityLabel(rarity),
        color: rarityColor(rarity),
        value: formatSubstatValue(value),
      })
    }
  }
  return out
})

function substatFilterActive(rarity) {
  return substatDialogFilter.value.includes(rarity)
}

function toggleSubstatFilter(rarity) {
  substatDialogFilter.value = substatFilterActive(rarity) ? [] : [rarity]
}

function openSubstatDialog(catKey, index) {
  substatDialog.value = { open: true, cat: catKey, index }
  const slot = moduleSlot(catKey)
  substatDialogFilter.value = slot?.rarity ? [baseRarity(slot.rarity)] : []
}

function closeSubstatDialog() {
  substatDialog.value = { open: false, cat: null, index: 0 }
  substatDialogFilter.value = []
}

function chooseSubstat(statKey, rarity) {
  const catKey = substatDialog.value.cat
  if (catKey) setModuleSubstat(catKey, substatDialog.value.index, statKey, rarity)
  closeSubstatDialog()
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

.badge-subcats {
  grid-column: 1 / -1;
  display: flex;
  gap: 4px;
  padding: 0 4px;
}
.badge-subcats .settings-cat .count {
  color: #6b7a8f;
  font-size: 11px;
  margin-left: 4px;
  font-weight: 400;
}
.badge-subcats .settings-cat.active .count {
  color: rgba(255, 255, 255, 0.6);
}
.badge-cols {
  grid-column: 1 / -1;
  columns: 4;
  column-gap: 8px;
}
.badge-row {
  break-inside: avoid;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  background: #0d1520;
  border-radius: 6px;
  padding: 8px 12px;
  border: 1px solid #1a2235;
}
.badge-row .settings-label {
  grid-column: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.badge-row .star-controls {
  margin-top: 0;
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

.ship-list {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  align-items: start;
}
.ship-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 25%;
  background: #0d1520;
  border-radius: 6px;
  padding: 8px 12px;
  border: 1px solid #1a2235;
}
.ship-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.ship-name {
  color: #e8edf5;
  font-weight: 600;
  font-size: 14px;
}
.ship-bonus {
  color: #8fa1b8;
  font-size: 12px;
}

.module-slot-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #0d1520;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #1a2235;
}
.module-slot-title {
  color: #e8edf5;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.module-special-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #c8d0dc;
  font-size: 13px;
  cursor: pointer;
}
.module-special-toggle input {
  accent-color: #1e88e5;
  cursor: pointer;
}
.module-select {
  width: 100%;
  background: #121824;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #c8d0dc;
  font-size: 13px;
  padding: 6px 8px;
  cursor: pointer;
}
.module-select option {
  background: #0d1520;
  color: #c8d0dc;
}
.module-slot-card-disabled {
  opacity: 0.55;
  border-color: #141c2a;
  background: #0b1119;
}
.module-slot-card-disabled .module-slot-title,
.module-slot-card-disabled .module-special-toggle span,
.module-slot-card-disabled .module-select,
.module-slot-card-disabled .module-regular,
.module-slot-card-disabled .star-count,
.module-slot-card-disabled .module-mult,
.module-slot-card-disabled .module-effect-text,
.module-slot-card-disabled .module-substats-title,
.module-slot-card-disabled .module-substat-label,
.module-slot-card-disabled .module-substat-value,
.module-slot-card-disabled .module-substat-placeholder {
  text-decoration: line-through;
}
.module-slot-disabled-note {
  color: #6b7a8f;
  font-size: 11px;
  margin-bottom: 8px;
}
.module-regular {
  width: 100%;
  background: #121824;
  border: 1px dashed #2a3a4a;
  border-radius: 4px;
  color: #6b7a8f;
  font-size: 13px;
  padding: 6px 8px;
}
.module-mult {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.module-effect-text {
  color: #8fa1b8;
  font-size: 11px;
  line-height: 1.5;
  border-top: 1px solid #1a2235;
  padding-top: 8px;
}
.module-effect-value {
  color: #4caf50;
  font-weight: 600;
}
.module-substats {
  border-top: 1px solid #1a2235;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.module-substats-title {
  font-size: 10px;
  color: #55637a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.module-substat-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  border: 1px solid #1a2235;
  border-radius: 6px;
  background: #0d1520;
}
.module-substat-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 32px 10px 12px;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}
.module-substat-main:disabled {
  cursor: not-allowed;
}
.module-substat-row-empty:not(.module-substat-row-locked) {
  border-style: dashed;
  border-color: #2a3a4a;
}
.module-substat-row-empty:not(.module-substat-row-locked):hover {
  border-color: #4fc3f7;
  background: rgba(79, 195, 247, 0.05);
}
.module-substat-row-locked {
  border-color: #141c2a;
  opacity: 0.55;
}
.module-substat-label {
  flex: 1;
  min-width: 0;
  color: #c8d0dc;
  font-size: 12px;
  line-height: 1.4;
}
.module-substat-value {
  font-size: 12px;
  font-weight: 600;
  min-width: 0;
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
}
.module-substat-placeholder {
  flex: 1;
  color: #4fc3f7;
  font-size: 12px;
}
.module-substat-row-locked .module-substat-placeholder {
  color: #6b7a8f;
}
.module-substat-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  background: transparent;
  color: #6b7a8f;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.module-substat-remove:hover {
  border-color: #ef5350;
  color: #ef5350;
}
.substat-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.substat-dialog {
  background: #121824;
  border: 1px solid #2a3a4a;
  border-radius: 12px;
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.substat-dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #1e2a3a;
}
.substat-dialog-title {
  color: #e8edf5;
  font-size: 15px;
  font-weight: 700;
}
.substat-dialog-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #6b7a8f;
  font-size: 22px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.substat-dialog-close:hover {
  color: #fff;
}
.substat-dialog-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px 0;
}
.substat-filter {
  padding: 5px 12px;
  border: 1px solid #2a3a4a;
  border-radius: 20px;
  background: transparent;
  color: #6b7a8f;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.substat-filter:hover {
  border-color: #4fc3f7;
  color: #c8d0dc;
}
.substat-filter.active {
  color: var(--rarity-color, #4fc3f7);
  border-color: var(--rarity-color, #4fc3f7);
  background: rgba(255, 255, 255, 0.04);
}
.substat-dialog-list {
  overflow-y: auto;
  padding: 10px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}
.substat-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid #1a2235;
  border-radius: 6px;
  background: #0d1520;
  color: #c8d0dc;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}
.substat-option:hover {
  border-color: #4fc3f7;
  background: #121824;
}
.substat-option-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.substat-option-variant {
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.substat-dialog-empty {
  padding: 20px;
  text-align: center;
  color: #6b7a8f;
  font-size: 13px;
}
.module-clear {
  padding: 6px 8px;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  background: transparent;
  color: #ef5350;
  font-size: 12px;
  cursor: pointer;
  text-align: center;
}
.module-clear:hover {
  border-color: #ef5350;
  background: rgba(239, 83, 80, 0.1);
}
.module-slot-card-disabled button {
  cursor: not-allowed;
  opacity: 0.45;
  border-color: #2a3a4a;
  color: #6b7a8f;
  background: transparent;
  text-decoration: line-through;
}
.module-slot-card-disabled button:hover,
.module-slot-card-disabled button:active {
  border-color: #2a3a4a;
  color: #6b7a8f;
  background: transparent;
  text-decoration: line-through;
}
</style>
