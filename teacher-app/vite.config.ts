import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/* Privacy lock for the built app: a Content-Security-Policy that lets the page load only its own files and forbids
   every network request (connect-src 'none'), so classroom data has no way to leave the device even by mistake.
   Only added to the production build, because the dev server needs a websocket for live reload. */
/* The single-file build (npm run build:single) carries everything inline, so it allows inline scripts and data: files,
   but it still forbids every network request. */
const csp = (single: boolean) => [
  "default-src 'self'",
  single ? "script-src 'unsafe-inline'" : "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join('; ')

function privacyLock(single: boolean): Plugin {
  return {
    name: 'privacy-lock',
    apply: 'build',
    transformIndexHtml: (html) => html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp(single)}" />`),
  }
}

// Relative base so the build works from any sub-path. Mode "single" bundles everything (code, styles, fonts, images)
// into one JS and one CSS file, which scripts/single-file.mjs then inlines into one HTML file that opens by double-click.
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    plugins: [react(), privacyLock(single)],
    define: { __DEMO__: JSON.stringify(process.env.DEMO === '1') },
    base: './',
    build: single
      ? { outDir: process.env.DEMO === '1' ? 'dist-demo-single' : 'dist-single', assetsDir: '', assetsInlineLimit: () => true, cssCodeSplit: false, chunkSizeWarningLimit: 8000, rolldownOptions: { output: { codeSplitting: false } } }
      : { outDir: process.env.DEMO === '1' ? 'dist-demo' : 'dist', assetsDir: '', chunkSizeWarningLimit: 1200 },
  }
})
