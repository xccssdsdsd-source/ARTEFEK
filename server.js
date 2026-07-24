const express = require('express')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })
const { generateReply } = require('./chat.js')

const app = express()
app.use(express.json())

app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use(express.static(__dirname, { index: 'index.html' }))

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {}
    const reply = await generateReply({ message, history })
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code || 'SERVER_ERROR' })
  }
})

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'))
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Artefekt running: http://localhost:${port}`)
})
