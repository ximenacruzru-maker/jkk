// End-to-end check (npm run build && npm run test:e2e). Serves the built app and, in a real Chromium:
//  1. sets up a classroom from scratch, adds a student and a grade, reloads, and checks everything is still there;
//  2. downloads a backup and an encrypted backup, erases the app, and restores both;
//  3. loads the sample classroom and visits every page at phone and desktop width in every theme, failing on page
//     errors or anything wider than the screen (the same rule as Declara's layout check);
//  4. fails if the app ever makes a request to anywhere but its own files.
import { chromium, devices } from 'playwright'
import { createServer } from 'http'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIST = path.resolve('dist')
const ROUTES = ['/', '/planner', '/classes', '/students', '/attendance', '/assignments', '/grades', '/goals', '/notes', '/reports', '/settings',
  '/settings?tab=grading', '/settings?tab=appearance', '/settings?tab=data', '/settings?tab=privacy', '/attendance?tab=summary', '/goals?tab=skills']
const THEMES = ['talavera', 'declara', 'dark', 'bubblegum', 'halloween']
const SIZES = [['phone', { ...devices['iPhone 13'] }], ['desktop', { viewport: { width: 1440, height: 900 } }]]
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff' }

if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('Run npm run build first.'); process.exit(2) }
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let f = path.join(DIST, p === '/' ? 'index.html' : p)
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html')
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res)
}).listen(0)
const base = `http://localhost:${server.address().port}/`
const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const browser = await chromium.launch(exe ? { executablePath: exe } : {})
const failures = [], external = new Set()
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teacher-e2e-'))
const check = (ok, msg) => { if (!ok) failures.push(msg); console.log((ok ? '  ✓ ' : '  ✗ ') + msg) }

async function newPage(opts = {}, theme) {
  const ctx = await browser.newContext({ acceptDownloads: true, ...opts })
  if (theme) await ctx.addInitScript((t) => { try { localStorage.setItem('declara_teacher_look', JSON.stringify({ theme: t, font: 'normal' })) } catch { /* private */ } }, theme)
  const page = await ctx.newPage(), errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:')) external.add(u) })
  return { ctx, page, errors }
}
const go = (page, r) => page.evaluate((r) => { location.hash = '#' + r }, r)

/* ---------- 1. autosave survives a reload ---------- */
console.log('Autosave')
{
  const { ctx, page, errors } = await newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(base)
  await page.getByText('Set up my classroom').click()
  await page.getByPlaceholder('e.g. Ms. Rivera').fill('Ms. Test')
  await page.getByPlaceholder('e.g. 2nd Grade Math').fill('2nd Grade Math')
  await page.getByText('Open my classroom').click()
  await page.waitForSelector('.shell')
  await go(page, '/students?new=1'); await page.waitForSelector('.drawer')
  await page.locator('.drawer input').nth(0).fill('Emma')
  await page.locator('.drawer input').nth(1).fill('Garcia')
  await page.waitForTimeout(700)
  await page.keyboard.press('Escape')
  await go(page, '/assignments?new=1'); await page.waitForSelector('.drawer')
  await page.getByPlaceholder('e.g. Chapter 3 quiz').fill('Math quiz')
  await page.waitForTimeout(700)
  await page.getByText('Enter grades').click()
  await page.waitForSelector('.grade-row')
  await page.locator('.grade-row input').first().fill('8')
  await page.waitForTimeout(800)
  await page.reload(); await page.waitForSelector('.shell')
  await go(page, '/students'); await page.waitForTimeout(500)
  check(await page.getByText('Emma Garcia').count() > 0, 'student is still there after reload')
  await go(page, '/grades'); await page.waitForSelector('.gb')
  check(await page.locator('.gb .cell').first().inputValue() === '8', 'grade 8/10 is still there after reload')
  check((await page.locator('.hd-un b').textContent()) === 'Ms. Test', 'teacher name is still there after reload')

  /* ---------- 2. backup, reset, restore ---------- */
  console.log('Backup & restore')
  await go(page, '/settings?tab=data'); await page.waitForSelector('.drop')
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download backup' }).first().click()])
  const plain = path.join(tmp, dl.suggestedFilename()); await dl.saveAs(plain)
  check(/^Teacher-App-Backup-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), 'backup is named Teacher-App-Backup-YYYY-MM-DD.json')
  const j = JSON.parse(fs.readFileSync(plain, 'utf8'))
  check(j.format === 'declara-teacher-backup' && j.data.students.length === 1 && j.data.grades.length === 1, 'backup holds the student and the grade')
  await page.locator('input[type=password]').nth(0).fill('correct horse battery')
  await page.locator('input[type=password]').nth(1).fill('correct horse battery')
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download encrypted backup' }).click()])
  const enc = path.join(tmp, dl2.suggestedFilename()); await dl2.saveAs(enc)
  const e = fs.readFileSync(enc, 'utf8')
  check(!e.includes('Emma') && !e.includes('Garcia') && JSON.parse(e).format === 'declara-teacher-backup-encrypted', 'encrypted backup does not contain readable names')

  const reset = async () => {
    await go(page, '/settings?tab=data'); await page.waitForSelector('.drop')
    await page.getByRole('button', { name: /Reset the app/ }).click()
    await page.getByLabel('Type RESET to confirm').fill('RESET')
    await page.getByRole('button', { name: 'Erase everything' }).click()
    await page.waitForSelector('.welcome')
  }
  await reset()
  check(await page.getByText('Welcome to your classroom').count() === 1, 'reset returns to the welcome screen')
  await page.getByText('Restore a backup').click()
  await page.locator('input[type=file]').setInputFiles(plain)
  await page.getByRole('button', { name: 'Restore this backup' }).click()
  await page.getByRole('button', { name: 'Restore', exact: true }).click()
  await page.waitForSelector('.shell')
  await go(page, '/students'); await page.waitForTimeout(400)
  check(await page.getByText('Emma Garcia').count() > 0, 'plain backup restores the student')

  await reset()
  await page.getByText('Restore a backup').click()
  await page.locator('input[type=file]').setInputFiles(enc)
  await page.getByPlaceholder('Backup password').fill('wrong password')
  await page.getByRole('button', { name: 'Unlock' }).click()
  await page.waitForSelector('.error-box')
  check(await page.getByText('That password doesn’t open this backup').count() === 1, 'wrong password is refused')
  await page.getByPlaceholder('Backup password').fill('correct horse battery')
  await page.getByRole('button', { name: 'Unlock' }).click()
  await page.getByRole('button', { name: 'Restore this backup' }).click()
  await page.getByRole('button', { name: 'Restore', exact: true }).click()
  await page.waitForSelector('.shell')
  await go(page, '/grades'); await page.waitForSelector('.gb')
  check(await page.locator('.gb .cell').first().inputValue() === '8', 'encrypted backup restores the grade')

  const bad = path.join(tmp, 'bad.json'); fs.writeFileSync(bad, '{"hello":1}')
  await go(page, '/settings?tab=data'); await page.waitForSelector('.drop')
  await page.locator('input[type=file]').setInputFiles(bad)
  await page.waitForSelector('.error-box', { timeout: 5000 }).catch(() => {})
  check(await page.getByText('This file isn’t a backup from this app.').count() === 1, 'an unrelated file is rejected')
  check(!errors.length, 'no page errors during autosave/backup' + (errors.length ? ': ' + errors[0] : ''))
  await ctx.close()
}

