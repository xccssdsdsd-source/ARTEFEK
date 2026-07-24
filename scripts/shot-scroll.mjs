import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:3000'
const y = parseInt(process.argv[3] || '600', 10)
const out = process.argv[4] || './temporary screenshots/scroll.png'
const width = parseInt(process.argv[5] || '1440', 10)

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width, height: 900 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.evaluate((yy) => window.scrollTo(0, yy), y)
await page.waitForTimeout(1200)
await page.screenshot({ path: out })
await browser.close()
console.log('Saved: ' + out)
