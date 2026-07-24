<template>
  <div class="star-controls" @click.stop>
    <button
      class="star-btn"
      :disabled="modelValue <= 0"
      @click="adjustStars($event, -1)"
    >{{ minusLabel }}</button>
    <input
      type="number"
      class="star-input"
      :value="modelValue"
      min="0"
      @change="onInputChange"
      @focus="$event.target.select()"
    />
    <button
      class="star-btn"
      @click="adjustStars($event, 1)"
    >{{ plusLabel }}</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useModifierKeys } from '../composables/useModifierKeys'

const props = defineProps({ modelValue: { type: Number, required: true } })
const emit = defineEmits(['update:modelValue'])

const { multiplier } = useModifierKeys()

const plusLabel = computed(() => {
  const m = multiplier.value
  return m === 1 ? '+' : '+' + m
})

const minusLabel = computed(() => {
  const m = multiplier.value
  return m === 1 ? '−' : '−' + m
})

function adjustStars(e, delta) {
  let m = 1
  if (e.ctrlKey) m = 5
  if (e.shiftKey) m = 10
  if (e.ctrlKey && e.shiftKey) m = 50
  emit('update:modelValue', Math.max(0, props.modelValue + delta * m))
}

function onInputChange(e) {
  const val = parseInt(e.target.value)
  emit('update:modelValue', isNaN(val) ? 0 : Math.max(0, val))
}
</script>

<style scoped>
.star-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 5px;
}
.star-btn {
  width: 28px;
  height: 24px;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  background: #0d1520;
  color: #6b7a8f;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  user-select: none;
}
.star-btn:hover {
  border-color: #4fc3f7;
  color: #4fc3f7;
}
.star-btn:active {
  background: #1a2235;
}
.star-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.star-input {
  width: 48px;
  background: #0d1520;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  color: #e8edf5;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  padding: 3px 4px;
  outline: none;
  -moz-appearance: textfield;
}
.star-input:focus {
  border-color: #4fc3f7;
}
.star-input::-webkit-inner-spin-button,
.star-input::-webkit-outer-spin-button {
  display: none;
}
</style>
