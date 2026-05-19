import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import HouseButton from './components/HouseButton'
import PointModal from './components/PointModal'
import PointHistory from './components/PointHistory'
import Leaderboard from './components/Leaderboard'

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
  async function confirmPoint({ notes, studentName, value }) {
    if (!selectedHouse) return

    const { error } = await supabase
      .from('points')
      .insert({
        house_id: selectedHouse.id,
        staff_id: session.user.id,
        notes: notes,
        value: value,
      })

    if (error) console.error('Failed to record point:', error.message)
    setConfirmedPops((prev) => ({
      ...prev,
      [selectedHouse.id]: {
        count: (prev[selectedHouse.id]?.count || 0) + 1,
        value: value,
      },
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
            <HouseButton key={house.id} house={house} onTap={handleHouseTap} popTrigger={confirmedPops[house.id]?.count || 0} popValue={confirmedPops[house.id]?.value || 1} />
          ))}
        </div>

        {/* Fifth house centered below the grid */}
        {houses[4] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 'calc(50% - 6px)' }}>
                <HouseButton key={houses[4].id} house={houses[4]} onTap={handleHouseTap} popTrigger={confirmedPops[houses[4].id]?.count || 0} popValue={confirmedPops[houses[4].id]?.value || 1} />
              </div>
            </div>
          </div>
        )}

        <Leaderboard />

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