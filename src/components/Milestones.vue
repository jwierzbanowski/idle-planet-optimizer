<template>
  <div>
    <div class="milestone-tabs">
      <button
        v-for="m in milestones"
        :key="m.key"
        class="milestone-tab"
        :class="{ active: activeMilestone === m.key }"
        @click="activeMilestone = m.key"
      >
        {{ m.label }}
      </button>
    </div>

    <div class="milestone-layout">
      <div class="milestone-projects">
        <div v-if="loading" class="loading">
          <div class="spinner" />
          <div>Loading projects...</div>
        </div>
        <template v-else>
          <div v-for="group in groupedProjects" :key="group.category" class="project-group">
            <div class="group-header">
              <input
                type="checkbox"
                class="group-check"
                :ref="(el) => { if (el) el.indeterminate = groupIndeterminate(group.category) }"
                :checked="groupAllChecked(group.category)"
                @click.stop
                @change="toggleGroupAll(group)"
              />
              <button class="group-header-btn" @click="toggleGroup(group.category)">
                <span class="group-arrow">{{ collapsedGroups[groupKey(group.category)] ? '▸' : '▾' }}</span>
                <span class="group-name">{{ group.label }}</span>
                <span class="group-count">{{ groupCounts[group.category]?.done ?? 0 }}/{{ group.projects.length }}</span>
              </button>
            </div>
            <div v-show="!collapsedGroups[groupKey(group.category)]" class="group-projects">
              <div
                v-for="proj in group.projects"
                :key="proj.key"
                class="project-row"
                :class="{ 'project-done': isDone(proj.key) }"
              >
                <label class="project-check-label">
                  <input
                    type="checkbox"
                    class="project-check"
                    :checked="isDone(proj.key)"
                    @change="toggleProject(proj)"
                  />
                  <span class="project-name">{{ proj.name }}</span>
                </label>
                <div v-if="!isDone(proj.key)" class="project-cost-list">
                  <div v-for="(c, i) in proj.cost" :key="i" class="project-cost-item">
                    {{ fmtQty(labQty(c)) }} {{ costName(c.id) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="milestone-debris">
        <div class="debris-header">Debris</div>
        <div class="debris-note">Step min: 1K &middot; Ctrl: 5K &middot; Shift: 10K &middot; Both: 50K</div>
        <template v-if="debrisAlloys.length || debrisItems.length">
          <div class="debris-section">
            <div class="debris-section-title">Alloys ({{ fmtQty(debrisAlloyCount) }})</div>
            <div v-for="a in debrisAlloys" :key="a.id" class="debris-row">
              <span class="debris-name">{{ a.name }}</span>
              <span class="debris-qty" :class="deficitClass(a.id, a.qty)">{{ fmtQty(a.qty) }}</span>
              <span
                v-if="a.sources && a.sources.length"
                class="debris-info-icon"
                @click.stop="showDebrisTooltip($event, a.id, a.sources)"
              >i</span>
              <div class="debris-owned">
                <button class="debris-owned-btn" @click="addOwned(a.id, $event, -1)">{{ minusLabel }}</button>
                <input
                  type="text"
                  class="debris-owned-input"
                  :value="fmtQty(ownedAmount(a.id))"
                  @input="setOwned(a.id, $event.target.value)"
                />
                <button class="debris-owned-btn" @click="addOwned(a.id, $event, 1)">{{ plusLabel }}</button>
              </div>
            </div>
          </div>
          <div class="debris-section">
            <div class="debris-section-title">Items ({{ fmtQty(debrisItemCount) }})</div>
            <div v-for="it in debrisItems" :key="it.id" class="debris-row">
              <span class="debris-name">{{ it.name }}</span>
              <span class="debris-qty" :class="deficitClass(it.id, it.qty)">{{ fmtQty(it.qty) }}</span>
              <span
                v-if="it.sources && it.sources.length"
                class="debris-info-icon"
                @click.stop="showDebrisTooltip($event, it.id, it.sources)"
              >i</span>
              <div class="debris-owned">
                <button class="debris-owned-btn" @click="addOwned(it.id, $event, -1)">{{ minusLabel }}</button>
                <input
                  type="text"
                  class="debris-owned-input"
                  :value="fmtQty(ownedAmount(it.id))"
                  @input="setOwned(it.id, $event.target.value)"
                />
                <button class="debris-owned-btn" @click="addOwned(it.id, $event, 1)">{{ plusLabel }}</button>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="debris-empty">
          All projects complete!
        </div>
        <div
          v-if="tooltip.visible"
          class="debris-tooltip"
          :style="{ top: tooltip.top + 'px', left: tooltip.left + 'px' }"
        >
          <template v-for="(line, i) in tooltip.lines" :key="i">
            <div v-if="typeof line === 'string'" class="debris-tooltip-header">{{ line }}</div>
            <div v-else class="debris-tooltip-row" :class="{ 'debris-tooltip-bold': line.bold }">{{ line.text }}</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, shallowRef } from 'vue'
import { useSettings } from '../composables/useSettings'
import { useGame } from '../composables/useGame'
import { getProjectCostLabMod, getDebrisSources } from '../utils/calc'
import { fmtQty } from '../utils/format'
import { DB, getEntity } from '../utils/registry'
import { useModifierKeys } from '../composables/useModifierKeys'

const { settings, managerVersion } = useSettings()
const { game, toggleMilestoneProject, setDebrisOwned } = useGame()
const { multiplier } = useModifierKeys()

const activeMilestone = ref('1B')
const data = shallowRef(null)
const loading = ref(true)
const collapsedGroups = reactive({})

const milestones = computed(() => {
  if (!data.value) return []
  return Object.keys(data.value.milestones).map((k) => ({ key: k, label: k }))
})

const currentProjects = computed(() => {
  if (!data.value) return []
  return data.value.milestones[activeMilestone.value] || []
})

const categories = computed(() => {
  if (!data.value) return {}
  return data.value.categories || {}
})

const groupedProjects = computed(() => {
  const groups = {}
  const order = ['basic', 'telescopes', 'ore_logistics', 'asteroids', 'rovers', 'managers', 'planets', 'production']
  for (const proj of currentProjects.value) {
    const cat = proj.category || 'other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(proj)
  }
  return order
    .filter((cat) => groups[cat])
    .map((cat) => ({
      category: cat,
      label: categories.value[cat] || cat,
      projects: groups[cat],
    }))
})

const groupCounts = computed(() => {
  managerVersion.value
  const counts = {}
  for (const group of groupedProjects.value) {
    let done = 0
    for (const proj of group.projects) {
      if (game.milestoneProjects?.[proj.key]) done++
    }
    counts[group.category] = { done, total: group.projects.length }
  }
  return counts
})

watch(groupCounts, (counts) => {
  for (const [cat, c] of Object.entries(counts)) {
    if (c.done === c.total && c.total > 0) {
      collapsedGroups[groupKey(cat)] = true
    }
  }
}, { deep: true })

const labMod = computed(() => {
  const m = getProjectCostLabMod(settings)
  return m || 1
})

function isDone(key) {
  return !!game.milestoneProjects?.[key]
}

function toggleProject(proj) {
  toggleMilestoneProject(proj.key, proj.gameProjectKey)
}

function costName(id) {
  return DB.value?.ores?.[id]?.name
    || DB.value?.alloys?.[id]?.name
    || DB.value?.items?.[id]?.name
    || id
}

function labQty(cost) {
  if (cost.type === 'diamond') return cost.qty
  return Math.ceil(cost.qty * labMod.value)
}

function toggleGroup(cat) {
  const key = groupKey(cat)
  collapsedGroups[key] = !collapsedGroups[key]
}

function groupKey(cat) {
  return activeMilestone.value + ':' + cat
}

function groupAllChecked(cat) {
  const count = groupCounts.value[cat]
  return count && count.done === count.total && count.total > 0
}

function groupIndeterminate(cat) {
  const count = groupCounts.value[cat]
  return count && count.done > 0 && count.done < count.total
}

function toggleGroupAll(group) {
  const allDone = groupAllChecked(group.category)
  for (const proj of group.projects) {
    if (isDone(proj.key) !== !allDone) {
      toggleProject(proj)
    }
  }
}

const debrisAlloys = computed(() => {
  managerVersion.value
  const projectCosts = []
  for (const proj of currentProjects.value) {
    if (isDone(proj.key)) continue
    for (const c of proj.cost) {
      projectCosts.push({ ...c, projectKey: proj.key, projectName: proj.name })
    }
  }
  if (!projectCosts.length) return []
  const { alloys } = getDebrisSources(projectCosts, settings)
  return Object.entries(alloys)
    .map(([id, data]) => ({
      id,
      name: costName(id),
      qty: data.qty,
      sources: data.sources,
      price: getEntity(id)?.basePrice || 0,
    }))
    .sort((a, b) => a.price - b.price)
})

const debrisItems = computed(() => {
  managerVersion.value
  const projectCosts = []
  for (const proj of currentProjects.value) {
    if (isDone(proj.key)) continue
    for (const c of proj.cost) {
      projectCosts.push({ ...c, projectKey: proj.key, projectName: proj.name })
    }
  }
  if (!projectCosts.length) return []
  const { items } = getDebrisSources(projectCosts, settings)
  return Object.entries(items)
    .map(([id, data]) => ({
      id,
      name: costName(id),
      qty: data.qty,
      sources: data.sources,
      price: getEntity(id)?.basePrice || 0,
    }))
    .sort((a, b) => a.price - b.price)
})

const debrisAlloyCount = computed(() => debrisAlloys.value.reduce((s, a) => s + a.qty, 0))
const debrisItemCount = computed(() => debrisItems.value.reduce((s, i) => s + i.qty, 0))

const tooltip = reactive({ visible: false, top: 0, left: 0, lines: [] })

function showDebrisTooltip(event, id, sources) {
  if (tooltip.visible) {
    tooltip.visible = false
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  const panel = event.currentTarget.closest('.milestone-debris')
  const panelRect = panel.getBoundingClientRect()
  tooltip.top = rect.bottom - panelRect.top + 4
  tooltip.left = rect.left - panelRect.left - 100
  tooltip.lines = sourceTip(sources)
  tooltip.visible = true
}

function ownedAmount(id) {
  return game.debrisOwned?.[id] || 0
}

function setOwned(id, str) {
  const n = parseFloat(str.replace(/[kK]/g, '000').replace(/[^0-9.]/g, ''))
  setDebrisOwned(id, isNaN(n) ? 0 : n)
}

const plusLabel = computed(() => multiplier.value === 1 ? '+' : '+' + fmtQty(1000 * multiplier.value))
const minusLabel = computed(() => multiplier.value === 1 ? '−' : '−' + fmtQty(1000 * multiplier.value))

function addOwned(id, event, sign) {
  const step = 1000 * multiplier.value * sign
  const val = Math.max(0, (ownedAmount(id)) + step)
  setDebrisOwned(id, val)
}

function sourceTip(sources) {
  const direct = {}
  const indirect = {}
  for (const s of sources) {
    if (s.via.length) {
      const name = s.via[0]
      indirect[name] = (indirect[name] || 0) + s.qty
    } else {
      direct[s.projectName] = (direct[s.projectName] || 0) + s.qty
    }
  }
  const lines = []
  if (Object.keys(direct).length) {
    lines.push('Projects:')
    for (const [name, qty] of Object.entries(direct).sort((a, b) => b[1] - a[1])) {
      lines.push({ text: `  ${name} - ${qty}`, bold: true })
    }
  }
  if (Object.keys(indirect).length) {
    lines.push('Via items:')
    for (const [name, qty] of Object.entries(indirect).sort((a, b) => b[1] - a[1])) {
      lines.push({ text: `  ${name} - ${qty}`, bold: false })
    }
  }
  return lines
}

function deficitClass(id, needed) {
  const have = ownedAmount(id)
  if (have >= needed) return 'debris-enough'
  if (have > 0) return 'debris-partial'
  return 'debris-needed'
}

onMounted(async () => {
  try {
    const res = await fetch('data/projects.json')
    data.value = await res.json()
    for (const group of groupedProjects.value) {
      if (groupAllChecked(group.category)) {
        collapsedGroups[groupKey(group.category)] = true
      }
    }
  } catch (e) {
    console.error('Failed to load projects data:', e)
  } finally {
    loading.value = false
  }
})

document.addEventListener('click', (e) => {
  if (!e.target.closest('.debris-info-icon') && !e.target.closest('.debris-tooltip')) {
    tooltip.visible = false
  }
})
</script>

<style>
.milestone-tabs {
  display: inline-flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #121824;
  border-radius: 10px;
  padding: 4px;
}
.milestone-tab {
  padding: 8px 24px;
  border: none;
  background: transparent;
  color: #6b7a8f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}
.milestone-tab:hover {
  color: #c8d0dc;
  background: #1a2235;
}
.milestone-tab.active {
  color: #fff;
  background: #1e88e5;
}

.milestone-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.milestone-projects {
  flex: 1;
  min-width: 0;
}

.milestone-debris {
  width: 350px;
  flex-shrink: 0;
  position: sticky;
  top: 16px;
  background: #0d1520;
  border: 1px solid #1a2235;
  border-radius: 10px;
  padding: 16px;
}

.debris-header {
  font-size: 16px;
  font-weight: 700;
  color: #e8edf5;
  margin-bottom: 12px;
}

.debris-note {
  color: #6b7a8f;
  font-size: 10px;
  margin-bottom: 12px;
}

.debris-section {
  margin-bottom: 14px;
}

.debris-section:last-child {
  margin-bottom: 0;
}

.debris-section-title {
  font-size: 11px;
  font-weight: 700;
  color: #6b7a8f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.debris-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.debris-info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #4fc3f7;
  color: #4fc3f7;
  font-size: 9px;
  font-weight: 700;
  font-style: italic;
  cursor: pointer;
  flex-shrink: 0;
  font-family: 'Times New Roman', serif;
  line-height: 1;
}

.debris-info-icon:hover {
  background: rgba(79, 195, 247, 0.2);
}

.debris-tooltip {
  position: absolute;
  z-index: 50;
  background: #1a2235;
  color: #c8d0dc;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  border: 1px solid #2a3a4a;
  white-space: nowrap;
  pointer-events: none;
  line-height: 1.6;
}

.debris-tooltip-header {
  color: #6b7a8f;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.debris-tooltip-header:first-child {
  margin-top: 0;
}

.debris-tooltip-row {
  color: #6b7a8f;
}

.debris-tooltip-bold {
  color: #e8edf5;
  font-weight: 600;
}

.debris-row:nth-child(odd) {
  background: #121824;
}

.debris-name {
  color: #c8d0dc;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.debris-qty {
  color: #4fc3f7;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 60px;
  text-align: right;
}

.debris-qty.debris-needed {
  color: #ef5350;
}

.debris-qty.debris-partial {
  color: #ff9800;
}

.debris-qty.debris-enough {
  color: #4caf50;
}

.debris-owned {
  display: flex;
  align-items: center;
  gap: 2px;
}

.debris-owned-input {
  width: 56px;
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #6b7a8f;
  font-size: 11px;
  padding: 2px 4px;
  text-align: center;
  outline: none;
}

.debris-owned-input:focus {
  border-color: #4fc3f7;
  color: #c8d0dc;
}

.debris-owned-btn {
  height: 22px;
  min-width: 26px;
  padding: 0 4px;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  background: #0d1520;
  color: #4fc3f7;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.debris-owned-btn:hover {
  border-color: #4fc3f7;
  background: #1a2235;
}

.debris-empty {
  color: #6b7a8f;
  font-size: 13px;
  text-align: center;
  padding: 20px 0;
}

.project-group {
  margin-bottom: 4px;
  background: #0d1520;
  border: 1px solid #1a2235;
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 0;
  background: #121824;
}

.group-check {
  accent-color: #1e88e5;
  cursor: pointer;
  width: 16px;
  height: 16px;
  margin-left: 14px;
  flex-shrink: 0;
}

.group-header-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: #c8d0dc;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.group-header-btn:hover {
  background: #1a2235;
}

.group-arrow {
  color: #4fc3f7;
  font-size: 12px;
  width: 16px;
  text-align: center;
}

.group-name {
  flex: 1;
}

.group-count {
  color: #6b7a8f;
  font-size: 12px;
  font-weight: 400;
}

.group-projects {
  padding: 0;
}

.project-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid #1a2235;
  transition: background 0.15s;
}

.project-row:last-child {
  border-bottom: none;
}

.project-row.project-done {
  opacity: 0.5;
}

.project-row.project-done .project-name {
  text-decoration: line-through;
}

.project-check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.project-check {
  accent-color: #1e88e5;
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.project-name {
  color: #e8edf5;
  font-size: 14px;
  font-weight: 500;
}

.project-cost-list {
  display: flex;
  flex-direction: column;
}

.project-cost-item {
  color: #4caf50;
  font-size: 12px;
  line-height: 1.6;
  white-space: nowrap;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #6b7a8f;
}
.loading .spinner {
  display: inline-block;
  width: 32px;
  height: 32px;
  border: 3px solid #1e2a3a;
  border-top-color: #4fc3f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .milestone-layout {
    flex-direction: column-reverse;
  }
  .milestone-debris {
    width: 100%;
    position: static;
  }
}
</style>
