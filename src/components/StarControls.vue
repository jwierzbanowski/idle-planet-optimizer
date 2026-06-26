<template>
  <div class="star-controls"
@click.stop>
    <button
      class="star-btn"
      :disabled="modelValue <= 0"
      @click="$emit('update:modelValue', modelValue - 1)"
    >
      −
    </button>
    <span class="star-count">{{ modelValue }}</span>
    <button
class="star-btn" @click="$emit('update:modelValue', modelValue + 1)">+</button>
  </div>
</template>

<script setup>
defineProps({ modelValue: { type: Number, required: true } })
defineEmits(['update:modelValue'])
</script>

<style scoped>
.star-controls {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 5px;
}
.star-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #2a3a4a;
  border-radius: 4px;
  background: #0d1520;
  color: #6b7a8f;
  font-size: 16px;
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
.star-count {
  min-width: 44px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #e8edf5;
}
</style>
