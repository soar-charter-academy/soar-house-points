import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ============================================
// DisplayBoard — Vivi digital signage display
// ============================================
// Public URL: /display
// No auth required. Designed for landscape TV.
// Rotates through 4 time periods every 4 seconds.

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
]

function getSince(period) {
  const now = new Date()
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  if (period === 'week') {
    const day = now.getDay()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day).toISOString()
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return new Date(year, 7, 1).toISOString()
}

export default function DisplayBoard() {
  const [periodIndex, setPeriodIndex] = useState(0)
  const [totals, setTotals] = useState([])
  const [visible, setVisible] = useState(true)

  async function fetchTotals(period) {
    const { data } = await supabase.rpc('get_house_totals_since', { since: getSince(period) })
    if (data) setTotals(data)
  }

  // Rotate every 4 seconds with fade
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setPeriodIndex((prev) => (prev + 1) % PERIODS.length)
        setVisible(true)
      }, 600)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchTotals(PERIODS[periodIndex].key)
  }, [periodIndex])

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('display-points')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'points' },
        () => fetchTotals(PERIODS[periodIndex].key))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [periodIndex])

  const maxPoints = Math.max(...totals.map((t) => t.total_points), 1)
  const period = PERIODS[periodIndex]
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32', '#555', '#555']

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#111',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Russo One', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Russo+One&display=swap');`}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2vh 4vw 1.5vh',
        borderBottom: '1px solid #333',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}>
          <img src="/images/logo.png" alt="SOAR" style={{ height: '7vh', objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '2.2vh', color: '#888', letterSpacing: '0.2em' }}>SOAR CHARTER ACADEMY</div>
            <div style={{ fontSize: '4.5vh', color: '#fff', letterSpacing: '0.06em', lineHeight: 1 }}>HOUSE POINTS</div>
          </div>
        </div>

        <div style={{
          textAlign: 'right',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}>
          <div style={{ fontSize: '2vh', color: '#666', letterSpacing: '0.2em' }}>NOW SHOWING</div>
          <div style={{ fontSize: '4vh', color: '#fff', letterSpacing: '0.1em' }}>{period.label.toUpperCase()}</div>
        </div>
      </div>

      {/* House columns */}
      <div style={{
        flex: 1,
        display: 'flex',
        padding: '2.5vh 3vw',
        gap: '2vw',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}>
        {totals.map((house, index) => (
          <div
            key={house.house_id}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#1c1c1c',
              borderRadius: '1.5vw',
              padding: '2.5vh 1.5vw',
              border: `2px solid ${house.color_hex}33`,
              position: 'relative',
              gap: '1.5vh',
            }}
          >
            {/* Rank */}
            <div style={{
              position: 'absolute',
              top: '1.5vh',
              left: '1.5vw',
              fontSize: '2.2vh',
              color: rankColors[index],
            }}>
              #{index + 1}
            </div>

            {/* House crest */}
            <img
              src={`/images/${house.house_name.toLowerCase()}.png`}
              alt={house.house_name}
              style={{
                width: '11vw',
                height: '11vw',
                objectFit: 'cover',
                borderRadius: '0.8vw',
                boxShadow: `0 0 3vw ${house.color_hex}55`,
                marginTop: '1vh',
              }}
            />

            {/* Points */}
            <div style={{
              fontSize: '9vh',
              color: '#fff',
              lineHeight: 1,
            }}>
              {house.total_points}
            </div>

            {/* Bar */}
            <div style={{
              width: '100%',
              height: '1.2vh',
              background: '#2a2a2a',
              borderRadius: '0.6vh',
              overflow: 'hidden',
              marginTop: 'auto',
            }}>
              <div style={{
                height: '100%',
                width: `${(house.total_points / maxPoints) * 100}%`,
                background: house.color_hex,
                borderRadius: '0.6vh',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Period dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1vw',
        padding: '1.5vh',
      }}>
        {PERIODS.map((p, i) => (
          <div
            key={p.key}
            style={{
              height: '0.6vh',
              width: i === periodIndex ? '5vw' : '1.2vw',
              borderRadius: '0.3vh',
              background: i === periodIndex ? '#fff' : '#444',
              transition: 'all 0.6s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}