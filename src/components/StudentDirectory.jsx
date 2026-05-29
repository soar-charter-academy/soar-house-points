import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

// ============================================
// StudentDirectory — searchable student list
// ============================================

function StudentDirectory({ houses, onSelectStudent, onBack }) {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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

  const filtered = search.length >= 1
    ? students.filter((s) => {
        const full = `${s.first_name} ${s.last_name}`.toLowerCase()
        return full.includes(search.toLowerCase())
      })
    : students

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
          <div style={{ width: 70 }} />
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
                  Gr {student.grade}
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