/* ---------- 3. every page, every theme, phone and desktop ---------- */
console.log('Layout')
for (const [size, opts] of SIZES) {
  for (const theme of THEMES) {
    const { ctx, page, errors } = await newPage(opts, theme)
    await page.goto(base)
    await page.getByText('Explore with sample data').click()
    await page.waitForSelector('.shell', { timeout: 20000 })
    for (const r of ROUTES) {
      errors.length = 0
      await go(page, r); await page.waitForTimeout(450)
      const res = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth, wide = []
        document.querySelectorAll('body *').forEach((el) => {
          const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || el.closest('.side')) return
          const rc = el.getBoundingClientRect(); if (!rc.width || rc.right <= vw + 2) return
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            if (p.matches('.tbl-wrap, .gb-wrap, .panel-b, .tabs, table, .ai-chips') && /(auto|scroll)/.test(getComputedStyle(p).overflowX)) return
          }
          wide.push((typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : el.tagName.toLowerCase()) + ' → ' + Math.round(rc.right) + 'px')
        })
        return { pageW: document.documentElement.scrollWidth, vw, wide: [...new Set(wide)].slice(0, 4), text: document.querySelector('.page')?.textContent?.length || 0 }
      })
      const where = `${size} · ${theme} · ${r}`
      if (res.pageW > res.vw + 1) failures.push(`${where}: page is ${res.pageW}px wide on a ${res.vw}px screen`)
      if (res.wide.length) failures.push(`${where}: wider than the screen: ${res.wide.join(', ')}`)
      if (res.text < 40) failures.push(`${where}: page looks empty`)
      if (errors.length) failures.push(`${where}: ${errors[0]}`)
    }
    if (size === 'phone') {
      await page.click('.hd-burger'); await page.waitForTimeout(300)
      const open = await page.evaluate(() => document.querySelector('.side').getBoundingClientRect().left >= 0)
      await page.click('.side-scrim', { position: { x: 360, y: 400 } }); await page.waitForTimeout(300)
      const closed = await page.evaluate(() => document.querySelector('.side').getBoundingClientRect().right <= 0)
      if (!open || !closed) failures.push(`${size} · ${theme}: the menu drawer didn't ${open ? 'close' : 'open'}`)
    }
    // open the record drawers too
    for (const r of ['/students', '/assignments', '/goals']) {
      await go(page, r); await page.waitForTimeout(300)
      await page.locator(r === '/goals' ? '.goal-card .card-t' : '.tbl tr.clickable').first().click(); await page.waitForTimeout(300)
      if (!(await page.locator('.drawer').count())) failures.push(`${size} · ${theme} · ${r}: record drawer didn't open`)
      if (errors.length) failures.push(`${size} · ${theme} · ${r} drawer: ${errors[0]}`)
      await page.keyboard.press('Escape')
    }
    console.log(`  ${size} · ${theme}: ${ROUTES.length} pages checked`)
    await ctx.close()
  }
}

/* ---------- 4. privacy ---------- */
console.log('Privacy')
check(!external.size, 'no requests left the app' + (external.size ? ': ' + [...external].slice(0, 5).join(', ') : ''))
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
check(/connect-src 'none'/.test(html), 'the built page forbids network requests (CSP connect-src none)')

await browser.close(); server.close()
fs.rmSync(tmp, { recursive: true, force: true })
if (failures.length) { console.error(`\n${failures.length} problem(s):\n` + failures.map((f) => '  • ' + f).join('\n')); process.exit(1) }
console.log('\nAll checks passed.')
