import { reactive } from 'vue'

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem('ipm_overrides')) || {} }
  catch { return {} }
}

function saveOverrides(o) {
  localStorage.setItem('ipm_overrides', JSON.stringify(o))
}

const overrides = reactive(loadOverrides())

export function useOverrides() {
  function getStars(id) { return overrides[id]?.stars ?? 0 }
  function getMarket(id) { return overrides[id]?.market ?? 1 }

  function setOverride(id, field, value) {
    if (!overrides[id]) overrides[id] = { stars: 0, market: 1 }
    overrides[id][field] = value
    saveOverrides(overrides)
  }

  function resetOverrides() {
    for (const key of Object.keys(overrides)) delete overrides[key]
    localStorage.removeItem('ipm_overrides')
  }

  return { overrides, getStars, getMarket, setOverride, resetOverrides }
}
