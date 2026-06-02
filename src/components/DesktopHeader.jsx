import ProfileIcon from './ProfileIcon'


// ============================================
// DesktopHeader — top navigation for wide screens
// ============================================

function DesktopHeader({ profile, houses, currentView, onNavigate, onSignOut }) {
  const houseColor = houses.find((h) => h.id === profile.house_id)?.color_hex || '#3a3a3a'
  const isSuper = houseColor === '#ffb70c'

  const navItems = [
    { label: 'Home', view: 'board' },
    { label: 'History', view: 'history' },
    { label: 'Students', view: 'students' },
    { label: 'My Classes', view: 'mystudents' },
  ]

  return (
    <div style={{
      width: '100%',
      background: '#1a1a1a',
      borderBottom: '1px solid #333',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      height: 64,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <img src="/images/logo.png" alt="SOAR" style={{ height: 36, objectFit: 'contain' }} />
        <span style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: 16,
          color: '#fff',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}>
          HOUSE POINTS
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            style={{
              padding: '6px 14px',
              fontSize: 14,
              fontWeight: 600,
              background: currentView === item.view ? '#fff1' : 'none',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              color: currentView === item.view ? '#fff' : '#999',
              transition: 'all 0.15s',
            }}
          >
            {item.label}
          </button>
        ))}

        {profile.house_id && (
          <button
            onClick={() => onNavigate('myhouse')}
            style={{
              padding: '6px 14px',
              fontSize: 14,
              fontWeight: 600,
              background: currentView === 'myhouse' ? '#fff1' : 'none',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              color: currentView === 'myhouse' ? '#fff' : '#999',
              transition: 'all 0.15s',
            }}
          >
            My House
          </button>
        )}
      </div>

      {/* Profile + sign out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: '#666' }}>{profile.display_name}</span>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: houseColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isSuper ? '#1a1200' : '#fff',
          fontSize: 16, fontWeight: 700, flexShrink: 0,
        }}>
          {profile.display_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <button
          onClick={onSignOut}
          style={{
            padding: '6px 14px', fontSize: 13, fontWeight: 600,
            background: 'none', border: '1px solid #444',
            borderRadius: 6, cursor: 'pointer', color: '#888',
            whiteSpace: 'nowrap',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default DesktopHeader