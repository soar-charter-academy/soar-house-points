import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import ProfileIcon from './ProfileIcon'

// ============================================
// MyStudents — teacher's own class rosters
// ============================================

function MyStudents({ staffId, houses, onSelectStudent, onBack, profile, onNavigate, onSignOut }) {
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)

  const houseMap = {}
  houses.forEach((h) => { houseMap[h.id] = h })

  function gradeLabel(g) {
    if (g === -1) return 'TK'
    if (g === 0) return 'K'
    return String(g)
  }

  // Fetch teacher's sections
  useEffect(() => {
    async function fetchSections() {
      const { data, error } = await supabase
        .from('sections')
        .select('id, name, period, aeries_id')
        .eq('staff_id', staffId)
        .order('period')

      if (error) {
        console.error('Failed to fetch sections:', error.message)
      } else {
        setSections(data)
        if (data.length > 0) setSelectedSection(data[0])
      }
      setLoading(false)
    }
    fetchSections()
  }, [staffId])

  // Fetch students for selected section
  useEffect(() => {
    if (!selectedSection) return
    setLoadingStudents(true)

    async function fetchStudents() {
      const { data, error } = await supabase
        .from('section_students')
        .select('student_id, students(id, first_name, last_name, grade, house_id)')
        .eq('section_id', selectedSection.id)

      if (error) {
        console.error('Failed to fetch section students:', error.message)
      } else {
        const studentList = data
          .map((d) => d.students)
          .filter(Boolean)
          .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name))
        setStudents(studentList)
      }
      setLoadingStudents(false)
    }
    fetchStudents()
  }, [selectedSection])

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
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>My Students</h1>
          <ProfileIcon profile={profile} houses={houses} onNavigate={onNavigate} onSignOut={onSignOut} />
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p>}

        {!loading && sections.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>
            No class sections found for your account.
          </p>
        )}

        {/* Section selector */}
        {sections.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 16,
          }}>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec)}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: selectedSection?.id === sec.id ? 'none' : '1px solid #ddd',
                  background: selectedSection?.id === sec.id ? '#3a3a3a' : '#fff',
                  color: selectedSection?.id === sec.id ? '#fff' : '#666',
                }}
              >
                {sec.name}
              </button>
            ))}
          </div>
        )}

        {/* Student count */}
        {selectedSection && !loadingStudents && (
          <p style={{ fontSize: 12, color: '#888', marginBottom: 12, textAlign: 'center' }}>
            {students.length} student{students.length !== 1 ? 's' : ''}
          </p>
        )}

        {loadingStudents && <p style={{ textAlign: 'center', color: '#888' }}>Loading students...</p>}

        {/* Student list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {students.map((student) => {
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
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: house ? house.color_hex : '#ccc',
                  flexShrink: 0,
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {student.last_name}, {student.first_name}
                  </span>
                </div>

                <span style={{ fontSize: 13, color: '#888', flexShrink: 0 }}>
                  Gr {gradeLabel(student.grade)}
                </span>

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

export default MyStudents