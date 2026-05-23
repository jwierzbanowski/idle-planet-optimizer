export function fmtTime(sec) {
  if (sec < 60) return sec + 's'
  if (sec < 3600) return Math.floor(sec / 60) + 'm ' + (sec % 60) + 's'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h + 'h ' + m + 'm'
}

export function fmtPrice(n) {
  if (n === 0) return '$0'
  if (n < 1000) {
    if (n < 10) return '$' + n.toFixed(2)
    if (n < 100) return '$' + n.toFixed(1)
    return '$' + n.toFixed(0)
  }
  const s = n.toFixed(0)
  if (s.length <= 6) return '$' + s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const suf = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
  const tier = Math.floor((s.length - 1) / 3)
  if (tier >= suf.length) return '$' + s
  const scaled = n / Math.pow(10, tier * 3)
  return '$' + scaled.toFixed(1) + suf[tier]
}
