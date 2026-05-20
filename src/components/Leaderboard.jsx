import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ============================================
// Leaderboard — live house point standings
// ============================================
// Shows ranked houses with point totals and
// percentage bars. Updates in real-time when
// points are added or removed.

function Leaderboard({ onHouseTap }) {
  const [totals, setTotals] = useState([])

  async function fetchTotals() {
    const { data, error } = await supabase.rpc('get_house_totals')
    if (error) {
      console.error('Failed to fetch totals:', error.message)
    } else {
      setTotals(data)
    }
  }

  useEffect(() => {
    fetchTotals()

    // Subscribe to real-time changes on the points table
    const channel = supabase
      .channel('points-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'points' },
        () => fetchTotals()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const maxPoints = Math.max(...totals.map((t) => t.total_points), 1)

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{
        fontFamily: "'Russo One', sans-serif",
        fontSize: 14,
        fontWeight: 400,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#888',
        marginBottom: 12,
        textAlign: 'center',
      }}>
        Leaderboard
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {totals.map((house, index) => (
          <div
            key={house.house_id}
            onClick={() => onHouseTap && onHouseTap({
              id: house.house_id,
              name: house.house_name,
              color_hex: house.color_hex,
            })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              cursor: 'pointer',
            }}
          >
            {/* Rank */}
            <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>
              {index < 3 ? (
                <img
                  src={`/images/${['first', 'second', 'third'][index]}.png`}
                  alt={`${index + 1}${['st', 'nd', 'rd'][index]} place`}
                  style={{ width: 40, height: 40, objectFit: 'contain' }}
                />
              ) : null}
            </div>

            {/* Name and bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
              }}>
                {house.house_name}
              </div>
              <div style={{
                height: 6,
                borderRadius: 3,
                background: '#eee',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(house.total_points / maxPoints) * 100}%`,
                  background: house.color_hex,
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>

            {/* Points total */}
            <span style={{
              fontFamily: "'Russo One', sans-serif",
              fontSize: 18,
              color: house.color_hex,
              flexShrink: 0,
              minWidth: 40,
              textAlign: 'right',
            }}>
              {house.total_points}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Leaderboard