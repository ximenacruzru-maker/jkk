// Turns the "single" build (vite build --mode single) into one self-contained HTML file: the script, the stylesheet
// (with its fonts and images already inlined by Vite) and the icon all go inside the page. The result opens by
// double-clicking it — no web server, no internet connection — and still saves everything in the browser.
import fs from 'fs'
import path from 'path'

const DEMO = process.env.DEMO === '1'
const DIR = path.resolve(DEMO ? 'dist-demo-single' : 'dist-single')
const OUT = path.join(DIR, DEMO ? 'Declara-Teacher-Demo.html' : 'Declara-Teacher.html')
let html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8')
const read = (f) => fs.readFileSync(path.join(DIR, f.replace(/^\.\//, '')))

html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, (_, src) =>
  // A module script inline still runs as a module; "</script" inside the code must not end the tag early.
  `<script type="module">${read(src).toString('utf8').replace(/<\/script/gi, '<\\/script')}</script>`)
html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/, (_, href) => {
  // Keep the WOFF2 fonts every current browser uses; drop the older WOFF duplicates to halve the file.
  const css = read(href).toString('utf8').replace(/,\s*url\(["']?data:(?:font\/woff|application\/font-woff);base64,[^)"']+["']?\)\s*format\(["']woff["']\)/g, '')
  return `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`
})
html = html.replace(/<link rel="(icon|apple-touch-icon)"([^>]*) href="\.\/([^"]+)" \/>/g, (_, rel, attrs, f) =>
  `<link rel="${rel}"${attrs} href="data:image/png;base64,${read(f).toString('base64')}" />`)
html = html.replace(/<link rel="modulepreload"[^>]*>\s*/g, '')

if (/(src|href)="\.\//.test(html)) { console.error('Something still points at a separate file:', html.match(/(src|href)="\.\/[^"]+"/)[0]); process.exit(1) }
fs.writeFileSync(OUT, html)
console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB)`)
