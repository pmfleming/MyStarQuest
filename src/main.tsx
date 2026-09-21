import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { markStartup } from './lib/startupPerformance'
import { registerOfflineShell } from './lib/registerOfflineShell'

markStartup('start')
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
registerOfflineShell()
