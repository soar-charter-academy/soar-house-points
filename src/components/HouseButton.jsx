import { useState, useCallback, useRef, useEffect } from 'react'
import FloatingPoint from './FloatingPoint'

// ============================================
// HouseButton — a single tappable house tile
// ============================================
// Displays the house crest image from /public/images/.
// On tap: opens the confirmation modal. After confirm,
// popTrigger increments and the "+N" animation plays.

function HouseButton({ house, onTap, popTrigger = 0, popValue = 1 }) {
  const [pops, setPops] = useState([])          // Active "+N" animations
  const [pressed, setPressed] = useState(false)  // Press animation state
  const nextId = useRef(0)                       // Unique ID counter for animations
  const prevTrigger = useRef(popTrigger)                  // Tracks last trigger to prevent re-fires

  const handleTap = useCallback(() => {
    onTap(house.id)
  }, [house.id, onTap])

  // Remove a "+N" animation after it finishes
  const removePop = useCallback((id) => {
    setPops((p) => p.filter((pop) => pop.id !== id))
  }, [])

  // Only spawn animation when popTrigger actually increases
  useEffect(() => {
    if (popTrigger > prevTrigger.current) {
      const id = nextId.current++
      setPops((p) => [...p, { id, value: popValue }])
      setPressed(true)
      setTimeout(() => setPressed(false), 120)
    }
    prevTrigger.current = popTrigger
  }, [popTrigger, popValue])

  return (
    <button
      onClick={handleTap}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        aspectRatio: '1',
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        cursor: 'pointer',
        padding: 0,
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      <img
        src={`/images/${house.name.toLowerCase()}.png`}
        alt={house.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 0,
          display: 'block',
        }}
      />

      {pops.map((pop) => (
        <FloatingPoint key={pop.id} value={pop.value} onDone={() => removePop(pop.id)} />
      ))}
    </button>
  )
}

export default HouseButton