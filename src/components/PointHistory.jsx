import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

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

export default PointHistory