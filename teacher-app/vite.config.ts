import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/* Privacy lock for the built app: a Content-Security-Policy that lets the page load only its own files and forbids
   every network request (connect-src 'none'), so classroom data has no way to leave the device even by mistake.
   Only added to the production build, because the dev server needs a websocket for live reload. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join('; ')

function privacyLock(): Plugin {
  return {
    name: 'privacy-lock',
    apply: 'build',
    transformIndexHtml: (html) => html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
  }
}

// Relative base so the build works from any sub-path or straight from a folder.
export default defineConfig({
  plugins: [react(), privacyLock()],
  base: './',
  build: { outDir: 'dist', assetsDir: '', chunkSizeWarningLimit: 1200 },
})
