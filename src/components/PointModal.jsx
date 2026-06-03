import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ============================================
// PointModal — optional details before confirming
// ============================================

function PointModal({ house, onConfirm, onCancel, prefilledStudent = null }) {
  const [notes, setNotes] = useState('')
  const [studentQuery, setStudentQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(prefilledStudent)
  const [students, setStudents] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [value, setValue] = useState(1)
  const [confirmingLarge, setConfirmingLarge] = useState(false)
  const searchRef = useRef(null)
  const textColor = house.color_hex === '#ffb70c' ? '#1a1200' : '#fff'
  

  // Fetch all active students on mount
  useEffect(() => {
    async function fetchStudents() {
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, grade, house_id')
        .eq('active', true)
        .order('last_name')
      if (data) setStudents(data)
    }
    fetchStudents()
  }, [])

  // Enter key handler
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter' && !showResults) {
        if (value > 5 && !confirmingLarge) {
          setConfirmingLarge(true)
        } else {
          handleConfirm()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [value, notes, selectedStudent, studentQuery, confirmingLarge, showResults])

  function updateValue(newVal) {
    setValue(newVal)
    setConfirmingLarge(false)
  }

  function handleConfirm() {
    onConfirm({
      notes: notes.trim() || null,
      studentName: selectedStudent
        ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
        : studentQuery.trim() || null,
      studentId: selectedStudent?.id || null,
      value: value,
    })
  }

  // Filter students based on query
  const filtered = studentQuery.length >= 2
    ? students.filter((s) => {
        const full = `${s.first_name} ${s.last_name}`.toLowerCase()
        return full.includes(studentQuery.toLowerCase())
      }).slice(0, 8)
    : []

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '120px',
        zIndex: 100,
        padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 360,
          padding: '24px',
        }}
      >
        {/* What's about to happen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
            <img
              src={`/images/${house.name.toLowerCase()}.png`}
              alt={house.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 10,
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 10,
                pointerEvents: 'none',
              }}
            />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
            +{value} point{value !== 1 ? 's' : ''} to {house.name}
          </span>
        </div>

        {/* Point value selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          marginBottom: 20,
        }}>
          <button
            onClick={() => updateValue(Math.max(1, value - 1))}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: house.color_hex,
              color: house.color_hex === '#ffb70c' ? '#1a1200' : '#fff',
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            -
          </button>
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10)
              if (!isNaN(num) && num > 0) updateValue(num)
              if (e.target.value === '') updateValue(1)
            }}
            style={{
              width: 60,
              textAlign: 'center',
              fontSize: 28,
              fontWeight: 800,
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: '4px 0',
              outline: 'none',
            }}
            min="1"
          />
          <button
            onClick={() => updateValue(value + 1)}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: house.color_hex,
              fontSize: 22,
              fontWeight: 700,
              cursor: 'pointer',
              color: house.color_hex === '#ffb70c' ? '#1a1200' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>

        {/* Student search */}
        <div style={{ position: 'relative', marginBottom: 12 }} ref={searchRef}>
          {selectedStudent ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: 8,
              background: '#f8f8f8',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {selectedStudent.first_name} {selectedStudent.last_name}
                <span style={{ fontWeight: 400, color: '#888', marginLeft: 8 }}>
                  Gr {selectedStudent.grade}
                </span>
              </span>
              <button
                onClick={() => { setSelectedStudent(null); setStudentQuery('') }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#999', fontSize: 16, padding: '0 4px',
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Search student (optional)"
              value={studentQuery}
              onChange={(e) => {
                setStudentQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: '1px solid #ddd',
                borderRadius: 8,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          )}

          {/* Search results dropdown */}
          {showResults && filtered.length > 0 && !selectedStudent && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
              marginTop: 4,
              maxHeight: 200,
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStudent(s)
                    setStudentQuery('')
                    setShowResults(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 14,
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {s.first_name} {s.last_name}
                  </span>
                  <span style={{ color: '#888', marginLeft: 8 }}>
                    Gr {s.grade}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 8,
            marginBottom: 20,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />

        {/* Confirm button */}
        <button
          onClick={() => {
            if (value > 5 && !confirmingLarge) {
              setConfirmingLarge(true)
              return
            }
            handleConfirm()
          }}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: 18,
            fontFamily: "'Russo One', sans-serif",
            fontWeight: 400,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            background: house.color_hex,
            color: textColor,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          {confirmingLarge ? `Confirm ${value} points — are you sure?` : 'Confirm'}
        </button>

        <button
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: 13,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#999',
            marginTop: 8,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default PointModal