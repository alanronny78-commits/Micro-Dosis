// Prueba de la app instalable: sirve docs/ en :8810 y un "Apps Script" falso en :8811 (otro origen, como en la vida real).
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium, devices } = require('playwright');
const makeServices = require('./shim.js');
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixture.json'), 'utf8'));
const svc = makeServices(FX);
let ACTIVE = 'owner@x.com';
const ctx = Object.assign({ console, Date,
  Session: { getActiveUser: () => ({ getEmail: () => ACTIVE }), getEffectiveUser: () => ({ getEmail: () => 'owner@x.com' }), getScriptTimeZone: () => 'America/Lima' },
  Utilities: { getUuid: () => require('crypto').randomUUID() },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
  Logger: { log() {} } }, svc);
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require('path').join(__dirname, '..', 'app', 'App.gs'), 'utf8'), ctx);
const API = 'http://127.0.0.1:8811/macros/s/TEST/exec';
const setup = ctx.rpc('', 'getMobileSetup', []);
ACTIVE = ''; // a partir de aquí, como en la implementación «Cualquier usuario»
const docs = path.join(__dirname, '..', 'docs');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const s1 = http.createServer((req, res) => {
  let f = decodeURIComponent(req.url.split('?')[0].split('#')[0]); if (f.endsWith('/')) f += 'index.html';
  const p = path.join(docs, f);
  if (!p.startsWith(docs) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(8810);
let posts = 0;
const s2 = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(405); return res.end(); } // Apps Script no responde preflight: no debe haber
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    posts++;
    const out = ctx.doPost({ postData: { contents: body } });
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(out.t);
  });
}).listen(8811);

(async () => {
  const out = process.argv[2] || require('path').join(__dirname, 'shots'); require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices['Pixel 7'] });
  const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  // 1) sin configuración → pantalla de conexión
  await p.goto('http://localhost:8810/'); await p.waitForSelector('#cGo');
  await p.screenshot({ path: out + '/pwa_1_conectar.png' });
  const tabsHidden = await p.evaluate(() => getComputedStyle(document.querySelector('#tabs')).display === 'none');
  // 2) clave incorrecta
  await p.fill('#cUrl', API); await p.fill('#cKey', 'clave-mala'); await p.click('#cGo');
  await p.waitForSelector('.err');
  // 3) enlace de conexión (como el botón «Abrir app instalable»)
  const link = 'http://localhost:8810/#setup=' + Buffer.from(API + '|' + setup.key).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  await p.fill('#cUrl', link); await p.click('#cGo'); await p.waitForSelector('.hero');
  const tabsBack = await p.evaluate(() => getComputedStyle(document.querySelector('#tabs')).display !== 'none');
  const hash = await p.evaluate(() => location.hash);
  await p.screenshot({ path: out + '/pwa_2_hoy.png' });
  const btnText = await p.textContent('.hero .btn');
  // 4) registrar y guardar
  await p.click('.hero .btn'); await p.waitForSelector('.item');
  const card = (await p.$$('.item'))[6];
  await (await card.$('.scale button[data-v="1"]')).click();
  await (await card.$('textarea')).fill('Desde la app instalable');
  await p.click('#saveBtn'); await p.waitForSelector('.toast.show');
  const writes = svc.writes.slice(-3);
  await p.screenshot({ path: out + '/pwa_3_guardado.png' });
  // 5) recargar: sigue conectado; service worker registrado
  await p.reload(); await p.waitForSelector('.hero');
  const sw = await p.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()));
  const manifestOk = await p.evaluate(async () => { const r = await fetch('manifest.webmanifest'); const j = await r.json(); return j.display + ' ' + j.icons.length; });
  // 6) Ajustes en modo web
  await p.click('nav [data-tab=mas]'); await p.click('text=Ajustes'); await p.waitForSelector('#discBtn');
  await p.screenshot({ path: out + '/pwa_4_ajustes.png' });
  console.log(JSON.stringify({ tabsHidden, tabsBack, hashLimpio: hash === '', boton: btnText.trim(), writes, sw, manifestOk, posts, errs }, null, 1));
  await b.close(); s1.close(); s2.close();
})().catch(e => { console.error(e); process.exit(1); });
