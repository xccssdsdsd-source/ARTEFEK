import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:3000'
const selector = process.argv[3] || '#assistant'
const out = process.argv[4] || './temporary screenshots/section.png'
const width = parseInt(process.argv[5] || '1440', 10)

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width, height: 900 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const el = await page.$(selector)
await el.scrollIntoViewIfNeeded()
await page.waitForTimeout(1200)
await el.screenshot({ path: out })
await browser.close()
console.log('Saved: ' + out)
