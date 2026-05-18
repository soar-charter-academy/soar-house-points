import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'

// ============================================
// FloatingPoint — the "+1" animation on tap
// ============================================
// Renders a "+1" that floats upward and fades out.
// Each instance lives briefly, then calls onDone
// so the parent can remove it from the list.

function FloatingPoint({ onDone }) {
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
      +1
    </span>
  )
}

// ============================================
// HouseButton — a single tappable house tile
// ============================================
// Displays the house crest image from /public/images/.
// On tap: records the point (via onTap), shows a
// floating "+1", and plays a press animation.

function HouseButton({ house, onTap, popTrigger = 0 }) {
  const [pops, setPops] = useState([])     // Active "+1" animations
  const [pressed, setPressed] = useState(false) // Press animation state
  const nextId = useRef(0)                 // Unique ID counter for animations

  const handleTap = useCallback(() => {
    onTap(house.id)
  }, [house.id, onTap])

  // Remove a "+1" animation after it finishes
  const removePop = useCallback((id) => {
    setPops((p) => p.filter((x) => x !== id))
  }, [])

  useEffect(() => {
    if (popTrigger > 0) {
      const id = nextId.current++
      setPops((p) => [...p, id])
      setPressed(true)
      setTimeout(() => setPressed(false), 120)
    }
  }, [popTrigger])

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
        borderRadius: 16,
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
          borderRadius: 16,
          display: 'block',
        }}
      />

      {/* Bevel overlay — renders on top of the image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}
      />

      {pops.map((id) => (
        <FloatingPoint key={id} onDone={() => removePop(id)} />
      ))}
    </button>
  )
}

// ============================================
// PointModal — optional details before confirming
// ============================================

function PointModal({ house, onConfirm, onCancel }) {
  const [notes, setNotes] = useState('')
  const [studentName, setStudentName] = useState('')

  const textColor = house.color_hex === '#ffb70c' ? '#1a1200' : '#fff'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '120px',
        zIndex: 100,
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 360,
          padding: '24px',
        }}
      >
        {/* What's about to happen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
            <img
              src={`/images/${house.name.toLowerCase()}.png`}
              alt={house.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 10,
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 10,
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
            +1 point to {house.name}
          </span>
        </div>

        {/* Optional fields */}
        <input
          type="text"
          placeholder="Student name (optional)"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 8,
            marginBottom: 12,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 8,
            marginBottom: 20,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />

        {/* Confirm button — matches house button style */}
        <button
          onClick={() => onConfirm({
            notes: notes.trim() || null,
            studentName: studentName.trim() || null,
          })}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: 18,
            fontFamily: "'Russo One', sans-serif",
            fontWeight: 400,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            background: house.color_hex,
            color: textColor,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)',
          }}
        >
          Confirm
        </button>

        <button
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: 13,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#999',
            marginTop: 8,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ============================================
// PointHistory — staff's own awarded points
// ============================================
// Shows a chronological list of points the current
// staff member has given, with soft-delete capability.

