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
  if (n < 1000) {
    if (n < 10) return '$' + n.toFixed(2)
    if (n < 100) return '$' + n.toFixed(1)
    return '$' + n.toFixed(0)
  }
  const suf = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
  const s = n.toFixed(0)
  const tier = Math.floor((s.length - 1) / 3)
  if (tier >= suf.length) return '$' + s
  const scaled = n / Math.pow(10, tier * 3)
  return '$' + scaled.toFixed(1) + suf[tier]
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
