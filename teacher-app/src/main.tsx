import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Declara's typefaces, bundled with the app instead of loaded from Google Fonts, so the app works offline and
// makes no requests to other sites.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import '@fontsource/inter/latin-900.css'
import '@fontsource/montserrat/latin-500.css'
import '@fontsource/montserrat/latin-700.css'
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/abril-fatface/latin-400.css'
import '@fontsource/alex-brush/latin-400.css'
import '@fontsource/shrikhand/latin-400.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/cormorant-garamond/latin-700.css'
import '@fontsource/lora/latin-400.css'
import '@fontsource/lora/latin-600.css'
import '@fontsource/merriweather/latin-700.css'
import '@fontsource/merriweather/latin-900.css'
import App from './App'
import './styles.css'
import './teacher.css'
import { applyLook, cachedLook } from './lib/theme'
import { db, init, replaceData } from './lib/store'
import { sampleData } from './lib/sample'

applyLook(cachedLook())

// The demo build (npm run build:demo) opens straight into the made-up sample classroom, for showing and mockups.
async function start() {
  await init()
  if (__DEMO__ && !db().get('settings', 'profile')) await replaceData(sampleData())
}

start().finally(() => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
))
