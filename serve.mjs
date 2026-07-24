import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { extname, join } from 'path'
import { fileURLToPath } from 'url'

const dir = fileURLToPath(new URL('.', import.meta.url))
const port = 3000
const mime = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff'
}

createServer(async (req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url
  const filePath = join(dir, url)
  try {
    const data = await readFile(filePath)
    const ct = mime[extname(filePath)] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': ct })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}).listen(port, () => console.log(`http://localhost:${port}`))
