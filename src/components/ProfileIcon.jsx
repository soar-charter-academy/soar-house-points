import { useState } from 'react'

// ============================================
// ProfileIcon — reusable profile menu
// ============================================
// Appears on every page. Shows user initial in
// house-colored circle. Dropdown for navigation.

function ProfileIcon({ profile, houses, onNavigate, onSignOut }) {
  const [showMenu, setShowMenu] = useState(false)
  const houseColor = houses.find((h) => h.id === profile.house_id)?.color_hex || '#3a3a3a'

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div
        onClick={() => setShowMenu((prev) => !prev)}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: houseColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: houseColor === '#ffb70c' ? '#1a1200' : '#fff',
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : '?'}
      </div>

      {showMenu && (
        <>
          <div
            onClick={() => setShowMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          />
          <div style={{
            position: 'absolute',
            top: 48,
            right: 0,
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 51,
            minWidth: 160,
          }}>
            {[
              { label: 'Home', view: 'board' },
              { label: 'Points History', view: 'history' },
              { label: 'All Students', view: 'students' },
              { label: 'My Classes', view: 'mystudents' },
            ].map((item) => (
              <button
                key={item.view}
                onClick={() => { setShowMenu(false); onNavigate(item.view) }}
                style={{
                  display: 'block', width: '100%', padding: '8px 16px',
                  fontSize: 14, fontWeight: 600, background: 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  color: '#333',
                }}
              >
                {item.label}
              </button>
            ))}
            {profile.house_id && (
              <button
                onClick={() => {
                  setShowMenu(false)
                  onNavigate('myhouse')
                }}
                style={{
                  display: 'block', width: '100%', padding: '8px 16px',
                  fontSize: 14, fontWeight: 600, background: 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  color: '#333',
                }}
              >
                My House
              </button>
            )}
            <button
              onClick={() => { setShowMenu(false); onSignOut() }}
              style={{
                display: 'block', width: '100%', padding: '8px 16px',
                fontSize: 14, fontWeight: 600, background: 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderTop: '1px solid #eee',
                color: '#d33',
              }}
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ProfileIcon