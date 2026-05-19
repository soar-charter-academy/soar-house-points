import { useRef, useEffect } from 'react'

// ============================================
// FloatingPoint — the "+1" animation on tap
// ============================================
// Renders a "+1" that floats upward and fades out.
// Each instance lives briefly, then calls onDone
// so the parent can remove it from the list.

function FloatingPoint({ onDone, value = 1 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const anim = el.animate(
      [
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateY(-48px) scale(1.8)' },
      ],
      { duration: 3000, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    )
    anim.onfinish = onDone
    return () => anim.cancel()
  }, []) // Empty deps — runs once on mount, never restarts

  return (
    <span
      ref={ref}
      style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 28,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.95)',
        pointerEvents: 'none',
        zIndex: 10,
        textShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }}
    >
      +{value}
    </span>
  )
}

export default FloatingPoint