function PointHistory({ staffId, houses, onBack }) {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(new Set())

  // Build a lookup map: house_id → house object
  const houseMap = {}
  houses.forEach((h) => { houseMap[h.id] = h })

  useEffect(() => {
    fetchPoints()
  }, [])

  async function fetchPoints() {
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .eq('staff_id', staffId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch points:', error.message)
    } else {
      setPoints(data)
    }
    setLoading(false)
  }

  async function deletePoint(pointId) {
    // Start fade-out animation
    setRemoving((prev) => new Set(prev).add(pointId))

    const { error } = await supabase
      .from('points')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', pointId)

    if (error) {
      console.error('Failed to delete point:', error.message)
      // Undo animation if it failed
      setRemoving((prev) => {
        const next = new Set(prev)
        next.delete(pointId)
        return next
      })
    } else {
      // Wait for animation to finish, then remove from list
      setTimeout(() => {
        setPoints((prev) => prev.filter((p) => p.id !== pointId))
        setRemoving((prev) => {
          const next = new Set(prev)
          next.delete(pointId)
          return next
        })
      }, 400)
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              background: 'none',
              border: '1px solid #ccc',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>My Points</h1>
          <div style={{ width: 70 }} /> {/* Spacer for alignment */}
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p>}

        {!loading && points.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>
            No points awarded yet.
          </p>
        )}

        {/* Points list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {points.map((point) => {
            const house = houseMap[point.house_id]
            return (
              <div
                key={point.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  opacity: removing.has(point.id) ? 0 : 1,
                  transform: removing.has(point.id) ? 'translateX(60px)' : 'translateX(0)',
                  maxHeight: removing.has(point.id) ? '0px' : '80px',
                  padding: removing.has(point.id) ? '0px 16px' : '12px 16px',
                  marginBottom: removing.has(point.id) ? '-8px' : '0px',
                  overflow: 'hidden',
                  transition: 'opacity 0.3s ease, transform 0.3s ease, max-height 0.4s ease 0.1s, padding 0.4s ease 0.1s, margin-bottom 0.4s ease 0.1s',
                }}
              >
                {/* House color dot */}
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: house ? house.color_hex : '#ccc',
                    flexShrink: 0,
                  }}
                />

                {/* Point details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {house ? house.name : 'Unknown'} +{point.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {formatDate(point.created_at)}
                  </div>
                  {point.notes && (
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      {point.notes}
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => deletePoint(point.id)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 11,
                    background: 'none',
                    border: '1px solid #e0e0e0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: '#999',
                    flexShrink: 0,
                  }}
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================
// App — main application component
// ============================================
// Handles three states:
//   1. Not logged in → login screen with Google SSO
//   2. Logged in but no profile → unauthorized (student account)
//   3. Logged in with profile → house points board

function App() {
  const [session, setSession] = useState(null)   // Supabase auth session
  const [profile, setProfile] = useState(null)   // Staff profile from profiles table
  const [houses, setHouses] = useState([])        // House data from houses table
  const [loading, setLoading] = useState(true)    // Initial auth check
  const [view, setView] = useState('board')    // 'board' or 'history'
  const [selectedHouse, setSelectedHouse] = useState(null) // house object for modal
  const [confirmedPops, setConfirmedPops] = useState({})

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }, [])

  // ---- Auth: check session on mount and listen for changes ----
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) fetchProfile(session.user.id)
        else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ---- Fetch the staff profile from the profiles table ----
  // If no profile exists (student accounts), profile stays null
  // and the user sees the "staff only" screen.
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.log('No profile found:', error.message)
      setProfile(null)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  // ---- Fetch houses once the user is authenticated ----
  useEffect(() => {
    if (!profile) return
    supabase
      .from('houses')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setHouses(data)
      })
  }, [profile])

  // Open the confirmation modal for a house
  function handleHouseTap(houseId) {
    const house = houses.find((h) => h.id === houseId)
    if (house) setSelectedHouse(house)
  }

  // Write the point to Supabase after confirmation
  async function confirmPoint({ notes, studentName }) {
    if (!selectedHouse) return

    const { error } = await supabase
      .from('points')
      .insert({
        house_id: selectedHouse.id,
        staff_id: session.user.id,
        notes: notes,
        // studentName stored in notes for now until Aeries integration
      })

    if (error) console.error('Failed to record point:', error.message)
    setConfirmedPops((prev) => ({
      ...prev,
      [selectedHouse.id]: (prev[selectedHouse.id] || 0) + 1,
    }))  
    setSelectedHouse(null) // close modal
  }

  // ---- Auth actions ----
  async function signIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) console.error('Login error:', error.message)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  // ---- Render: loading state ----
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  // ---- Render: unauthorized (student or non-staff account) ----
  if (session && !profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 18, marginBottom: 16 }}>This app is for SOAR staff only.</p>
        <button onClick={signOut} style={{ padding: '8px 16px', fontSize: 14, cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    )
  }

  // ---- Render: login screen ----
  if (!session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
        <img src="/images/logo.png" alt="SOAR Charter Academy" style={{ width: 120, marginBottom: 24 }} />
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>SOAR House Points</h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 32 }}>Staff sign-in required</p>
        <button
          onClick={signIn}
          style={{
            padding: '12px 32px',
            fontSize: 16,
            background: '#1a1a1a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  // ---- Render: view routing ----
  if (view === 'history') {
    return (
      <PointHistory
        staffId={session.user.id}
        houses={houses}
        onBack={() => setView('board')}
      />
    )
  }

  // ---- Render: house points board (main app view) ----
  // Houses are sorted alphabetically by name from the database.
  // Layout: 2×2 grid for the first four, fifth centered below.
  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>

        {/* Header with logo, House Points button, and sign out */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <img src="/images/logo.png" alt="SOAR" style={{ height: 40, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          <button
            onClick={() => setView('history')}
            style={{
              padding: '8px 16px',
              fontFamily: "'Russo One', sans-serif",
              fontSize: 16,
              fontWeight: 400,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: '#3a3a3a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)',
            }}
          >
            HOUSE POINTS
          </button>
          <button
            onClick={signOut}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: 'none',
              border: '1px solid #ccc',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#666',
            }}
          >
            Sign out
          </button>
        </div>

        {/* House buttons — first four in a 2×2 grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {houses.slice(0, 4).map((house) => (
            <HouseButton key={house.id} house={house} onTap={handleHouseTap} popTrigger={confirmedPops[house.id] || 0} />
          ))}
        </div>

        {/* Fifth house centered below the grid */}
        {houses[4] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 'calc(50% - 6px)' }}>
                <HouseButton house={houses[4]} onTap={handleHouseTap} popTrigger={confirmedPops[houses[4].id] || 0} />
              </div>
            </div>
          </div>
        )}

        {/* Point confirmation modal */}
        {selectedHouse && (
          <PointModal
            house={selectedHouse}
            onConfirm={confirmPoint}
            onCancel={() => setSelectedHouse(null)}
          />
        )}
      </div>
    </div>
  )
}

export default App