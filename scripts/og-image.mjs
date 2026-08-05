import puppeteer from 'puppeteer'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT = resolve(__dirname, '..', 'public', 'og-image.png')
const W = 1200
const H = 630

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px;
    background: #0a0e17;
    display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  }
  .card {
    text-align: center;
  }
  .logo {
    width: 100px; height: 100px;
    background: linear-gradient(135deg, #1a2332, #0f1923);
    border: 2px solid #1e88e5;
    border-radius: 22px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 28px;
  }
  .logo span {
    font-size: 48px; font-weight: 800; color: #4fc3f7;
    letter-spacing: 1px;
  }
  h1 {
    font-size: 48px; font-weight: 700; color: #e0e6ee;
    letter-spacing: -0.5px; margin-bottom: 10px;
  }
  p {
    font-size: 22px; color: #4e5a6b;
  }
  .accent { color: #4fc3f7; }
  .bar {
    width: 60px; height: 4px;
    background: #1e88e5; border-radius: 2px;
    margin: 18px auto;
  }
  .tags {
    margin-top: 20px;
    display: flex; gap: 10px; justify-content: center;
  }
  .tag {
    font-size: 13px; color: #3a4a5c;
    background: #101a26;
    border: 1px solid #1a2a3a;
    border-radius: 6px;
    padding: 5px 14px;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <span>IP</span>
    </div>
    <h1>Idle Planet <span class="accent">Optimizer</span></h1>
    <p>Calculator for Idle Planet Miner</p>
    <div class="bar"></div>
    <div class="tags">
      <span class="tag">Smelting</span>
      <span class="tag">Crafting</span>
      <span class="tag">Mining</span>
      <span class="tag">Free</span>
    </div>
  </div>
</body>
</html>`

async function main() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 })
  await page.setContent(html, { waitUntil: 'networkidle0' })
  await page.screenshot({ path: OUTPUT, type: 'png', fullPage: false })
  await browser.close()
  console.log('OG image saved to', OUTPUT)
}

main().catch((e) => { console.error(e); process.exit(1) })
