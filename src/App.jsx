import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'

function FloatingPoint({ onDone }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const anim = el.animate(
      [
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateY(-48px) scale(1.4)' },
      ],
      { duration: 1500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' }
    )
    anim.onfinish = onDone
    return () => anim.cancel()
  }, [])

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

function HouseButton({ house, onTap }) {
  const [pops, setPops] = useState([])
  const [pressed, setPressed] = useState(false)
  const nextId = useRef(0)

  const handleTap = useCallback(() => {
    console.log('tap', house.name, nextId.current)
    onTap(house.id)
    const id = nextId.current++
    setPops((p) => [...p, id])
    setPressed(true)
    setTimeout(() => setPressed(false), 120)
  }, [house.id, onTap])

  const removePop = useCallback((id) => {
    setPops((p) => p.filter((x) => x !== id))
  }, [])

  // Supurbia (gold) gets dark text, others get white
  const textColor = house.color_hex === '#ffb70c' ? '#1a1200' : '#fff'

  return (
    <button
      onClick={handleTap}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        aspectRatio: '1',
        background: house.color_hex,
        border: 'none',
        borderRadius: 16,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)',
        boxShadow: `0 4px 12px ${house.color_hex}44`,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: textColor,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {house.name}
      </span>
      {pops.map((id) => (
        <FloatingPoint key={id} onDone={() => removePop(id)} />
      ))}
    </button>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)

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

  async function awardPoint(houseId) {
    const { error } = await supabase
      .from('points')
      .insert({ house_id: houseId, staff_id: session.user.id })

    if (error) console.error('Failed to record point:', error.message)
  }

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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

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

  if (!session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
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

  // Logged in with profile — house board
  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>House Points</h1>
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