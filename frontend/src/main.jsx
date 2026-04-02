import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' 
import './i18n' // 👈 BAS YE NAYI LINE ADD KARNI HAI
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      if (confirm('New version available! Reload to update?')) {
        window.location.reload()
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline')
    },
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)