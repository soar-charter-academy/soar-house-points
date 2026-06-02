import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import ProfileIcon from './ProfileIcon'

// ============================================
// StudentDirectory — searchable student list
// ============================================

function StudentDirectory({ houses, onSelectStudent, onBack, profile, onNavigate, onSignOut }) {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')  // 'name', 'grade', 'house'
  const [filterValue, setFilterValue] = useState(null)  // selected grade or house_id

  function gradeLabel(g) {
    if (g === -1) return 'TK'
    if (g === 0) return 'K'
    return String(g)
  }

  const houseMap = {}
  houses.forEach((h) => { houseMap[h.id] = h })

  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, grade, house_id')
        .eq('active', true)
        .order('last_name')
        .order('first_name')

      if (error) {
        console.error('Failed to fetch students:', error.message)
      } else {
        setStudents(data)
      }
      setLoading(false)
    }
    fetchStudents()
  }, [])

  const filtered = (() => {
    let list = search.length >= 1
      ? students.filter((s) => {
          const full = `${s.first_name} ${s.last_name}`.toLowerCase()
          return full.includes(search.toLowerCase())
        })
      : [...students]

    // Apply contextual filter
    if (sortBy === 'grade' && filterValue !== null) {
      list = list.filter((s) => s.grade === filterValue)
    }
    if (sortBy === 'house' && filterValue !== null) {
      list = list.filter((s) => s.house_id === filterValue)
    }

    // Sort
    if (sortBy === 'name') {
      list.sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name))
    } else if (sortBy === 'grade') {
      list.sort((a, b) => a.grade - b.grade || a.last_name.localeCompare(b.last_name))
    } else if (sortBy === 'house') {
      list.sort((a, b) => {
        const houseA = houseMap[a.house_id]?.name || 'ZZZ'
        const houseB = houseMap[b.house_id]?.name || 'ZZZ'
        return houseA.localeCompare(houseB) || a.last_name.localeCompare(b.last_name)
      })
    }

    return list
  })()

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px 40px' }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>

        {/* Header */}
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
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Students</h1>
          <ProfileIcon profile={profile} houses={houses} onNavigate={onNavigate} onSignOut={onSignOut} />
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 16,
            border: '1px solid #ddd',
            borderRadius: 10,
            boxSizing: 'border-box',
            outline: 'none',
            marginBottom: 16,
          }}
        />

        {/* Sort options */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 0,
          marginBottom: 12,
        }}>
          <div style={{
            display: 'flex',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #ddd',
          }}>
            {[
              { key: 'name', label: 'Name' },
              { key: 'grade', label: 'Grade' },
              { key: 'house', label: 'House' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setSortBy(opt.key); setFilterValue(null) }}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  borderLeft: opt.key !== 'name' ? '1px solid #ddd' : 'none',
                  cursor: 'pointer',
                  background: sortBy === opt.key ? '#3a3a3a' : '#fff',
                  color: sortBy === opt.key ? '#fff' : '#666',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Filter options — contextual based on sort */}
        {sortBy === 'grade' && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 12,
          }}>
            {[-1, 0, 1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
              <button
                key={g}
                onClick={() => setFilterValue(filterValue === g ? null : g)}
                style={{
                  padding: '5px 10px', fontSize: 12, fontWeight: 600,
                  borderRadius: 6, cursor: 'pointer',
                  border: filterValue === g ? 'none' : '1px solid #ddd',
                  background: filterValue === g ? '#3a3a3a' : '#fff',
                  color: filterValue === g ? '#fff' : '#666',
                }}
              >
                {gradeLabel(g)}
              </button>
            ))}
          </div>
        )}

        {/* Filter options — contextual based on sort */}
        {sortBy === 'house' && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 12,
          }}>
            {houses.map((h) => (
              <button
                key={h.id}
                onClick={() => setFilterValue(filterValue === h.id ? null : h.id)}
                style={{
                  padding: '5px 10px', fontSize: 12, fontWeight: 600,
                  borderRadius: 6, cursor: 'pointer',
                  border: filterValue === h.id ? 'none' : '1px solid #ddd',
                  background: filterValue === h.id ? h.color_hex : '#fff',
                  color: filterValue === h.id ? (h.color_hex === '#ffb70c' ? '#1a1200' : '#fff') : '#666',
                }}
              >
                {h.name}
              </button>
            ))}
          </div>
        )}

        {/* Count */}
        <p style={{ fontSize: 12, color: '#888', marginBottom: 12, textAlign: 'center' }}>
          {loading ? 'Loading...' : `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Student list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((student) => {
            const house = houseMap[student.house_id]
            return (
              <button
                key={student.id}
                onClick={() => onSelectStudent(student, house)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: '#fff',
                  borderRadius: 10,
                  border: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {/* House color dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: house ? house.color_hex : '#ccc',
                  flexShrink: 0,
                }} />

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {student.last_name}, {student.first_name}
                  </span>
                </div>

                {/* Grade */}
                <span style={{ fontSize: 13, color: '#888', flexShrink: 0 }}>
                  Gr {gradeLabel(student.grade)}
                </span>

                {/* House name */}
                <span style={{
                  fontSize: 12, color: house ? house.color_hex : '#ccc',
                  fontWeight: 600, flexShrink: 0, minWidth: 55,
                  textAlign: 'right',
                }}>
                  {house ? house.name : '—'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StudentDirectory