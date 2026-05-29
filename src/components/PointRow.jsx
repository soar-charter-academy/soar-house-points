// ============================================
// PointRow — single point entry in history
// ============================================

function PointRow({ point, house, isSelected, isRemoving, onToggle, onDelete, staffName, showCheckbox = true }) {

  if (!point) return null

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  return (
    <div
      onClick={showCheckbox && onToggle ? onToggle : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: isRemoving ? '0px 16px' : '12px 16px',
        background: isSelected ? '#e8f0fe' : '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        border: isSelected ? '2px solid #4285f4' : '2px solid transparent',
        opacity: isRemoving ? 0 : 1,
        transform: isRemoving ? 'translateX(60px)' : 'translateX(0)',
        maxHeight: isRemoving ? '0px' : '120px',
        marginBottom: isRemoving ? '-8px' : '0px',
        overflow: 'hidden',
        transition: 'opacity 0.3s ease, transform 0.3s ease, max-height 0.4s ease 0.1s, padding 0.4s ease 0.1s, margin-bottom 0.4s ease 0.1s, background 0.15s ease, border 0.15s ease',
        cursor: showCheckbox ? 'pointer' : 'default',
        animation: isRemoving ? 'none' : 'slideIn 0.3s ease',
      }}
    >
      {/* Checkbox (My Points only) */}
      {showCheckbox && (
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          border: isSelected ? '2px solid #4285f4' : '2px solid #ccc',
          background: isSelected ? '#4285f4' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer',
          color: '#fff', fontSize: 12, fontWeight: 700,
        }}>
          {isSelected ? '✓' : ''}
        </div>
      )}

      {/* House color dot */}
      <div style={{
        width: 12, height: 12, borderRadius: '50%',
        background: house ? house.color_hex : '#ccc', flexShrink: 0,
      }} />

      {/* Point details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {house ? house.name : 'Unknown'} +{point.value}
          {staffName && (
            <span style={{ fontWeight: 400, color: '#888' }}> — {staffName}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>{formatDate(point.created_at)}</div>
        {point.notes && (
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{point.notes}</div>
        )}
      </div>

      {/* Remove button (My Points only) */}
      {showCheckbox && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
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
  )
}

export default PointRow