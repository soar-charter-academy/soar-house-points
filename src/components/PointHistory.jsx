import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import PointRow from './PointRow'

// ============================================
// PointHistory — staff's own awarded points
// ============================================

function PointHistory({ staffId, houses, onBack }) {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(new Set())
  const [selected, setSelected] = useState(new Set())

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

  function toggleSelect(pointId) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(pointId)) next.delete(pointId)
      else next.add(pointId)
      return next
    })
  }

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

  async function deleteSelected() {
    const ids = Array.from(selected)
    setRemoving(new Set(ids))
    const { error } = await supabase
      .from('points')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids)

    if (error) {
      console.error('Failed to delete points:', error.message)
      setRemoving(new Set())
    } else {
      setTimeout(() => {
        setPoints((prev) => prev.filter((p) => !ids.includes(p.id)))
        setRemoving(new Set())
        setSelected(new Set())
      }, 400)
    }
  }

  const hasSelection = selected.size > 0

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
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>My Points</h1>
          {hasSelection ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={deleteSelected}
                style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 700,
                  background: '#dc3545', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                }}
              >
                Remove ({selected.size})
              </button>
            </div>
          ) : (
            <div style={{ width: 70 }} />
          )}
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p>}

        {!loading && points.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>
            No points awarded yet.
          </p>
        )}

        {/* Points list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {points.map((point) => (
            <PointRow
              key={point.id}
              point={point}
              house={houseMap[point.house_id]}
              isSelected={selected.has(point.id)}
              isRemoving={removing.has(point.id)}
              onToggle={() => toggleSelect(point.id)}
              onDelete={() => deletePoint(point.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PointHistory