<template>
  <div class="detail-panel" :class="{ open: detailId }">
    <div class="detail-header">
      <div class="detail-title">{{ entity?.name || '' }}</div>
      <button class="detail-close" @click="$emit('close')">&times;</button>
    </div>
    <div class="detail-stats">
      <div class="stat-box">
        <div class="stat-label">Base Price</div>
        <div class="stat-value">{{ fmtPrice(entity?.basePrice || 0) }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Stars</div>
        <div class="stat-value">{{ starDisplay }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Market</div>
        <div class="stat-value">x{{ getMarket(detailId) }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Effective Price</div>
        <div class="stat-value">{{ fmtPrice(eff) }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Material Cost</div>
        <div class="stat-value price-small">{{ fmtPrice(oc) }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Profit / Craft</div>
        <div class="stat-value positive">{{ fmtPrice(profit) }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Profit / sec</div>
        <div class="stat-value positive">{{ fmtPrice(pps) }}/s</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Processing Time</div>
        <div class="stat-value">{{ fmtTime(entity?.time || 0) }}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Total Chain Time</div>
        <div class="stat-value">{{ fmtTime(tt) }}</div>
      </div>
      <template v-if="entity?.ingredients">
        <div class="stat-box">
          <div class="stat-label">Ingredient Sell Value</div>
          <div class="stat-value price-small">{{ fmtPrice(dc) }}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Value Added<br><span style="font-size:11px;color:#6b7a8f">this step</span></div>
          <div class="stat-value">{{ fmtPrice(eff - dc) }}</div>
        </div>
      </template>
    </div>
    <div class="tree" v-html="treeHtml"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from '../composables/useData'
import { useOverrides } from '../composables/useOverrides'
import { useSettings } from '../composables/useSettings'
import { effectivePrice, calcMaterialCost, calcTotalTime, calcDirectIngredientCost, buildTree, renderTree } from '../utils/calc'
import { fmtPrice, fmtTime } from '../utils/format'

const props = defineProps({
  detailId: { type: String, default: null }
})

defineEmits(['close'])

const { getEntity } = useData()
const { overrides, getStars, getMarket } = useOverrides()
const { settings } = useSettings()

const entity = computed(() => props.detailId ? getEntity(props.detailId) : null)

const starDisplay = computed(() => {
  const s = getStars(props.detailId)
  return s > 0 ? '★'.repeat(Math.min(s, 10)) + (s > 10 ? ' +' + (s - 10) : '') : '0'
})

const eff = computed(() => effectivePrice(props.detailId, overrides, settings))
const oc = computed(() => calcMaterialCost(props.detailId, 1, overrides, settings))
const tt = computed(() => calcTotalTime(props.detailId, 1, overrides, settings))
const profit = computed(() => eff.value - oc.value)
const pps = computed(() => tt.value > 0 ? profit.value / tt.value : 0)
const dc = computed(() => calcDirectIngredientCost(props.detailId, 1, overrides, settings))

const treeHtml = computed(() => {
  if (!props.detailId) return ''
  const tree = buildTree(props.detailId, 1, overrides, settings)
  return '<h3 style="color:#e8edf5;font-size:15px;margin-bottom:8px">Recipe Tree</h3>' + renderTree(tree, overrides)
})
</script>
