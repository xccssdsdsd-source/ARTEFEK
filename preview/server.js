const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { generateReply } = require(path.join(__dirname, '..', 'chat.js'));

const app = express();
app.use(express.json());

// Serve preview static files
app.use('/', express.static(path.join(__dirname)));

// Expose project root files (images, logos, favicon) under /assets
// Serve assets from project root/assets if present, fall back to project root
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/assets', express.static(path.join(__dirname, '..')));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};
    const reply = await generateReply({ message, history });
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message, code: err.code || 'SERVER_ERROR' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Preview server running: http://localhost:${port}`);
});
