/**
 * 🌿 Microdosis — App web para celular
 * Lee y escribe directamente en la hoja de cálculo donde está instalado este script.
 *
 * Instalación: ver README.md (Extensiones ▸ Apps Script ▸ archivo App.gs + archivo HTML «Index» ▸ Implementar).
 */

var CFG = {
  sheet4D: 'Bitácora 4D ',
  sheetEnea: 'Bitácora',
  sheetForm: 'Formulario de inicio',
  defaultStart: '2026-04-13',   // Día 1 del proceso (se puede cambiar en Ajustes)
  lastDay: 86
};

// Filas de la hoja «Bitácora 4D»
var R4D = {
  week: 1, dayLabel: 3, date: 4,
  asignado: 6,   // columna de texto
  hora: 7,       // columna de puntaje
  toma: 7,       // columna de texto
  dosis: 8,      // columna de puntaje
  dosisNota: 8,  // columna de texto
  estado: 9,     // columna de puntaje
  gmFirst: 10, gmLast: 15,   // Comentarios generales
  eeFirst: 17, eeLast: 30    // Estados y efectos
};

// Filas de la hoja «Bitácora» (Eneatipo)
var REN = { cambios: 34, first: 35, last: 51 };

/* ===================== Web app ===================== */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Microdosis')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('mobile-web-app-capable', 'yes')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/* ===================== Utilidades ===================== */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sh_(name) {
  var s = ss_().getSheetByName(name);
  if (!s) throw new Error('No encuentro la hoja «' + name + '».');
  return s;
}
function props_() { return PropertiesService.getDocumentProperties(); }

function startDate_() {
  var s = props_().getProperty('START') || CFG.defaultStart;
  var p = s.split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}
