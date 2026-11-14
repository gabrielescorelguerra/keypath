import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/ibm-plex-sans/wght.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@/styles/global.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Elemento #root não encontrado em index.html')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
