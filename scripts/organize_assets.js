const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

const keepNames = new Set([
  'server.js', 'preview', 'scripts', 'chat.js', 'main.js', 'README.md', 'package.json', 'package-lock.json', '.env', 'LICENSE', 'vercel.json'
]);

const exts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico', '.gif'];

const items = fs.readdirSync(root);
for (const name of items) {
  try {
    const full = path.join(root, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) continue;
    if (keepNames.has(name)) continue;
    const ext = path.extname(name).toLowerCase();
    if (!exts.includes(ext)) continue;
    const target = path.join(assetsDir, name);
    if (path.resolve(full) === path.resolve(target)) continue;
    fs.renameSync(full, target);
    console.log('moved', name);
  } catch (err) {
    console.error('skip', name, err.message);
  }
}

console.log('assets consolidation complete.');
