/**
 * 🌿 Bitácora de Microdosis — navegación interactiva para Google Sheets
 *
 * Instalación (una sola vez):
 *  1. En la hoja de cálculo: Extensiones ▸ Apps Script.
 *  2. Borra lo que haya en el editor, pega TODO este código y pulsa 💾 Guardar.
 *  3. Vuelve a la hoja y recarga la página (F5).
 *  4. Aparece el menú «🌿 Microdosis». Ejecuta «⚙️ Configurar (primera vez)»
 *     y acepta los permisos que pide Google (solo actúan sobre este archivo).
 */

var HOJAS_BITACORA = {
  'Bitácora 4D ': 4,      // fila donde están las fechas
  'Diario de sueños': 4,
  'Bitácora': 5,
  'Bitácora bis1': 5
};
var INDICE = '🏠 ÍNDICE';

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var ir = ui.createMenu('📑 Ir a hoja')
    .addItem('🏠 Índice', 'irIndice')
    .addItem('ℹ️ Información', 'irInformacion')
    .addItem('📝 Formulario de inicio', 'irFormulario')
    .addItem('🧭 Bitácora 4D', 'irBitacora4D')
    .addItem('🌙 Diario de sueños', 'irDiario')
    .addItem('📘 Bitácora (Eneatipo)', 'irBitacora')
    .addItem('📗 Bitácora bis1', 'irBitacoraBis');
  ui.createMenu('🌿 Microdosis')
    .addItem('📅 Ir a HOY en esta bitácora', 'irAHoy')
    .addItem('📅 Ir a HOY en Bitácora 4D', 'irAHoy4D')
    .addSeparator()
    .addSubMenu(ir)
    .addSeparator()
    .addItem('⚙️ Configurar (primera vez)', 'configurar')
    .addToUi();
}

/* ---------- Navegación ---------- */
function irA_(nombre, rango) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(nombre);
  if (!sh) { SpreadsheetApp.getUi().alert('No encuentro la hoja: ' + nombre); return; }
  ss.setActiveSheet(sh);
  sh.setActiveRange(sh.getRange(rango || 'A1'));
}
function irIndice()      { irA_(INDICE, 'B2'); }
function irInformacion() { irA_('INFORMACIÓN', 'B1'); }
function irFormulario()  { irA_('Formulario de inicio', 'C3'); }
function irBitacora4D()  { irA_('Bitácora 4D ', 'E1'); }
function irDiario()      { irA_('Diario de sueños', 'D1'); }
function irBitacora()    { irA_('Bitácora', 'D2'); }
function irBitacoraBis() { irA_('Bitácora bis1', 'C2'); }

function irAHoy4D() { irAHoyEn_(SpreadsheetApp.getActive().getSheetByName('Bitácora 4D ')); }
function irAHoy()   {
  var sh = SpreadsheetApp.getActiveSheet();
  if (!(sh.getName() in HOJAS_BITACORA)) sh = SpreadsheetApp.getActive().getSheetByName('Bitácora 4D ');
  irAHoyEn_(sh);
}

/** Busca la fecha de hoy en la fila de fechas y selecciona esa columna. */
function irAHoyEn_(sh) {
  var ss = SpreadsheetApp.getActive();
  var fila = HOJAS_BITACORA[sh.getName()];
  var valores = sh.getRange(fila, 1, 1, sh.getLastColumn()).getValues()[0];
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var mejor = -1, mejorFecha = null;
  for (var c = 0; c < valores.length; c++) {
    var v = valores[c];
    if (v instanceof Date) {
      var d = new Date(v); d.setHours(0, 0, 0, 0);
      if (d.getTime() === hoy.getTime()) { mejor = c; break; }
      if (d <= hoy && (!mejorFecha || d > mejorFecha)) { mejor = c; mejorFecha = d; }
    }
  }
  ss.setActiveSheet(sh);
  if (mejor < 0) {
    SpreadsheetApp.getUi().alert('El proceso aún no empieza (no hay fechas anteriores a hoy).');
    sh.setActiveRange(sh.getRange(fila, 1));
    return;
  }
  sh.setActiveRange(sh.getRange(fila, mejor + 1));
  if (!mejorFecha || mejorFecha.getTime() !== hoy.getTime()) {
    ss.toast('No hay columna exacta para hoy; te llevé al último día registrado.', '🌿 Microdosis', 5);
  }
}

/* ---------- Configuración inicial ---------- */
function configurar() {
  var ss = SpreadsheetApp.getActive();

  // 1) Casillas de verificación en el Formulario de inicio (celdas TRUE/FALSE)
  var f = ss.getSheetByName('Formulario de inicio');
  if (f) {
    var datos = f.getDataRange().getValues();
    for (var r = 0; r < datos.length; r++)
      for (var c = 0; c < datos[r].length; c++)
        if (typeof datos[r][c] === 'boolean') f.getRange(r + 1, c + 1).insertCheckboxes();
  }

  // 2) Re-crear los enlaces del Índice con el formato nativo de Google (#gid=)
  var ix = ss.getSheetByName(INDICE);
  if (ix) {
    var rng = ix.getRange(1, 1, ix.getLastRow(), 9);
    var rich = rng.getRichTextValues();
    var nuevos = [];
    for (var i = 0; i < rich.length; i++) {
      nuevos.push([]);
      for (var j = 0; j < rich[i].length; j++) {
        var rt = rich[i][j], url = rt ? rt.getLinkUrl() : null;
        var m = url && url.match(/#'?(.+?)'?!([A-Z]+\d+)$/);
        if (m) {
          var dest = ss.getSheetByName(m[1]);
          if (dest) {
            var gidUrl = '#gid=' + dest.getSheetId() + '&range=' + m[2];
            rt = SpreadsheetApp.newRichTextValue().setText(rt.getText()).setLinkUrl(gidUrl).build();
          }
        }
        nuevos[i].push(rt);
      }
    }
    // escribir solo celdas con texto (no tocar fórmulas)
    var formulas = rng.getFormulas();
    for (var a = 0; a < nuevos.length; a++)
      for (var b = 0; b < nuevos[a].length; b++)
        if (!formulas[a][b] && nuevos[a][b] && nuevos[a][b].getText() !== '')
          ix.getRange(a + 1, b + 1).setRichTextValue(nuevos[a][b]);
  }

  ss.setActiveSheet(ix || ss.getSheets()[0]);
  ss.toast('Listo: casillas activadas y enlaces del índice actualizados.', '🌿 Microdosis', 6);
}

/**
 * Función personalizada usada en 'Bitácora 4D'!A3 (=getid()).
 * Devuelve el identificador de este archivo de Google Sheets.
 */
function getid() {
  return SpreadsheetApp.getActive().getId();
}
