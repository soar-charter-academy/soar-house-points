import { useEffect, useRef, useState } from 'react'

// ============================================
// usePullToRefresh — mobile pull-to-refresh
// ============================================
// Detects downward pull from top of page.
// Calls onRefresh when threshold is reached.

export function usePullToRefresh(onRefresh, threshold = 80) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(null)
  const pulling = useRef(false)

  useEffect(() => {
    function onTouchStart(e) {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        pulling.current = false
      }
    }

    function onTouchMove(e) {
      if (startY.current === null) return
      const dist = e.touches[0].clientY - startY.current
      if (dist > 0 && window.scrollY === 0) {
        pulling.current = true
        setPullDistance(Math.min(dist, threshold * 1.5))
      }
    }

    async function onTouchEnd() {
      if (!pulling.current) {
        startY.current = null
        return
      }
      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        setPullDistance(0)
        await onRefresh()
        setIsRefreshing(false)
      } else {
        setPullDistance(0)
      }
      startY.current = null
      pulling.current = false
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullDistance, onRefresh, threshold])

  return { pullDistance, isRefreshing }
}