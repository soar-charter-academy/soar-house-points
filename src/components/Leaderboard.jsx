import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function Leaderboard({ onHouseTap }) {
  const [totals, setTotals] = useState([])
  const [period, setPeriod] = useState('today')

  function getSince(period) {
    const now = new Date()
    if (period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return start.toISOString()
    }
    if (period === 'week') {
      const day = now.getDay()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
      return start.toISOString()
    }
    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return start.toISOString()
    }
    // 'year' — start of school year (August 1)
    const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
    return new Date(year, 7, 1).toISOString()
  }

  async function fetchTotals() {
    const since = getSince(period)
    const { data, error } = await supabase.rpc('get_house_totals_since', { since })
    if (error) {
      console.error('Failed to fetch totals:', error.message)
    } else {
      setTotals(data)
    }
  }

  useEffect(() => {
    fetchTotals()

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
  }, [period])

  const maxPoints = Math.max(...totals.map((t) => t.total_points), 1)

  const tabs = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ]

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

      {/* Period tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        <div style={{
          display: 'flex',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #ddd',
        }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setPeriod(t.key)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                borderLeft: t.key !== 'today' ? '1px solid #ddd' : 'none',
                cursor: 'pointer',
                background: period === t.key ? '#3a3a3a' : '#fff',
                color: period === t.key ? '#fff' : '#666',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

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
            <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>
              {index < 3 ? (
                <img
                  src={`/images/${['first', 'second', 'third'][index]}.png`}
                  alt={`${index + 1}${['st', 'nd', 'rd'][index]} place`}
                  style={{ width: 40, height: 40, objectFit: 'contain' }}
                />
              ) : null}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                {house.house_name}
              </div>
              <div style={{
                height: 6, borderRadius: 3, background: '#eee', overflow: 'hidden',
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