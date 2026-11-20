// Genera GUIA-COMPLETA.md a partir de tools/guia-plantilla.md y los archivos del proyecto.
// Uso: node tools/build-guia.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/\s+$/, '');
const parts = {
  'App.gs': read('app/App.gs'), 'Index.html': read('app/Index.html'),
  manifest: read('docs/manifest.webmanifest'), sw: read('docs/sw.js'),
  'build-pwa': read('tools/build-pwa.js'), menu: read('extras/Microdosis_AppsScript.gs')
};
let md = read('tools/guia-plantilla.md');
for (const [k, v] of Object.entries(parts)) {
  if (v.includes('```')) throw new Error(k + ' contiene ``` y rompería el Markdown');
  md = md.split('{{' + k + '}}').join(v);
}
if (/\{\{[^}]+\}\}/.test(md)) throw new Error('Quedó un marcador sin reemplazar');
fs.writeFileSync(path.join(root, 'GUIA-COMPLETA.md'), md + '\n');
console.log('GUIA-COMPLETA.md generada (' + md.split('\n').length + ' líneas)');
