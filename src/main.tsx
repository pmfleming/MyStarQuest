import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { markStartup } from './lib/startupPerformance'
import { registerOfflineShell } from './lib/registerOfflineShell'

markStartup('start')
const root = document.getElementById('root')
if (!root) throw new Error('The application root element is missing.')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
registerOfflineShell()
