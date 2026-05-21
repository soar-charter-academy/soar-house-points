import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ============================================
// HouseHistory — point history for a single house
// ============================================

function HouseHistory({ house, currentUserId, onBack }) {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState({})
  const [removing, setRemoving] = useState(new Set())

  async function deletePoint(pointId) {
    setRemoving((prev) => new Set(prev).add(pointId))
    const { error } = await supabase
      .from('points')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', pointId)

    if (error) {
      console.error('Failed to delete point:', error.message)
      setRemoving((prev) => { const next = new Set(prev); next.delete(pointId); return next })
    } else {
      setTimeout(() => {
        setPoints((prev) => prev.filter((p) => p.id !== pointId))
        setRemoving((prev) => { const next = new Set(prev); next.delete(pointId); return next })
      }, 400)
    }
  }

  useEffect(() => {
    fetchPoints()
    fetchProfiles()
  }, [])

  async function fetchPoints() {
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .eq('house_id', house.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Failed to fetch house points:', error.message)
    } else {
      setPoints(data)
    }
    setLoading(false)
  }

  async function fetchProfiles() {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name')

    if (data) {
      const map = {}
      data.forEach((p) => { map[p.id] = p.display_name })
      setProfiles(map)
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  const totalPoints = points.reduce((sum, p) => sum + p.value, 0)

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px', fontSize: 14, fontWeight: 600,
              background: 'none', border: '1px solid #ccc',
              borderRadius: 8, cursor: 'pointer', color: '#666',
            }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={`/images/${house.name.toLowerCase()}.png`}
              alt={house.name}
              style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
            />
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>{house.name}</h1>
          </div>
          <span style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: 20,
            color: house.color_hex,
          }}>
            {totalPoints}
          </span>
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p>}

        {!loading && points.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>
            No points recorded yet.
          </p>
        )}

        {/* Points list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {points.map((point) => (
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
              }}
            >
              <div style={{
                width: 4, height: 36, borderRadius: 2,
                background: house.color_hex, flexShrink: 0,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  +{point.value} — {profiles[point.staff_id] || 'Staff'}
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

              {point.staff_id === currentUserId && (
                <button
                  onClick={() => deletePoint(point.id)}
                  style={{
                    padding: '6px 10px', fontSize: 11, background: 'none',
                    border: '1px solid #e0e0e0', borderRadius: 6,
                    cursor: 'pointer', color: '#999', flexShrink: 0,
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HouseHistory