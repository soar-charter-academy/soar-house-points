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

function HouseButton({ house, onTap }) {
  const [pops, setPops] = useState([])     // Active "+1" animations
  const [pressed, setPressed] = useState(false) // Press animation state
  const nextId = useRef(0)                 // Unique ID counter for animations

  const handleTap = useCallback(() => {
    onTap(house.id) // Record the point to Supabase

    // Spawn a new "+1" animation
    const id = nextId.current++
    setPops((p) => [...p, id])

    // Brief scale-down for tactile press feedback
    setPressed(true)
    setTimeout(() => setPressed(false), 120)
  }, [house.id, onTap])

  // Remove a "+1" animation after it finishes
  const removePop = useCallback((id) => {
    setPops((p) => p.filter((x) => x !== id))
  }, [])

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

  // ---- Award a point to a house ----
  // Inserts a row into the points table. Value defaults to 1
  // via the database schema. This is the "optimistic" pattern:
  // the UI updates immediately via the FloatingPoint animation,
  // and this write happens in the background.
  async function awardPoint(houseId) {
    const { error } = await supabase
      .from('points')
      .insert({ house_id: houseId, staff_id: session.user.id })

    if (error) console.error('Failed to record point:', error.message)
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

  // ---- Render: house points board (main app view) ----
  // Houses are sorted alphabetically by name from the database.
  // Layout: 2×2 grid for the first four, fifth centered below.
  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>

        {/* Header with logo and sign out */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/images/logo.png" alt="SOAR" style={{ height: 40, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>House Points</h1>
          </div>
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
            <HouseButton key={house.id} house={house} onTap={awardPoint} />
          ))}
        </div>

        {/* Fifth house centered below the grid */}
        {houses[4] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 'calc(50% - 6px)' }}>
                <HouseButton house={houses[4]} onTap={awardPoint} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App