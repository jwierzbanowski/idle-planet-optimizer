export function fmtTime(sec) {
  const s = Math.round(sec)
  if (s < 60) return s + 's'
  if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h + 'h ' + m + 'm'
}

export function fmtPrice(n) {
  if (n === 0) return '$0'
  if (n < 1000) return '$' + n.toFixed(2)
  const suf = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
  const s = n.toFixed(0)
  const tier = Math.floor((s.length - 1) / 3)
  if (tier >= suf.length) return '$' + s
  const scaled = n / Math.pow(10, tier * 3)
  return '$' + scaled.toFixed(2) + suf[tier]
}

export function fmtQty(n) {
  if (n < 1000) return n.toFixed(1)
  const suf = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
  const s = Math.floor(n).toString()
  const tier = Math.floor((s.length - 1) / 3)
  if (tier >= suf.length) return s
  const scaled = n / Math.pow(10, tier * 3)
  return scaled.toFixed(1) + suf[tier]
}

export function toggleTip(e) {
  const el = e.currentTarget
  document.querySelectorAll('.info-icon.visible').forEach((icon) => {
    if (icon !== el) icon.classList.remove('visible')
  })
  el.classList.toggle('visible')
}

export function fmtDuration(hours) {
  if (!isFinite(hours) || hours <= 0) return '∞'
  if (hours < 1 / 3600) return '<1s'
  if (hours < 1 / 60) return (hours * 3600).toFixed(0) + 's'
  if (hours < 1) return (hours * 60).toFixed(1) + 'm'
  if (hours < 24) return hours.toFixed(1) + 'h'
  if (hours < 720) return (hours / 24).toFixed(1) + 'd'
  if (hours < 8760) return (hours / 720).toFixed(1) + 'mo'
  return (hours / 8760).toFixed(1) + 'y'
}
