import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'fs'
import { readdirSync } from 'fs'

const url = process.argv[2] || 'http://localhost:3000'
const dir = './temporary screenshots'
if (!existsSync(dir)) mkdirSync(dir)

const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-')).length
const outPath = `${dir}/screenshot-${existing + 1}.png`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: outPath, fullPage: false })
await browser.close()
console.log(`Saved: ${outPath}`)