function iso_(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function addDays_(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
function clean_(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }

/** Lista ordenada de registros: Línea base, Día 1..56, Cierre, Día 57..86, Cierre 2 */
function entries_() {
  var start = startDate_();
  var list = [{ id: 'LB', label: 'Línea base', short: 'Base', day: 0, date: iso_(addDays_(start, -1)), special: true }];
  for (var n = 1; n <= CFG.lastDay; n++) {
    list.push({ id: 'D' + n, label: 'Día ' + n, short: String(n), day: n, date: iso_(addDays_(start, n - 1)) });
    if (n === 56) list.push({ id: 'C1', label: 'Línea de cierre', short: 'Cierre', day: 56, date: iso_(addDays_(start, 55)), special: true });
  }
  list.push({ id: 'C2', label: 'Línea de cierre 2', short: 'Cierre 2', day: 86, date: iso_(addDays_(start, 85)), special: true });
  return list;
}

/** Columna (1-based) del puntaje en «Bitácora 4D». El texto va en la columna siguiente. */
function col4D_(id) {
  if (id === 'LB') return 5;
  if (id === 'C1') return 119;
  if (id === 'C2') return 181;
  var n = Number(String(id).replace('D', ''));
  if (!(n >= 1 && n <= CFG.lastDay)) throw new Error('Día inválido: ' + id);
  return n <= 56 ? 7 + 2 * (n - 1) : 121 + 2 * (n - 57);
}

/** Columna (1-based) del puntaje en «Bitácora» (Eneatipo). El texto va en la siguiente. */
function colEnea_(id) {
  if (id === 'LB') return 4;
  if (id === 'C1') return 176;
  if (id === 'C2') return null;
  var n = Number(String(id).replace('D', ''));
  if (n <= 30) return 7 + 3 * (n - 1);      // hay una columna extra entre el día 30 y el 31
  if (n <= 56) return 98 + 3 * (n - 31);
  return 179 + 3 * (n - 57);
}

/** Convierte texto para que Sheets no lo interprete como número, fecha o fórmula. */
function safeText_(t) {
  t = String(t == null ? '' : t);
  if (t === '') return '';
  if (/^[=+\-@]/.test(t) || /^\s*[\d.,]+\s*%?\s*$/.test(t) || /^\d{1,4}[\/\-.]\d{1,2}([\/\-.]\d{1,4})?$/.test(t)) return "'" + t;
  return t;
}
function scoreOut_(v) { return (typeof v === 'number' && isFinite(v)) ? v : null; }
function scoreIn_(v) {
  if (v === null || v === undefined || v === '') return '';
  var n = Number(v);
  if (!isFinite(n) || n < -3 || n > 3) throw new Error('Puntaje fuera de rango: ' + v);
  return Math.round(n);
}
function dosisOut_(v, disp) {
  if (typeof v === 'number') return Math.round(v * 100) + '%';
  return clean_(disp);
}
function dosisIn_(s) {
  s = String(s || '').trim();
  var m = s.match(/^(\d+(?:[.,]\d+)?)\s*%$/);
  if (m) return Number(m[1].replace(',', '.')) / 100;
  return safeText_(s);
}

/** Escribe sólo las celdas que cambiaron. changes = [[row, col, value], ...] */
function writeChanges_(sheet, changes) {
  changes.forEach(function (c) { sheet.getRange(c[0], c[1]).setValue(c[2]); });
  if (changes.length) SpreadsheetApp.flush();
  return changes.length;
}

/* ===================== API para la app ===================== */

/** Datos iniciales: participante, registros, preguntas, estado de cada día. */
function getBootstrap() {
  var s = sh_(CFG.sheet4D);
  var lastCol = s.getLastColumn();
  var top = s.getRange(1, 1, R4D.estado, lastCol).getDisplayValues();
  var labelsRange = s.getRange(R4D.gmFirst, 3, R4D.eeLast - R4D.gmFirst + 1, 1);
  var labels = labelsRange.getDisplayValues();
  var notes = labelsRange.getNotes();
  var scaleNote = s.getRange(R4D.gmFirst, 5).getNote();

  // Contenido por registro (para saber si hay datos)
  var body = s.getRange(R4D.gmFirst, 1, R4D.eeLast - R4D.gmFirst + 1, lastCol).getValues();

  var items = [];
  for (var r = R4D.gmFirst; r <= R4D.eeLast; r++) {
    if (r === 16) continue; // encabezado «Estados y efectos»
    var i = r - R4D.gmFirst;
    items.push({
      row: r,
      group: r <= R4D.gmLast ? 'gm' : 'ee',
      label: clean_(labels[i][0]).replace(/^Comentarios Generales, escribe libremente:\s*/i, ''),
      note: notes[i][0] || ''
    });
  }

  var weekHeaders = top[R4D.week - 1];
  var weekTitle = {}, cierre = [];
  weekHeaders.forEach(function (h) {
    h = clean_(h);
    var m = h.match(/^semana\s*(\d+)\s*(.*)$/i);
    if (m && !weekTitle[m[1]]) weekTitle[m[1]] = ('Semana ' + m[1] + ' ' + m[2].replace(/\(.*\)/, '')).trim();
    if (/cierre/i.test(h)) cierre.push(h);
  });
  var ents = entries_().map(function (e) {
    var c = col4D_(e.id);
    var week;
    if (e.id === 'LB') week = weekTitle['1'] || 'Semana 1 Línea base';
    else if (e.id === 'C1') week = cierre[0] || 'Línea de cierre';
    else if (e.id === 'C2') week = cierre[1] || 'Línea de cierre 2';
    else { var k = Math.floor((e.day - 1) / 7) + 2; week = weekTitle[String(k)] || ('Semana ' + k); }
    week = week.replace(/^SEMANA/, 'Semana').replace(/\s+/g, ' ');
    week = week.charAt(0) + week.slice(1).toLowerCase();
    var filled = 0;
    for (var j = 0; j < body.length; j++) {
      if (j === 16 - R4D.gmFirst) continue;
      if (body[j][c - 1] !== '' || body[j][c] !== '') filled++;
    }
    return {
      id: e.id, label: e.label, short: e.short, day: e.day, date: e.date, special: !!e.special,
      week: week,
      toma: e.special ? '' : clean_(top[R4D.toma - 1][c]),
      estado: clean_(top[R4D.estado - 1][c - 1]),
      filled: filled
    };
  });

  var name = '';
  try { name = clean_(sh_(CFG.sheetForm).getRange('E8').getDisplayValue()); } catch (e) {}

  return {
    name: name,
    start: iso_(startDate_()),
    today: iso_(new Date()),
    entries: ents,
    items: items,
    scaleNote: scaleNote,
    url: ss_().getUrl()
  };
}

/** Datos de un registro de la Bitácora 4D. */
function getEntry(id) {
  var s = sh_(CFG.sheet4D);
  var c = col4D_(id);
  var rng = s.getRange(1, c, R4D.eeLast, 2);
  var v = rng.getValues(), d = rng.getDisplayValues();
  var out = {
    id: id,
    asignado: clean_(d[R4D.asignado - 1][1]),
    hora: clean_(d[R4D.hora - 1][0]),
    toma: clean_(d[R4D.toma - 1][1]),
    dosis: dosisOut_(v[R4D.dosis - 1][0], d[R4D.dosis - 1][0]),
    dosisNota: String(d[R4D.dosisNota - 1][1] || ''),
    estado: clean_(d[R4D.estado - 1][0]),
    rows: {}
  };
  for (var r = R4D.gmFirst; r <= R4D.eeLast; r++) {
    if (r === 16) continue;
    out.rows[r] = { score: scoreOut_(v[r - 1][0]), text: String(d[r - 1][1] || '') };
  }
  return out;
}

/** Guarda un registro. data tiene la misma forma que getEntry (sólo se escriben los cambios). */
function saveEntry(id, data) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    var s = sh_(CFG.sheet4D);
    var c = col4D_(id), t = c + 1;
    var cur = getEntry(id);
    var ch = [];
    var special = (id === 'LB' || id === 'C1' || id === 'C2');
    if (!special) {
      if (data.asignado !== undefined && data.asignado !== cur.asignado) ch.push([R4D.asignado, t, data.asignado]);
      if (data.hora !== undefined && data.hora !== cur.hora) ch.push([R4D.hora, c, safeText_(data.hora)]);
      if (data.toma !== undefined && data.toma !== cur.toma) ch.push([R4D.toma, t, data.toma]);
      if (data.dosis !== undefined && data.dosis !== cur.dosis) ch.push([R4D.dosis, c, dosisIn_(data.dosis)]);
      if (data.dosisNota !== undefined && data.dosisNota !== cur.dosisNota) ch.push([R4D.dosisNota, t, safeText_(data.dosisNota)]);
    }
    if (data.estado !== undefined && data.estado !== cur.estado) ch.push([R4D.estado, c, data.estado]);
    Object.keys(data.rows || {}).forEach(function (k) {
      var r = Number(k);
      if (!(r >= R4D.gmFirst && r <= R4D.eeLast) || r === 16) return;
      var nv = data.rows[k], ov = cur.rows[r];
      var ns = scoreIn_(nv.score), os = ov.score === null ? '' : ov.score;
      if (ns !== os) ch.push([r, c, ns]);
      if ((nv.text || '') !== ov.text) ch.push([r, t, safeText_(nv.text || '')]);
    });
    var n = writeChanges_(s, ch);
    return { saved: n, entry: getEntry(id) };
  } finally {
    lock.releaseLock();
  }
}

