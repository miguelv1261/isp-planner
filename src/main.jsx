import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx'
import './index.css'

import { registerSW } from 'virtual:pwa-register'

// 🔥 registrar service worker ANTES o justo en el flujo principal
registerSW({
  immediate: true
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)