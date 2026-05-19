import { useState } from 'react'

// ============================================
// PointModal — optional details before confirming
// ============================================

function PointModal({ house, onConfirm, onCancel }) {
  const [notes, setNotes] = useState('')
  const [studentName, setStudentName] = useState('')
  const [value, setValue] = useState(1)
  const textColor = house.color_hex === '#ffb70c' ? '#1a1200' : '#fff'

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
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)',
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
            onClick={() => setValue((v) => Math.max(1, v - 1))}
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
              if (!isNaN(num) && num > 0) setValue(num)
              if (e.target.value === '') setValue(1)
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
            onClick={() => setValue((v) => v + 1)}
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

        {/* Optional fields */}
        <input
          type="text"
          placeholder="Student name (optional)"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 8,
            marginBottom: 12,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
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

        {/* Confirm button — matches house button style */}
        <button
          onClick={() => onConfirm({
            notes: notes.trim() || null,
            studentName: studentName.trim() || null,
            value: value,
          })}
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
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)',
          }}
        >
          Confirm
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