/** Series de puntajes por pregunta para las gráficas. */
function getProgress() {
  var s = sh_(CFG.sheet4D);
  var lastCol = s.getLastColumn();
  var v = s.getRange(R4D.gmFirst, 1, R4D.eeLast - R4D.gmFirst + 1, lastCol).getValues();
  var series = {};
  var ents = entries_();
  for (var r = R4D.gmFirst; r <= R4D.eeLast; r++) {
    if (r === 16) continue;
    series[r] = ents.map(function (e) { return scoreOut_(v[r - R4D.gmFirst][col4D_(e.id) - 1]); });
  }
  return { ids: ents.map(function (e) { return e.id; }), series: series };
}

/** Todos los textos de una fila (p. ej. Sueños, fila 13) para el diario. */
function getJournal(row) {
  row = Number(row);
  var s = sh_(CFG.sheet4D);
  var lastCol = s.getLastColumn();
  var v = s.getRange(row, 1, 1, lastCol).getValues()[0];
  var d = s.getRange(row, 1, 1, lastCol).getDisplayValues()[0];
  return entries_().map(function (e) {
    var c = col4D_(e.id);
    return { id: e.id, score: scoreOut_(v[c - 1]), text: String(d[c] || '') };
  }).filter(function (x) { return x.text || x.score !== null; });
}

/** Guarda una sola pregunta (usado por el Diario de sueños). */
function saveItem(id, row, score, text) {
  var data = { rows: {} };
  data.rows[row] = { score: score, text: text };
  return saveEntry(id, data);
}

/* ---------- Eneatipo (hoja «Bitácora») ---------- */

function getEnea(id) {
  var s = sh_(CFG.sheetEnea);
  var c = colEnea_(id);
  var lab = s.getRange(REN.cambios, 2, REN.last - REN.cambios + 1, 1);
  var labels = lab.getDisplayValues(), notes = lab.getNotes();
  var pasionNote = s.getRange(REN.first, 4).getNote();
  var out = { id: id, available: !!c, title: clean_(labels[0][0]), cambios: '', items: [], pasionNote: pasionNote };
  var v = [], d = [];
  if (c) {
    var rng = s.getRange(REN.cambios, c, REN.last - REN.cambios + 1, 2);
    v = rng.getValues(); d = rng.getDisplayValues();
    out.cambios = clean_(d[0][0]);
  }
  for (var r = REN.first; r <= REN.last; r++) {
    var i = r - REN.cambios;
    out.items.push({
      row: r,
      label: clean_(labels[i][0]).replace(/^🎭\s*Rasgos\s*/, ''),
      note: notes[i][0] || '',
      score: c ? scoreOut_(v[i][0]) : null,
      text: c ? String(d[i][1] || '') : ''
    });
  }
  return out;
}

