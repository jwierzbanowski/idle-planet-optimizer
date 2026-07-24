import { watch } from 'vue'

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export function useAnalytics() {
  let heartbeatTimer = null
  let lastActive = Date.now()
  const AFK_TIMEOUT = 5 * 60 * 1000
  let currentTab = null

  function loadGtag() {
    if (!GA_ID || typeof window === 'undefined') return
    if (window.gtag) return

    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(s)

    window.dataLayer = window.dataLayer || []
    window.gtag = function () {
      window.dataLayer.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA_ID, { send_page_view: true, anonymize_ip: true })
  }

  function send(eventName, params = {}) {
    if (window.gtag) window.gtag('event', eventName, params)
  }

  function initTabTracking(activeTabRef) {
    loadGtag()

    watch(activeTabRef, (tab, prev) => {
      send('tab_switch', { tab_name: tab, previous_tab: prev || '(none)' })
      currentTab = tab
      resetHeartbeat()
    })

    const onActivity = () => {
      lastActive = Date.now()
    }
    window.addEventListener('mousedown', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity, { passive: true })
    window.addEventListener('touchstart', onActivity, { passive: true })
    window.addEventListener('scroll', onActivity, { passive: true })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopHeartbeat()
      else resetHeartbeat()
    })

    currentTab = activeTabRef.value
    resetHeartbeat()
  }

  function resetHeartbeat() {
    stopHeartbeat()
    heartbeatTimer = setInterval(sendHeartbeat, 30000)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function sendHeartbeat() {
    if (!currentTab) return
    const idle = Date.now() - lastActive > AFK_TIMEOUT
    if (idle) return
    send('tab_heartbeat', { tab_name: currentTab })
  }

  function trackAction(name) {
    send('action', { action_name: name })
  }

  return { initTabTracking, trackAction }
}
