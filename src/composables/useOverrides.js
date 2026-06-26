import { reactive } from 'vue'

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem('ipm_overrides')) || {}
  } catch {
    return {}
  }
}

function saveOverrides(o) {
  localStorage.setItem('ipm_overrides', JSON.stringify(o))
}

const overrides = reactive(loadOverrides())

export function useOverrides() {
  function getStars(id) {
    return overrides[id]?.stars ?? 0
  }
  function getMarket(id) {
    return overrides[id]?.market ?? 1
  }
  function getMiningLevel(id) {
    return overrides[id]?.miningLevel ?? 1
  }
  function getMiningColonies(id) {
    return overrides[id]?.colonies ?? 0
  }
  function getProbe(id) {
    return overrides[id]?.probe ?? false
  }
  function getProbeSpeed(id) {
    return overrides[id]?.probeSpeed ?? 0
  }

  function setOverride(id, field, value) {
    if (!overrides[id])
      overrides[id] = {
        stars: 0,
        market: 1,
        miningLevel: 1,
        colonies: 0,
        probe: false,
        probeSpeed: 0,
      }
    overrides[id][field] = value
    saveOverrides(overrides)
  }

  function resetTemporary() {
    for (const key of Object.keys(overrides)) {
      const entry = overrides[key]
      if (entry.stars) {
        overrides[key] = { stars: entry.stars }
      } else {
        delete overrides[key]
      }
    }
    saveOverrides(overrides)
  }

  return {
    overrides,
    getStars,
    getMarket,
    getMiningLevel,
    getMiningColonies,
    getProbe,
    getProbeSpeed,
    setOverride,
    resetTemporary,
  }
}
