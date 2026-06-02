import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import PointRow from './PointRow'
import ProfileIcon from './ProfileIcon'

// ============================================
// PointHistory — house points history
// ============================================
// Two tabs: My Points (personal history with edit controls)
// and All Points (full school-wide history, read-only).

function PointHistory({ staffId, houses, onBack, profile, onNavigate, onSignOut }) {
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(new Set())
  const [selected, setSelected] = useState(new Set())
  const [tab, setTab] = useState('mine')
  const [profiles, setProfiles] = useState({})

  const houseMap = {}
  houses.forEach((h) => { houseMap[h.id] = h })

  useEffect(() => {
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
    fetchProfiles()
  }, [])

  useEffect(() => {
    setLoading(true)
    setSelected(new Set())
    fetchPoints()

    // Live updates
    const channel = supabase
      .channel('history-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'points' },
        () => fetchPoints()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tab])

  async function fetchPoints() {
    let query = supabase
      .from('points')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (tab === 'mine') {
      query = query.eq('staff_id', staffId)
    }

    const { data, error } = await query
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

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Points History</h1>
          {hasSelection ? (
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
          ) : (
            <ProfileIcon profile={profile} houses={houses} onNavigate={onNavigate} onSignOut={onSignOut} />
          )}
        </div>

        {/* Tabs — centered */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 0,
          marginBottom: 20,
        }}>
          <div style={{
            display: 'flex',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #ddd',
          }}>
            <button
              onClick={() => setTab('mine')}
              style={{
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: tab === 'mine' ? '#3a3a3a' : '#fff',
                color: tab === 'mine' ? '#fff' : '#666',
              }}
            >
              My Points
            </button>
            <button
              onClick={() => setTab('all')}
              style={{
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                borderLeft: '1px solid #ddd',
                cursor: 'pointer',
                background: tab === 'all' ? '#3a3a3a' : '#fff',
                color: tab === 'all' ? '#fff' : '#666',
              }}
            >
              All Points
            </button>
          </div>
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
              onToggle={tab === 'mine' ? () => toggleSelect(point.id) : undefined}
              onDelete={point.staff_id === staffId ? () => deletePoint(point.id) : undefined}
              staffName={tab === 'all' ? (profiles[point.staff_id] || 'Staff') : null}
              showCheckbox={tab === 'mine'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PointHistory