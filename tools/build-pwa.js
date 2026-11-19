// Genera docs/index.html (app instalable para GitHub Pages) a partir de app/Index.html.
// Uso: node tools/build-pwa.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'app/Index.html'), 'utf8');

const head = [
  '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="icon" href="icons/icon-192.png">',
  '<link rel="apple-touch-icon" href="icons/icon-192.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="Microdosis">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="referrer" content="no-referrer">'
].join('\n');
const sw = "<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('sw.js')})}</" + "script>";

if (!html.includes('<title>Microdosis</title>')) throw new Error('No encuentro <title> en app/Index.html');
html = html.replace('<base target="_top">\n', '');
html = html.replace('<title>Microdosis</title>', '<title>Microdosis</title>\n' + head);
html = html.replace('</body>', sw + '\n</body>');
fs.writeFileSync(path.join(root, 'docs/index.html'), html);
console.log('docs/index.html generado');
