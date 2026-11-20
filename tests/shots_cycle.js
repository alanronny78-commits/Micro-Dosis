const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const out = process.argv[2] || require('path').join(__dirname, 'shots'); require('fs').mkdirSync(out, { recursive: true });
  const c = await b.newContext({ ...devices['iPhone 13'] });
  const p = await c.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  await p.goto('file://' + __dirname + '/preview.html'); await p.waitForSelector('.hero');
  await p.screenshot({ path: out + '/c1_hoy_fin.png' });
  await p.click('button:has-text("Ciclo nuevo")'); await p.waitForSelector('#ncGo');
  const disabled = await p.$eval('#ncGo', e => e.disabled);
  await p.fill('#ncDate', '2026-11-19');
  await p.screenshot({ path: out + '/c2_confirmar.png' });
  await p.check('#ncOk'); await p.click('#ncGo');
  await p.waitForSelector('.toast.show'); await p.waitForSelector('.hero');
  const heroTxt = (await p.textContent('.hero')).replace(/\s+/g, ' ');
  await p.screenshot({ path: out + '/c3_hoy_nuevo.png' });
  // registrar el día 1 del ciclo nuevo
  await p.click('.hero .btn'); await p.waitForSelector('.item');
  for (const [i, v] of [[6, 2], [7, 2], [8, 3]]) { const card = (await p.$$('.item'))[i]; await (await card.$(`.scale button[data-v="${v}"]`)).click(); }
  await p.click('#saveBtn'); await p.waitForSelector('.toast.show');
  await p.click('nav [data-tab=prog]'); await p.waitForSelector('svg.chart');
  await p.click('#pchips [data-r="17"]');
  await p.screenshot({ path: out + '/c4_progreso.png', fullPage: true });
  await p.click('nav [data-tab=mas]'); await p.click('button:has-text("Ajustes")'); await p.waitForSelector('#startIn', { state: 'attached' });
  await p.screenshot({ path: out + '/c5_ajustes.png' });
  const sheets = await p.evaluate(() => Object.keys(__svc.sheets()));
  console.log(JSON.stringify({ disabledAntesDeConfirmar: disabled, heroTxt: heroTxt.slice(0, 120), sheets, errs }, null, 1));
  await b.close();
})();
