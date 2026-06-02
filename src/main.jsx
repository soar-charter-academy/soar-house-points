import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DisplayBoard from './DisplayBoard.jsx'

const isDisplay = window.location.pathname === '/display'

createRoot(document.getElementById('root')).render(
  isDisplay ? <DisplayBoard /> : <App />
)

if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}