import puppeteer from 'puppeteer'
import { createServer } from 'http'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST = resolve(__dirname, '..', 'dist')
const PORT = 3888
const BASE = '/idle-planet-optimizer/'

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

function serve(req, res) {
  let url = req.url
  if (url.startsWith(BASE)) url = url.slice(BASE.length - 1)
  if (url === '/' || url === '') url = '/index.html'

  const filePath = resolve(DIST, url.slice(1))

  if (!filePath.startsWith(DIST) || !existsSync(filePath)) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  try {
    const ext = extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(readFileSync(filePath))
  } catch {
    res.writeHead(500)
    res.end('Server error')
  }
}

const server = createServer(serve)

server.listen(PORT, '127.0.0.1', async () => {
  console.log(`Prerender server on http://127.0.0.1:${PORT}`)

  let browser
  try {
    browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(`http://127.0.0.1:${PORT}${BASE}`, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    await page.waitForSelector('#app[data-ready]', { timeout: 15000 })

    const html = await page.content()
    writeFileSync(resolve(DIST, 'index.html'), html, 'utf-8')
    console.log('Prerender complete — dist/index.html updated')
  } catch (err) {
    console.error('Prerender failed:', err.message)
    process.exitCode = 1
  } finally {
    if (browser) await browser.close()
    server.close()
    process.exit()
  }
})
