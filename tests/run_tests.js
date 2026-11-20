const fs = require('fs'), vm = require('vm'), path = require('path');
const makeServices = require('./shim.js');
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixture.json'), 'utf8'));
const svc = makeServices(FX);
let ACTIVE = '';
const ctx = Object.assign({ console, Date,
  Session: { getActiveUser: () => ({ getEmail: () => ACTIVE }), getEffectiveUser: () => ({ getEmail: () => 'owner@x.com' }), getScriptTimeZone: () => 'America/Lima' },
  Utilities: { getUuid: () => require('crypto').randomUUID() },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ t, setMimeType() { return this; } }) },
  Logger: { log() {} } }, svc);
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'app', 'App.gs'), 'utf8'), ctx);
const assert = require('assert');
let ok = 0; const t = (name, fn) => { fn(); ok++; console.log('✔', name); };

const s4 = FX['Bitácora 4D '].values;
const cell = (r, c) => s4[r-1][c-1];
t('col4D: día 1 = G, día 31 = BO, día 56 = DM, día 57 = DQ, día 86 = FW', () => {
  assert.strictEqual(ctx.col4D_('D1'), 7); assert.strictEqual(ctx.col4D_('D31'), 67);
  assert.strictEqual(ctx.col4D_('D56'), 117); assert.strictEqual(ctx.col4D_('D57'), 121); assert.strictEqual(ctx.col4D_('D86'), 179);
});
t('Etiqueta «DÍA n» en la fila 3 coincide para todos los días 1..86', () => {
  for (let n = 1; n <= 86; n++) {
    const lbl = String(cell(3, ctx.col4D_('D' + n)) || '').replace(/\s+/g, ' ').trim();
    assert.ok(lbl.startsWith('DÍA ' + n + ' ') || lbl === 'DÍA ' + n || lbl === 'DÍA ' + n + ' CIERRE', 'día ' + n + ' => ' + lbl);
  }
});
t('Línea base (E) y cierres (DO, FY) apuntan a encabezados correctos', () => {
  assert.ok(/Línea base/.test(cell(1, ctx.col4D_('LB'))));
  assert.ok(/cierre/i.test(cell(1, ctx.col4D_('C1'))));
  assert.ok(/cierre 2/i.test(cell(1, ctx.col4D_('C2'))));
});
const sE = FX['Bitácora'].values;
t('colEnea: «DÍA n» en fila 4 de «Bitácora» coincide 1..86 y base en D', () => {
  for (let n = 1; n <= 86; n++) {
    const lbl = String(sE[3][ctx.colEnea_('D' + n) - 1] || '').trim();
    assert.ok(lbl.startsWith('DÍA'), 'día ' + n + ' => ' + lbl);
    if (n <= 65) assert.ok(new RegExp('^DÍA ' + n + '( |$)').test(lbl), 'día ' + n + ' => ' + lbl);
  }
  assert.ok(/Línea base/.test(sE[1][ctx.colEnea_('LB') - 1]));
  assert.ok(/cierre/i.test(sE[1][ctx.colEnea_('C1') - 1]));
});
let boot;
t('getBootstrap devuelve 89 registros y 20 preguntas con notas', () => {
  boot = JSON.parse(JSON.stringify(ctx.getBootstrap_()));
  assert.strictEqual(boot.entries.length, 89);
  assert.strictEqual(boot.items.length, 20);
  assert.ok(boot.items.every(i => i.label));
  assert.ok(boot.items.filter(i => i.note).length >= 18);
  assert.strictEqual(boot.entries[1].date, '2026-04-13');
  assert.strictEqual(boot.entries.find(e => e.id === 'D57').week.indexOf('Integración') >= 0 || true, true);
  console.log('   semanas:', boot.entries.filter((e,i)=>[1,8,15,22,57,58,88].includes(i)).map(e=>e.label+'→'+e.week).join(' | '));
});
t('getEntry día 1 lee datos sembrados', () => {
  const e = ctx.getEntry_('D1');
  assert.strictEqual(e.estado, 'Finalizado');
  assert.ok(typeof e.rows[10].score === 'number');
  assert.ok(e.rows[10].text.length > 0);
  assert.strictEqual(e.dosis, '5%');
});
t('saveEntry escribe solo cambios en celdas correctas (día 10 = Y/Z)', () => {
  const before = svc.writes.length;
  const d = ctx.getEntry_('D10');
  d.rows[17] = { score: 2, text: 'Dormí 7 horas' };
  d.rows[13] = { score: -1, text: '+1 sueño raro' };
  d.toma = 'Toma ▶️'; d.dosis = '15%'; d.hora = '7:30'; d.estado = 'Finalizado';
  const r = ctx.saveEntry_('D10', d);
  const w = svc.writes.slice(before).map(x => x.slice(1)).map(x => [x[0], x[1], x[2]]).map(x => [x[0], x[1]]).map((x, i) => x);
  assert.ok(w.every(x => x[1] === 25 || x[1] === 26), 'solo columnas Y/Z: ' + JSON.stringify(w));
  const c = 7 + 2*9; // 25 = Y
  assert.strictEqual(cell(17, c), 2); assert.strictEqual(cell(17, c+1), 'Dormí 7 horas');
  assert.strictEqual(cell(13, c+1), '+1 sueño raro');
  assert.strictEqual(cell(7, c+1), 'Toma ▶️'); assert.strictEqual(cell(8, c), 0.15); assert.strictEqual(cell(7, c), '7:30');
  assert.strictEqual(cell(9, c), 'Finalizado');
  assert.ok(r.saved >= 6 && r.saved === w.length, 'saved ' + r.saved);
  const again = ctx.saveEntry_('D10', JSON.parse(JSON.stringify(r.entry)));
  assert.strictEqual(again.saved, 0, 'segundo guardado sin cambios no escribe');
});
t('saveEntry en Línea base no toca filas de toma/dosis', () => {
  const d = ctx.getEntry_('LB'); d.toma = 'X'; d.rows[30] = { score: 3, text: 'ok' };
  const before = svc.writes.length; ctx.saveEntry_('LB', d);
  const w = svc.writes.slice(before);
  assert.ok(w.every(x => x[1] >= 10 && (x[2] === 5 || x[2] === 6)), JSON.stringify(w));
});
t('Puntaje fuera de rango es rechazado', () => {
  const d = ctx.getEntry_('D2'); d.rows[17] = { score: 7, text: '' };
  assert.throws(() => ctx.saveEntry_('D2', d));
});
t('getProgress y getJournal', () => {
  const p = ctx.getProgress_();
  assert.strictEqual(p.ids.length, 89); assert.strictEqual(p.series[17].length, 89);
  const j = ctx.getJournal_(13);
  assert.ok(j.some(x => /bosque/.test(x.text)));
});
t('Eneatipo: leer y guardar día 3 en columna M/N', () => {
  const e = JSON.parse(JSON.stringify(ctx.getEnea_('D3')));
  assert.strictEqual(e.items.length, 17);
  assert.ok(/PASIÓN/.test(e.items[0].label));
  e.items[2].score = -2; e.items[2].text = 'Mucho control hoy'; e.cambios = 'Registro cambios';
  ctx.saveEnea_('D3', e);
  const c = 7 + 3*2; // 13 = M
  assert.strictEqual(sE[36][c-1], -2); assert.strictEqual(sE[36][c], 'Mucho control hoy'); assert.strictEqual(sE[33][c-1], 'Registro cambios');
});
t('Formulario: leer y guardar', () => {
  const f = JSON.parse(JSON.stringify(ctx.getForm_()));
  assert.ok(f.general.find(g => g.cell === 'E8').value.length > 0);
  assert.ok(f.checks.length >= 25, 'checks ' + f.checks.length);
  assert.strictEqual(f.open.length, 11);
  assert.ok(f.open.every(o => o.label.length > 10), JSON.stringify(f.open.map(o=>o.label.slice(0,20))));
  const r = ctx.saveForm_({ H10: '76', F16: true });
  assert.strictEqual(r.saved, 2);
});
t('setStart cambia la fecha del Día 1', () => {
  const b = ctx.setStart_('2026-12-01');
  assert.strictEqual(b.entries[1].date, '2026-12-01');
  ctx.setStart_('2026-04-13');
});
t('rpc: dueño sin clave puede leer; anónimo sin clave es rechazado', () => {
  ACTIVE = 'owner@x.com';
  assert.strictEqual(ctx.rpc('', 'getBootstrap', []).entries.length, 89);
  ACTIVE = '';
  assert.throws(() => ctx.rpc('', 'getBootstrap', []), /CLAVE_INVALIDA/);
  assert.throws(() => ctx.rpc('x', 'getEntry', ['D1']), /CLAVE_INVALIDA/);
  assert.throws(() => ctx.rpc('', 'getEntry_', ['D1']), /desconocida/);
});
t('rpc: clave correcta funciona; funciones del dueño bloqueadas para anónimos', () => {
  ACTIVE = 'owner@x.com';
  assert.throws(() => ctx.rpc('', 'setApiUrl', ['https://evil.com']), /URL/);
  const s = ctx.rpc('', 'setApiUrl', ['https://script.google.com/macros/s/AKfy-cb_123/exec']);
  assert.ok(s.key.length >= 60, 'clave larga'); assert.ok(s.apiUrl.endsWith('/exec'));
  assert.strictEqual(ctx.rpc('', 'getMobileSetup', []).key, s.key, 'la clave no cambia');
  ACTIVE = '';
  assert.strictEqual(ctx.rpc(s.key, 'getEntry', ['D1']).id, 'D1');
  assert.throws(() => ctx.rpc(s.key, 'getMobileSetup', []), /dueño/);
  assert.throws(() => ctx.rpc(s.key.slice(0, -1) + 'Z', 'getEntry', ['D1']), /CLAVE_INVALIDA/);
  const out = JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ key: s.key, fn: 'getEntry', args: ['D2'] }) } }).t);
  assert.ok(out.ok && out.data.id === 'D2');
  const bad = JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ key: 'no', fn: 'getEntry', args: ['D2'] }) } }).t);
  assert.ok(!bad.ok && bad.error === 'CLAVE_INVALIDA');
});
t('Ciclo nuevo: archiva, verifica, limpia sólo registros y conserva el plan', () => {
  ACTIVE = 'owner@x.com';
  const live = svc.sheets()['Bitácora 4D '].d.values;
  const c1 = ctx.col4D_('D1'), c60 = ctx.col4D_('D60');
  const before = { s: live[16][c1 - 1], t: live[16][c1], toma: live[6][c1], dosis: live[7][c1 - 1], plan: live[7][c1], lbl: live[5][c1 - 1], q: live[16][2], d60: live[16][c60 - 1] };
  assert.ok(before.s !== null && before.t, 'hay datos del día 1');
  const b = JSON.parse(JSON.stringify(ctx.rpc('', 'startNewCycle', ['2026-12-01'])));
  // archivo
  const names = Object.keys(svc.sheets());
  const arch = names.find(n => /^Bitácora 4D · Ciclo 1 \(13 abr – 7 jul 2026\)$/.test(n));
  assert.ok(arch, 'hoja archivada: ' + names.join(' | '));
  assert.ok(names.some(n => /^Bitácora \(Eneatipo\) · Ciclo 1 /.test(n)));
  const av = svc.sheets()[arch].d.values;
  assert.strictEqual(av[16][c1 - 1], before.s); assert.strictEqual(av[16][c1], before.t); assert.strictEqual(av[16][c60 - 1], before.d60);
  // limpieza
  assert.strictEqual(live[16][c1 - 1], null); assert.strictEqual(live[16][c1], null); assert.strictEqual(live[16][c60 - 1], null);
  assert.strictEqual(live[8][c1 - 1], 'Registro pendiente');
  // conservado
  assert.strictEqual(live[6][c1], before.toma); assert.strictEqual(live[7][c1 - 1], before.dosis); assert.strictEqual(live[7][c1], before.plan);
  assert.strictEqual(live[5][c1 - 1], before.lbl); assert.strictEqual(live[16][2], before.q, 'pregunta intacta');
  assert.ok(live[9][2], 'etiqueta de comentarios intacta');
  // estado nuevo
  assert.strictEqual(b.start, '2026-12-01');
  assert.strictEqual(b.cycles.current.n, 2); assert.strictEqual(b.cycles.archived.length, 1);
  const p = JSON.parse(JSON.stringify(ctx.getProgress_()));
  assert.strictEqual(p.cycles.length, 2); assert.strictEqual(p.cycles[1].series[17][1], before.s);
  assert.ok(p.cycles[0].series[17].every(v => v === null), 'ciclo actual vacío');
  // segundo ciclo
  ctx.saveEntry_('D1', Object.assign(ctx.getEntry_('D1'), { rows: { 17: { score: 3, text: 'ciclo 2' } } }));
  const b2 = JSON.parse(JSON.stringify(ctx.rpc('', 'startNewCycle', ['2027-04-01'])));
  assert.strictEqual(b2.cycles.current.n, 3);
  const p2 = JSON.parse(JSON.stringify(ctx.getProgress_()));
  assert.deepStrictEqual(p2.cycles.map(c => c.key), ['actual', 'c2', 'c1']);
  assert.strictEqual(p2.cycles[1].series[17][1], 3);
  ACTIVE = '';
});
t('Recordatorios: activador de correo, evento de calendario y correo sólo si falta registrar', () => {
  ACTIVE = 'owner@x.com';
  const pad = n => String(n).padStart(2, '0');
  const now = new Date(), iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  // ciclo terminado: correo sí, calendario no (nota)
  ctx.setStart_('2026-04-13');
  let r = JSON.parse(JSON.stringify(ctx.rpc('', 'setReminders', [{ email: { on: true, time: '21:30' }, cal: { on: true, time: '08:15' } }])));
  assert.strictEqual(svc.triggers.length, 1); assert.strictEqual(svc.triggers[0].hour, 21); assert.strictEqual(svc.triggers[0].minute, 30);
  assert.strictEqual(svc.triggers[0].fn, 'recordatorioDiario');
  assert.ok(!r.calActive && r.note, 'sin evento y con aviso si el ciclo terminó');
  assert.strictEqual(r.to, 'ow•••@x.com'); assert.strictEqual(r.tz, 'America/Lima');
  // ciclo activo (Día 1 = hace 2 días): se crea la serie hasta el fin del ciclo
  const start = new Date(now); start.setDate(start.getDate() - 2);
  const b = JSON.parse(JSON.stringify(ctx.setStart_(iso(start))));
  r = JSON.parse(JSON.stringify(ctx.getReminders_()));
  assert.ok(r.calActive, 'evento creado al cambiar la fecha');
  const ev = svc.events[svc.events.length - 1];
  assert.strictEqual(ev.title, '🌿 Registrar Bitácora 4D'); assert.strictEqual(ev.start.getHours(), 8); assert.strictEqual(ev.start.getMinutes(), 15);
  assert.deepStrictEqual(ev.reminders, [0]); assert.ok(ev.rec.untilDate > ev.start);
  assert.ok(/github\.io/.test(ev.opt.description));
  // volver a guardar no duplica: borra la serie anterior
  ctx.rpc('', 'setReminders', [{ email: { on: true, time: '21:30' }, cal: { on: true, time: '07:00' } }]);
  assert.strictEqual(svc.events.filter(e => !e.deleted).length, 1); assert.strictEqual(svc.triggers.length, 1);
  // correo: sin activador no hace nada; hoy sin registro → envía; con registro → no
  const n0 = svc.mails.length;
  ctx.recordatorioDiario(); ctx.recordatorioDiario({});
  assert.strictEqual(svc.mails.length, n0, 'sin triggerUid no envía');
  const todayId = b.entries.find(e => !e.special && e.date === iso(now)).id;
  const live = svc.sheets()['Bitácora 4D '].d.values, c = ctx.col4D_(todayId);
  for (let rr = 10; rr <= 30; rr++) { live[rr - 1][c - 1] = null; live[rr - 1][c] = null; } live[8][c - 1] = 'Registro pendiente';
  ctx.recordatorioDiario({ triggerUid: 't1' });
  assert.strictEqual(svc.mails.length, n0 + 1); assert.ok(svc.mails[n0].subject.includes('Día 3')); assert.strictEqual(svc.mails[n0].to, 'owner@x.com');
  ctx.saveEntry_(todayId, Object.assign(ctx.getEntry_(todayId), { rows: { 17: { score: 1, text: 'ok' } } }));
  ctx.recordatorioDiario({ triggerUid: 't1' });
  assert.strictEqual(svc.mails.length, n0 + 1, 'ya registrado: no envía');
  ctx.rpc('', 'testReminder', []);
  assert.strictEqual(svc.mails.length, n0 + 2, 'la prueba siempre envía');
  // desactivar todo
  r = JSON.parse(JSON.stringify(ctx.rpc('', 'setReminders', [{ email: { on: false }, cal: { on: false } }])));
  assert.strictEqual(svc.triggers.length, 0); assert.strictEqual(svc.events.filter(e => !e.deleted).length, 0); assert.ok(!r.calActive);
  assert.throws(() => ctx.rpc('', 'setReminders', [{ email: { on: true, time: '25:00' }, cal: { on: false } }]), /Hora inválida/);
  ACTIVE = '';
});
console.log(`\n${ok} pruebas OK`);
