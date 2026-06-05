import { Component } from 'react'

// ============================================
// ErrorBoundary — catches render crashes
// ============================================
// Prevents the blank white screen. If any child
// component throws during render, this shows a
// friendly fallback with a reload button that
// clears caches and service workers.

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Log to console for now; Sentry hook goes here later
    console.error('App crashed:', error, info)
  }

  async handleReload() {
    // Clear all caches and service workers, then hard reload
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
      }
      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map((n) => caches.delete(n)))
      }
    } catch (e) {
      console.error('Cache clear failed:', e)
    }
    window.location.reload(true)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          background: '#f5f5f4',
        }}>
          <img
            src="/images/logo.png"
            alt="SOAR"
            style={{ width: 80, marginBottom: 24, opacity: 0.9 }}
          />
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1a1a1a' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 28, maxWidth: 320, lineHeight: 1.5 }}>
            The app ran into a problem. Tap below to refresh — this usually fixes it.
          </p>
          <button
            onClick={() => this.handleReload()}
            style={{
              padding: '14px 32px',
              fontSize: 16,
              fontWeight: 600,
              background: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            Refresh the app
          </button>
          <p style={{ fontSize: 12, color: '#aaa', marginTop: 24 }}>
            If this keeps happening, let the tech office know.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary