const { generateReply } = require('../chat.js')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const { message, history } = req.body || {}
    const reply = await generateReply({ message, history })
    res.status(200).json({ reply })
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code || 'SERVER_ERROR' })
  }
}