function saveEnea(id, data) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    var s = sh_(CFG.sheetEnea);
    var c = colEnea_(id);
    if (!c) throw new Error('Este registro no existe en la hoja de Eneatipo.');
    var cur = getEnea(id), ch = [];
    if (data.cambios !== undefined && data.cambios !== cur.cambios) ch.push([REN.cambios, c, data.cambios]);
    (data.items || []).forEach(function (it) {
      var o = cur.items.filter(function (x) { return x.row === it.row; })[0];
      if (!o) return;
      var ns = scoreIn_(it.score), os = o.score === null ? '' : o.score;
      if (ns !== os) ch.push([it.row, c, ns]);
      if ((it.text || '') !== o.text) ch.push([it.row, c + 1, safeText_(it.text || '')]);
    });
    return { saved: writeChanges_(s, ch), enea: getEnea(id) };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Formulario de inicio ---------- */

var FORM = {
  general: [
    ['E6', 'Fecha de hoy'], ['E8', 'Nombre'], ['E10', 'Fecha de nacimiento'],
    ['H10', 'Peso (kg)'], ['K10', 'Talla'], ['N10', 'Género'], ['H12', 'Eneatipo y subtipos']
  ],
  checkRows: [16, 17, 18, 19, 23, 24, 25, 27],
  checkCols: [['C', 'D'], ['F', 'G'], ['I', 'J'], ['L', 'M']],
  open: [['C29', 'C30'], ['C32', 'C33'], ['C36', 'C37'], ['C39', 'C40'], ['C42', 'C43'],
         ['C46', 'C47'], ['C49', 'C51'], ['C53', 'C54'], ['C56', 'C57'], ['C59', 'C60'], ['C62', 'C63']],
  sections: { 'C29': 'Condiciones de salud', 'C36': 'Sobre la intención', 'C46': 'Práctica y preparación' }
};

function getForm() {
  var s = sh_(CFG.sheetForm);
  var all = s.getRange(1, 1, 64, 17);
  var d = all.getDisplayValues(), v = all.getValues();
  function at(a1) { var r = s.getRange(a1); return { r: r.getRow() - 1, c: r.getColumn() - 1 }; }
  function disp(a1) { var p = at(a1); return d[p.r][p.c]; }
  var out = { general: [], checks: [], open: [] };
  FORM.general.forEach(function (g) { out.general.push({ cell: g[0], label: g[1], value: disp(g[0]) }); });
  FORM.checkRows.forEach(function (row) {
    FORM.checkCols.forEach(function (cc) {
      var label = clean_(disp(cc[1] + row));
      var raw = v[row - 1][cc[0].charCodeAt(0) - 65];
      if (label && typeof raw === 'boolean') {
        out.checks.push({ cell: cc[0] + row, label: label, value: raw, group: row >= 23 ? (cc[0] === 'I' || cc[0] === 'L' ? 'Sustancias psicoactivas' : 'Medicamentos') : 'Condiciones (último año)' });
      }
    });
  });
  FORM.open.forEach(function (o) {
    out.open.push({ cell: o[1], label: clean_(disp(o[0])), value: disp(o[1]), section: FORM.sections[o[0]] || '' });
  });
  return out;
}

function saveForm(data) {
  var s = sh_(CFG.sheetForm);
  var cur = getForm(), n = 0;
  var allowed = {};
  cur.general.concat(cur.open).forEach(function (x) { allowed[x.cell] = { type: 'text', value: x.value }; });
  cur.checks.forEach(function (x) { allowed[x.cell] = { type: 'bool', value: x.value }; });
  Object.keys(data || {}).forEach(function (cell) {
    var a = allowed[cell];
    if (!a) return;
    var nv = data[cell];
    if (a.type === 'bool') { nv = !!nv; if (nv !== a.value) { s.getRange(cell).setValue(nv); n++; } }
    else if (String(nv) !== String(a.value)) { s.getRange(cell).setValue(String(nv)); n++; }
  });
  SpreadsheetApp.flush();
  return { saved: n, form: getForm() };
}

/* ---------- Ajustes ---------- */

function setStart(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error('Fecha inválida');
  props_().setProperty('START', isoDate);
  return getBootstrap();
}
