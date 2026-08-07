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

function loadManagers() {
  try {
    return JSON.parse(localStorage.getItem('ipm_manager_assign')) || {}
  } catch {
    return {}
  }
}

function saveManagers(m) {
  localStorage.setItem('ipm_manager_assign', JSON.stringify(m))
}

function loadModulePerX() {
  try {
    return JSON.parse(localStorage.getItem('ipm_module_perx')) || {}
  } catch {
    return {}
  }
}

function saveModulePerX(o) {
  localStorage.setItem('ipm_module_perx', JSON.stringify(o))
}

const overrides = reactive(loadOverrides())
const managerAssign = reactive(loadManagers())
const modulePerX = reactive(loadModulePerX())

export function useOverrides() {
  function getStars(id) {
    return overrides[id]?.stars ?? 0
  }
  function getMarket(id) {
    return overrides[id]?.market ?? 1
  }
  function getMiningLevel(id) {
    return overrides[id]?.miningLevel ?? 0
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
  function getRover(id) {
    return overrides[id]?.rover ?? false
  }

  function getManager(id) {
    return managerAssign[id] ?? -1
  }

  function setManager(id, idx) {
    if (idx >= 0) {
      for (const pid of Object.keys(managerAssign)) {
        if (pid !== id && managerAssign[pid] === idx) {
          delete managerAssign[pid]
        }
      }
      managerAssign[id] = idx
    } else {
      delete managerAssign[id]
    }
    saveManagers(managerAssign)
  }

  function isManagerAssigned(idx, excludePlanetId) {
    for (const [pid, mid] of Object.entries(managerAssign)) {
      if (pid !== excludePlanetId && mid === idx) return true
    }
    return false
  }

  function getPerX(depKey) {
    return modulePerX[depKey] ?? 0
  }

  function setPerX(depKey, value) {
    if (value > 0) {
      modulePerX[depKey] = value
    } else {
      delete modulePerX[depKey]
    }
    saveModulePerX(modulePerX)
  }

  function getFullPerX() {
    return modulePerX
  }

  function setOverride(id, field, value) {
    if (!overrides[id])
      overrides[id] = {
        stars: 0,
        market: 1,
        miningLevel: 0,
        colonies: 0,
        probe: false,
        probeSpeed: 0,
        rover: false,
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
    for (const key of Object.keys(managerAssign)) {
      delete managerAssign[key]
    }
    saveManagers(managerAssign)
    for (const key of Object.keys(modulePerX)) {
      delete modulePerX[key]
    }
    saveModulePerX(modulePerX)
  }

  return {
    overrides,
    managerAssign,
    modulePerX,
    getStars,
    getMarket,
    getMiningLevel,
    getMiningColonies,
    getProbe,
    getProbeSpeed,
    getRover,
    getManager,
    setManager,
    isManagerAssigned,
    setOverride,
    resetTemporary,
    getPerX,
    setPerX,
    getFullPerX,
  }
}
