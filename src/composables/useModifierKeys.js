import { ref, computed } from 'vue'

const ctrlDown = ref(false)
const shiftDown = ref(false)
let registered = false

function onKeyDown(e) {
  if (e.repeat) return
  if (e.key === 'Control') ctrlDown.value = true
  if (e.key === 'Shift') shiftDown.value = true
}

function onKeyUp(e) {
  if (e.key === 'Control') ctrlDown.value = false
  if (e.key === 'Shift') shiftDown.value = false
}

function onBlur() {
  ctrlDown.value = false
  shiftDown.value = false
}

export function useModifierKeys() {
  if (!registered && typeof document !== 'undefined') {
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    registered = true
  }

  const multiplier = computed(() => {
    if (ctrlDown.value && shiftDown.value) return 50
    if (shiftDown.value) return 10
    if (ctrlDown.value) return 5
    return 1
  })

  return { ctrlDown, shiftDown, multiplier }
}
