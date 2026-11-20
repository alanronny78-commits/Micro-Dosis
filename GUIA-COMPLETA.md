# 🌿 Microdosis — Guía completa, respaldo y réplica

Documento de respaldo del proyecto: qué se hizo, cómo funciona, cómo instalarlo desde cero, cómo mantenerlo,
cómo replicarlo para otra persona u otra bitácora, y el código completo de cada archivo (apéndices).

> Generado con `node tools/build-guia.js` a partir de los archivos del repositorio. Si cambias el código, vuelve a generarlo.

---

## 1. Resumen de lo que se hizo

| # | Etapa | Resultado |
|---|---|---|
| 1 | **Excel → Google Sheets** | Se partió de un Excel de la Bitácora 4D (6 hojas). Se generó una versión con una hoja **🏠 ÍNDICE** de navegación y un script de menú (`Microdosis_AppsScript.gs`, ver Apéndice F). |
| 2 | **Hoja original recuperada** | Con el conector de Google Drive se encontró la hoja original en Drive (compartida por el organizador, sólo lectura) **con todos los registros**. Se hizo una **copia propia y editable** y se le añadió la hoja **🏠 ÍNDICE** con enlaces a cada hoja, semana y sección. |
| 3 | **App web para celular (Apps Script)** | `App.gs` + `Index.html` instalados en la hoja: pantallas Hoy, Registrar, Progreso, Sueños, Eneatipo, Formulario y Ajustes. Lee y escribe directo en la hoja. |
| 4 | **App instalable (PWA)** | La misma interfaz publicada en **GitHub Pages** (`docs/`), a pantalla completa, con ícono propio. Habla con la hoja a través de una implementación pública del script protegida con **clave secreta**. |
| 5 | **Correcciones** | Botón «último día registrado», pantalla de conexión clara, reconocimiento del dueño, enlace de conexión, diagnóstico de errores de red. |
| 6 | **Ciclos** | Botón **«Empezar ciclo nuevo»**: archiva el ciclo en hojas aparte, limpia sólo los registros y fija el nuevo Día 1. **Progreso** compara ciclos. |
| 7 | **Respaldo** | Esta guía, pruebas automáticas (`tests/`) y un .zip con todo. |
| 8 | **Recordatorios diarios** | Aviso en el celular vía Google Calendar y correo diario sólo si falta registrar. |

---

## 2. Cómo funciona (arquitectura)

```
 ┌────────────────────────┐        google.script.run         ┌──────────────────────────────┐
 │ App de Apps Script     │ ───────────────────────────────▶ │                              │
 │ (script.google.com)    │   implementación PRIVADA         │   App.gs  (rpc / doPost)     │
 │ «Solo yo»              │   Ejecutar como: usuario que     │   ─ valida dueño o clave     │
 └────────────────────────┘   accede                         │   ─ lee/escribe la hoja      │
                                                             │                              │
 ┌────────────────────────┐   fetch POST (JSON + clave)      │                              │──▶ Hoja de Google
 │ App instalable (PWA)   │ ───────────────────────────────▶ │                              │    (Bitácora 4D,
 │ GitHub Pages /docs     │   implementación PÚBLICA         │                              │     Bitácora, Formulario,
 │ pantalla completa      │   Ejecutar como: Yo              └──────────────────────────────┘     ciclos archivados)
 └────────────────────────┘   Acceso: Cualquier usuario
```

- **Un solo código de interfaz** (`app/Index.html`) sirve para las dos apps: detecta si corre dentro de Apps Script (`google.script.run`) o como PWA (`fetch`).
- **`docs/index.html`** se genera desde `app/Index.html` con `node tools/build-pwa.js` (agrega manifest, íconos y service worker).
- **Seguridad:** todas las funciones de datos terminan en `_` (no se pueden llamar desde fuera). Sólo existen `rpc()` y `doPost()`, que exigen ser el dueño **o** la clave (`API_KEY`, ~70 caracteres, guardada en las propiedades del script). La implementación pública sin clave no muestra ni guarda nada.
- **Datos:** sólo en la hoja de Google. La PWA guarda en el celular la URL pública y la clave (localStorage) y una copia de la interfaz (service worker), nunca tus registros.

---

## 3. Estructura de la hoja (mapa de celdas)

### 3.1 «Bitácora 4D » (¡el nombre lleva un espacio al final!)

Dos columnas por registro: **puntaje** (−3…+3) y **comentario** (la siguiente).

| Registro | Columnas | Fórmula en el código (`col4D_`) |
|---|---|---|
| Línea base | E / F | 5 |
| Día 1 … Día 56 | G/H … DM/DN | `7 + 2·(n−1)` |
| Línea de cierre | DO / DP | 119 |
| Día 57 … Día 86 | DQ/DR … FW/FX | `121 + 2·(n−57)` |
| Línea de cierre 2 | FY / FZ | 181 |

| Fila | Contenido | Columna |
|---|---|---|
| 1 | Encabezados de semana | — |
| 3 / 4 | «DÍA n» / fecha (texto) | — |
| 6 | Asignado / Cambio | comentario |
| 7 | Hora · Toma ▶️ / Descanso ⏸️ (plan) | puntaje · comentario |
| 8 | Dosis (5 %, 10 %…) · «Calibración», «T» (plan) | puntaje · comentario |
| 9 | Estado del registro | puntaje |
| 10–15 | Comentarios generales (cómo te sentiste, algo distinto, alimentación, sueños, sexualidad, menstruación) | ambas |
| 16 | Encabezado «Estados y efectos» | — |
| 17–30 | 14 estados (sueño, energía, ánimo … transpersonal) | ambas |
| D10:D30 | Fórmula «último valor» (no se toca) | — |

Las **notas** (explicaciones de cada estado) se leen de la columna C y la escala de E10.

### 3.2 «Bitácora» (Eneatipo)

Tres columnas por día. Base = D, Día 1–30 = `7 + 3·(n−1)` (G … CP), **una columna extra**, Día 31–56 = `98 + 3·(n−31)` (CT … FQ),
Cierre = FT (176), Día 57–86 = `179 + 3·(n−57)` (FW … JF). Fila 34 «Registro cambios / Sin cambios», filas 35–51 pasión, 15 rasgos y virtud.

### 3.3 «Formulario de inicio»

Datos generales en E6, E8, E10, H10, K10, N10, H12; casillas en C/F/I/L de las filas 16–19, 23–25 y 27; respuestas abiertas en C30, C33, C37, C40, C43, C47, C51, C54, C57, C60, C63.

### 3.4 Propiedades del script (Apps Script ▸ ⚙️ Configuración del proyecto ▸ Propiedades)

| Clave | Para qué |
|---|---|
| `START` | Fecha del Día 1 del ciclo actual (AAAA-MM-DD). Si no existe se usa `CFG.defaultStart`. |
| `API_KEY` | Clave secreta de la app instalable. |
| `API_URL` | URL `/exec` de la implementación pública. |
| `CYCLES` | Lista JSON de ciclos archivados (número, fechas e ID de sus hojas). |
| `REMINDERS` | Configuración de recordatorios (correo y calendario, horas, ID del evento). |

---

## 4. Archivos del proyecto

| Ruta | Qué es |
|---|---|
| `app/App.gs` | Servidor (Apps Script): acceso, API, lectura/escritura, ciclos. **Se pega en Apps Script.** |
| `app/Index.html` | Interfaz de la app. **Se pega en Apps Script** (archivo HTML llamado `Index`). |
| `docs/index.html` | Interfaz para GitHub Pages (generada). |
| `docs/manifest.webmanifest`, `docs/sw.js`, `docs/icons/` | Lo que hace instalable a la PWA. |
| `tools/build-pwa.js` | Genera `docs/index.html` desde `app/Index.html`. |
| `tools/build-guia.js`, `tools/guia-plantilla.md` | Generan esta guía. |
| `tests/` | Pruebas automáticas (ver `tests/README.md`). |
| `README.md` | Resumen corto e instalación. |

---

## 5. Instalación desde cero

### 5.1 La hoja
1. Ten la hoja de la bitácora en **tu** Google Drive (si te la compartieron sólo para ver: **Archivo ▸ Hacer una copia**).
2. (Opcional) Si partes de un Excel: súbelo a Drive ▸ Abrir con Hojas de cálculo ▸ **Archivo ▸ Guardar como hoja de cálculo de Google**.

### 5.2 El script
1. En la hoja: **Extensiones ▸ Apps Script**. Si ya hay código (p. ej. `getid()`), **no lo borres**.
2. **＋ (junto a «Archivos») ▸ Secuencia de comandos** → nombre `App` → pega `app/App.gs` completo.
3. **＋ ▸ HTML** → nombre exacto `Index` → pega `app/Index.html` completo.
4. 💾 Guardar. Comprueba el final de cada archivo (App.gs termina con `return getBootstrap_();` y `}`; Index.html con `</html>`).
5. Si la fecha del Día 1 no es la de `CFG.defaultStart`, cámbiala luego en la app (Ajustes) o edita `defaultStart`.

> ⚠️ Copia el código **sin la traducción automática del navegador** y con el botón **«Copy raw file»** (dos cuadraditos) de GitHub. La traducción cambia el código (`var` → `Var`, borra `//`) y seleccionar con el ratón puede cortar archivos largos.

### 5.3 Dos implementaciones
**Implementar ▸ Nueva implementación ▸ ⚙️ Aplicación web**, dos veces:

| | Ejecutar como | Quién tiene acceso | Uso |
|---|---|---|---|
| **Privada** | **Usuario que accede a la aplicación web** | **Solo yo** | App de Apps Script, sin clave |
| **Pública** | **Yo** | **Cualquier usuario** (¡no «con una cuenta de Google»!) | La usa la PWA, con clave |

Acepta los permisos («Google no ha verificado esta aplicación» ▸ Configuración avanzada ▸ Ir a…). Copia las dos URL `/exec`.

### 5.4 Clave y URL pública
1. En `App.gs`, función `guardarUrlPublica`, pon tu URL pública entre las comillas de `URL_PUBLICA`.
2. Elige `guardarUrlPublica` junto a ▶ Ejecutar ▸ **Ejecutar**.
3. El **Registro de ejecución** muestra `Tu clave: …` y el **enlace de conexión** `https://<usuario>.github.io/<repo>/#setup=…`.
   (Alternativa: en la app privada, **Más ▸ Ajustes ▸ App instalable** ▸ pega la URL pública ▸ Guardar.)

### 5.5 GitHub Pages (app instalable)
1. Repositorio con las carpetas `app/`, `docs/`, `tools/`. GitHub Pages gratis exige repositorio **público** (Settings ▸ General ▸ Danger Zone ▸ Change visibility). Sólo contiene código, nunca datos ni la clave.
2. **Settings ▸ Pages ▸ Deploy from a branch** ▸ rama del proyecto ▸ carpeta **/docs** ▸ Save. Espera 1–2 min.
3. Si tu usuario/repositorio es otro, cambia `CFG.pwaUrl` en `App.gs`.

### 5.6 En el celular
1. Abre el **enlace de conexión** (`…#setup=…`) en **Chrome** (si se abre dentro de WhatsApp: ⋮ ▸ Abrir en Chrome). La app abre ya conectada.
2. **⋮ ▸ Instalar app**. Aparece el ícono 🌿 Microdosis.
3. (Opcional) Abre también la URL privada y agrégala a la pantalla de inicio.

---

## 6. Uso

- **Hoy:** día del proceso, toma/descanso, estado, calendario de 86 días; si el ciclo terminó, abre el último día registrado o empieza uno nuevo.
- **Registrar:** toma del día, 6 comentarios y 14 estados con botones −3…+3 (tocar otra vez borra), «copiar del día anterior», estado. Botón **Guardar** (sólo escribe lo que cambió).
- **Progreso:** gráfica por estado (ciclos superpuestos), «antes vs. durante» y «comparar ciclos».
- **Sueños:** diario en la fila «Sueños» de la Bitácora 4D.
- **Más:** Eneatipo, Formulario de inicio, escala, Ajustes (ciclos, fecha del Día 1, app instalable), abrir la hoja.

### Recordatorios (Más ▸ Ajustes ▸ 🔔 Recordatorios)
- **📅 Aviso en el celular:** crea en tu Google Calendar el evento diario «🌿 Registrar Bitácora 4D» a la hora elegida, con notificación, desde hoy (o desde el Día 1 si es futuro) hasta el Día 86. Requiere notificaciones activadas en la app Google Calendar. Se vuelve a crear solo al cambiar de ciclo o de fecha.
- **📧 Correo diario:** un activador de Apps Script revisa cada día a la hora elegida (±15 min) si el día de hoy ya tiene registro; si no, te envía un correo con el día, toma/descanso y un botón a la app. «Enviar correo de prueba» lo envía siempre.
- La hora usa la **zona horaria del script** (Apps Script ▸ ⚙️ Configuración del proyecto ▸ Zona horaria); la tarjeta la muestra.
- **Permisos:** la primera vez, en el editor ejecuta `autorizarRecordatorios` (calendario, correo y activadores). Si no, la app muestra «Falta dar permisos».
- Una aplicación web no puede enviar notificaciones push por sí sola con el celular cerrado; por eso se usan Calendar y correo.

### Ciclos
**Empezar ciclo nuevo** (Hoy o Ajustes): (1) copia «Bitácora 4D» y «Bitácora» a hojas `… · Ciclo N (fechas)` y verifica que la copia sea idéntica; (2) borra sólo puntajes y comentarios (filas 10–30), hora, estado («Registro pendiente») y Eneatipo filas 34–51; (3) guarda la nueva fecha.
Se conservan preguntas, fórmulas, formatos, listas desplegables, notas y el plan (toma/descanso, «Calibración», «T»). Si la copia no coincide, no se borra nada.
**Corregir la fecha sin archivar** (Ajustes ▸ detalles) sólo cambia la fecha: los registros siguen en las mismas columnas.

---

## 7. Mantenimiento

| Tarea | Cómo |
|---|---|
| **Actualizar el código** | Pega `App.gs` e `Index.html` nuevos ▸ 💾 ▸ **Implementar ▸ Gestionar implementaciones** ▸ en **cada** una ✏️ ▸ **Versión nueva** ▸ Implementar. Las URL no cambian. La PWA toma el diseño nuevo sola al reabrirla. |
| **Regenerar la PWA** | `node tools/build-pwa.js` y sube los cambios (sube también el número `VERSION` de `docs/sw.js`). |
| **Cambiar la clave** (perdiste el celular, la compartiste) | Ejecuta `cambiarClave` y luego `configurarApp` ▸ abre el enlace nuevo en el celular. La clave vieja deja de servir. |
| **Ver la clave / enlace** | Ejecuta `configurarApp` y mira el Registro de ejecución. |
| **Respaldo de datos** | En la hoja: **Archivo ▸ Hacer una copia** (o Archivo ▸ Descargar ▸ .xlsx). Google también guarda el **historial de versiones** (Archivo ▸ Historial de versiones). |
| **Respaldo del código** | Este repositorio + el .zip. |
| **Después de actualizar a una versión con permisos nuevos** (p. ej. recordatorios) | Ejecuta una vez `autorizarRecordatorios` en el editor y acepta. Si no, la implementación pública (Ejecutar como: Yo) falla para **todas** las funciones hasta que autorices. |
| **Ver errores** | Apps Script ▸ ☰ **Ejecuciones**: cada uso de la app aparece como `doGet`, `rpc` o `doPost` con su estado. |

---

## 8. Replicar el proyecto (otra persona, otra hoja u otra app)

### 8.1 Otra persona con la misma bitácora
1. Que haga su **propia copia** de la hoja (en su Drive) — el script vive en la hoja.
2. Repite **5.2 a 5.6** con su cuenta: sus implementaciones, su clave, su enlace.
3. La PWA puede ser la **misma** (`docs/` publicada una vez): cada celular se conecta a su propia hoja con su enlace `#setup`. Sólo cambia `CFG.pwaUrl` si publicas otra copia de la PWA.
4. Ajusta `CFG.defaultStart` o la fecha en Ajustes.

### 8.2 Otra hoja con distinta estructura
Todo el mapa está concentrado en `App.gs`:
- `CFG` — nombres de hojas, `defaultStart`, `lastDay`, `pwaUrl`.
- `R4D` — filas de la Bitácora 4D (toma, dosis, estado, comentarios 10–15, estados 17–30).
- `col4D_()` / `colEnea_()` — columna de cada día. Si tu hoja tiene otra cantidad de columnas por día o huecos, cambia estas fórmulas.
- `REN` — filas del Eneatipo; `FORM` — celdas del formulario.
- `entries_()` — lista de registros (línea base, días, cierres).
- `startNewCycle_()` — qué filas se limpian al empezar un ciclo.
Las etiquetas y notas se leen de la hoja, así que cambiar preguntas en la hoja no requiere tocar el código.
Verifica el mapa con las pruebas: `python3 tests/make_fixture.py tu.xlsx && node tests/run_tests.js` (adapta las aserciones de columnas en `tests/run_tests.js`).

### 8.3 Otra app con la misma base
- **Otro backend:** la interfaz sólo necesita una función `api(fn, ...args)` que devuelva promesas con los mismos datos (`getBootstrap`, `getEntry`, `saveEntry`, `getProgress`, `getJournal`, `saveItem`, `getEnea`, `saveEnea`, `getForm`, `saveForm`, `setStart`, `startNewCycle`, `getMobileSetup`, `setApiUrl`). El contrato está en `API_` (App.gs) y en la sección «Conexión» de Index.html.
- **Otro hosting de la PWA** (Netlify, Vercel, Firebase Hosting…): publica la carpeta `docs/` tal cual y actualiza `CFG.pwaUrl`.
- **Otro diseño:** los colores están en las variables CSS `:root` de Index.html (`--brand`, `--brand2`, escala `--neg3`…`--pos3`).

---

## 9. Solución de problemas (lo que nos pasó)

| Síntoma | Causa | Solución |
|---|---|---|
| `SyntaxError: Unexpected end of input, línea 100` | Se pegó sólo una parte del archivo. | Copiar con «Copy raw file» de GitHub y revisar el final del archivo. |
| `Unexpected identifier 'https'` | Se pegó la URL dentro de la línea vieja (quedó duplicado `var URL_PUBLICA = '`). | Dejar una sola línea `var URL_PUBLICA = 'https://…/exec';`. |
| Código con `Var` o sin `//` | Traducción automática del navegador en GitHub. | «Mostrar original» / «Nunca traducir este sitio» antes de copiar. |
| «Más» no abre en la app nueva | La PWA aún no estaba conectada. | (Corregido) ahora oculta las pestañas y explica cómo conectar. |
| «La clave no es válida» / «no te reconoce como dueño» en la app de Apps Script | Con «Ejecutar como: Yo» Google no siempre revela quién abre la app. | Privada con **Ejecutar como: usuario que accede**; o pegar la clave/enlace en «Clave o enlace de conexión». |
| «Failed to fetch» / «No pude conectar con tu hoja» y en Ejecuciones **no aparece `doPost`** | La implementación pública no acepta visitantes anónimos (p. ej. «Cualquier usuario con una cuenta de Google»). | Pública: **Ejecutar como: Yo** + **Quién tiene acceso: Cualquier usuario** + Versión nueva. Prueba: abrir la URL pública en **incógnito** debe mostrar Microdosis, no el inicio de sesión. |
| «No se puede instalar esta app» en script.google.com | Las páginas de Apps Script no son instalables. | Instalar la de github.io (o crear acceso directo). |
| Después de actualizar, la app instalable falla toda («No pude conectar» / error de permisos) | El código nuevo pide permisos nuevos y el dueño aún no los aceptó. | En el editor ejecuta `autorizarRecordatorios` y acepta. |
| No llega la notificación del calendario | Notificaciones de Google Calendar desactivadas, o el ciclo ya terminó (no hay evento). | Activar notificaciones de la app Calendar; empezar un ciclo nuevo. |
| La app no muestra cambios nuevos | Caché del service worker. | Cerrar y abrir la app; si persiste, subir `VERSION` en `docs/sw.js`. |

---

## 10. Seguridad y privacidad

- La hoja contiene **datos personales y de salud**: compártela sólo con quien deba verlos (p. ej. el organizador).
- **Nunca** publiques ni compartas el enlace `#setup=…` ni la clave. Si ocurre, ejecuta `cambiarClave`.
- El repositorio es público: sólo código. No subas `tests/fixture.json` (está en `.gitignore`) ni exportaciones de la hoja.
- Las implementaciones: privada «Solo yo»; pública «Cualquier usuario» pero inútil sin la clave.

---

## Apéndice A — `app/App.gs`

```javascript
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
  lastDay: 86,
  pwaUrl: 'https://alanronny78-commits.github.io/Micro-Dosis/'   // app instalable (GitHub Pages)
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


/* ===================== Acceso y API ===================== */
/*
 * La app llama sólo a rpc() (desde Apps Script) o a doPost() (desde la app instalable).
 * Todas las funciones de datos terminan en «_», así que nadie puede llamarlas directamente.
 * - Si quien abre la app es el dueño de la hoja (implementación «Solo yo»), no hace falta clave.
 * - En cualquier otro caso (implementación «Cualquier usuario») se exige la clave secreta.
 */

var API_ = {
  getBootstrap: function () { return getBootstrap_(); },
  getEntry: function (id) { return getEntry_(id); },
  saveEntry: function (id, d) { return saveEntry_(id, d); },
  getProgress: function () { return getProgress_(); },
  getJournal: function (row) { return getJournal_(row); },
  saveItem: function (id, row, score, text) { return saveItem_(id, row, score, text); },
  getEnea: function (id) { return getEnea_(id); },
  saveEnea: function (id, d) { return saveEnea_(id, d); },
  getForm: function () { return getForm_(); },
  saveForm: function (d) { return saveForm_(d); },
  setStart: function (iso) { return setStart_(iso); },
  startNewCycle: function (iso) { return startNewCycle_(iso); },
  getReminders: function () { return getReminders_(); },
  setReminders: function (cfg) { return setReminders_(cfg); },
  testReminder: function () { return sendReminderEmail_(true); },
  getMobileSetup: function () { return getMobileSetup_(); },
  setApiUrl: function (url) { return setApiUrl_(url); }
};
var OWNER_ONLY_ = { getMobileSetup: true, setApiUrl: true };

function isOwner_() {
  // Fiable cuando la implementación privada usa «Ejecutar como: Usuario que accede a la aplicación web»
  // y «Quién tiene acceso: Solo yo». Con «Ejecutar como: Yo» Google suele no revelar quién abre la app.
  try {
    var a = Session.getActiveUser().getEmail();
    if (!a || a !== Session.getEffectiveUser().getEmail()) return false;
    var owner = null;
    try { owner = ss_().getOwner(); } catch (e) {}
    return !owner || owner.getEmail() === a;
  } catch (e) { return false; }
}

function sameKey_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!a || a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function rpc(key, fn, args) {
  var f = API_[fn];
  if (!f) throw new Error('Función desconocida: ' + fn);
  if (!isOwner_()) {
    if (OWNER_ONLY_[fn]) throw new Error('Sólo el dueño de la hoja puede hacer esto.');
    var k = props_().getProperty('API_KEY');
    if (!k || !sameKey_(key, k)) throw new Error('CLAVE_INVALIDA');
  }
  return f.apply(null, args || []);
}

/** Punto de entrada para la app instalable (fetch POST con JSON en texto plano). */
function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    out = { ok: true, data: rpc(req.key, req.fn, req.args) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function newKey_() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', k = '';
  for (var i = 0; i < 40; i++) k += chars.charAt(Math.floor(Math.random() * chars.length));
  return k + Utilities.getUuid().replace(/-/g, '');
}

/** Datos para conectar la app instalable (sólo el dueño). Crea la clave la primera vez. */
function getMobileSetup_() {
  var p = props_();
  var key = p.getProperty('API_KEY');
  if (!key) { key = newKey_(); p.setProperty('API_KEY', key); }
  return { key: key, apiUrl: p.getProperty('API_URL') || '', pwaUrl: CFG.pwaUrl };
}

function setApiUrl_(url) {
  url = String(url || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
    throw new Error('Pega la URL de la implementación: empieza con https://script.google.com/macros/s/ y termina en /exec');
  }
  props_().setProperty('API_URL', url);
  return getMobileSetup_();
}

/**
 * Ejecútala desde el editor (▶ Ejecutar) si la app te pide la clave: muestra en el
 * «Registro de ejecución» tu clave y, si ya guardaste la URL pública, el enlace de conexión.
 */
function configurarApp() {
  var s = getMobileSetup_();
  Logger.log('Tu clave: ' + s.key);
  if (s.apiUrl) {
    Logger.log('Enlace para conectar la app instalable (ábrelo en tu celular, no lo compartas):');
    Logger.log(s.pwaUrl + '#setup=' + Utilities.base64Encode(s.apiUrl + '|' + s.key).replace(/\+/g, '-').replace(/\//g, '_'));
  } else {
    Logger.log('Aún no guardaste la URL pública. Pégala en la función guardarUrlPublica y ejecútala.');
  }
}

/** Pega entre las comillas la URL /exec de la implementación «Cualquier usuario» y ejecuta esta función. */
function guardarUrlPublica() {
  var URL_PUBLICA = 'PEGA_AQUI_LA_URL_/exec';
  setApiUrl_(URL_PUBLICA);
  configurarApp();
}

/** Cambia la clave (deja desconectados los celulares que usaban la anterior). Ejecútala desde el editor si la necesitas. */
function cambiarClave() {
  props_().setProperty('API_KEY', newKey_());
  Logger.log('Clave nueva creada. Vuelve a conectar la app instalable desde Más ▸ Ajustes.');
}

/* ===================== Datos ===================== */

/** Datos iniciales: participante, registros, preguntas, estado de cada día. */
function getBootstrap_() {
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
    url: ss_().getUrl(),
    cycles: cyclesInfo_()
  };
}

/** Datos de un registro de la Bitácora 4D. */
function getEntry_(id) {
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

/** Guarda un registro. data tiene la misma forma que getEntry_ (sólo se escriben los cambios). */
function saveEntry_(id, data) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    var s = sh_(CFG.sheet4D);
    var c = col4D_(id), t = c + 1;
    var cur = getEntry_(id);
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
    return { saved: n, entry: getEntry_(id) };
  } finally {
    lock.releaseLock();
  }
}

/** Series de puntajes por pregunta de una hoja con el formato de la Bitácora 4D. */
function seriesFrom_(sheet) {
  var lastCol = sheet.getLastColumn();
  var v = sheet.getRange(R4D.gmFirst, 1, R4D.eeLast - R4D.gmFirst + 1, lastCol).getValues();
  var ents = entries_(), series = {};
  for (var r = R4D.gmFirst; r <= R4D.eeLast; r++) {
    if (r === 16) continue;
    series[r] = ents.map(function (e) { return scoreOut_(v[r - R4D.gmFirst][col4D_(e.id) - 1]); });
  }
  return series;
}

/** Series del ciclo actual y de los ciclos archivados (para gráficas y comparación). */
function getProgress_() {
  var cycles = cyclesInfo_();
  var out = { ids: entries_().map(function (e) { return e.id; }), cycles: [] };
  out.cycles.push({ key: 'actual', label: cycles.current.label, series: seriesFrom_(sh_(CFG.sheet4D)) });
  cycles.archived.slice().reverse().forEach(function (c) {
    var sh = sheetById_(c.sid4D);
    if (sh) out.cycles.push({ key: 'c' + c.n, label: c.label, series: seriesFrom_(sh) });
  });
  out.series = out.cycles[0].series;   // compatibilidad
  return out;
}

/** Todos los textos de una fila (p. ej. Sueños, fila 13) para el diario. */
function getJournal_(row) {
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
function saveItem_(id, row, score, text) {
  var data = { rows: {} };
  data.rows[row] = { score: score, text: text };
  return saveEntry_(id, data);
}

/* ---------- Eneatipo (hoja «Bitácora») ---------- */

function getEnea_(id) {
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

function saveEnea_(id, data) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    var s = sh_(CFG.sheetEnea);
    var c = colEnea_(id);
    if (!c) throw new Error('Este registro no existe en la hoja de Eneatipo.');
    var cur = getEnea_(id), ch = [];
    if (data.cambios !== undefined && data.cambios !== cur.cambios) ch.push([REN.cambios, c, data.cambios]);
    (data.items || []).forEach(function (it) {
      var o = cur.items.filter(function (x) { return x.row === it.row; })[0];
      if (!o) return;
      var ns = scoreIn_(it.score), os = o.score === null ? '' : o.score;
      if (ns !== os) ch.push([it.row, c, ns]);
      if ((it.text || '') !== o.text) ch.push([it.row, c + 1, safeText_(it.text || '')]);
    });
    return { saved: writeChanges_(s, ch), enea: getEnea_(id) };
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

function getForm_() {
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

function saveForm_(data) {
  var s = sh_(CFG.sheetForm);
  var cur = getForm_(), n = 0;
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
  return { saved: n, form: getForm_() };
}

/* ---------- Ciclos ---------- */

var MES_ = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtD_(d) { return d.getDate() + ' ' + MES_[d.getMonth()] + ' ' + d.getFullYear(); }
function rangeLabel_(start) {
  var end = addDays_(start, CFG.lastDay - 1);
  var a = start.getDate() + ' ' + MES_[start.getMonth()] + (start.getFullYear() !== end.getFullYear() ? ' ' + start.getFullYear() : '');
  return a + ' – ' + fmtD_(end);
}
function sheetById_(id) {
  var all = ss_().getSheets();
  for (var i = 0; i < all.length; i++) if (all[i].getSheetId() === id) return all[i];
  return null;
}
function cyclesList_() {
  try { return JSON.parse(props_().getProperty('CYCLES') || '[]'); } catch (e) { return []; }
}
/** Ciclos archivados (que aún existen) y el ciclo actual. */
function cyclesInfo_() {
  var list = cyclesList_().filter(function (c) { return !!sheetById_(c.sid4D); });
  var n = list.length ? list[list.length - 1].n + 1 : 1;
  var st = startDate_();
  return {
    archived: list,
    current: { n: n, label: 'Ciclo ' + n + ' (actual)', start: iso_(st), end: iso_(addDays_(st, CFG.lastDay - 1)), range: rangeLabel_(st) }
  };
}
function uniqueName_(name) {
  var n = name, k = 2;
  while (ss_().getSheetByName(n)) n = name + ' (' + (k++) + ')';
  return n;
}
function archiveSheet_(src, name) {
  var ss = ss_();
  var copy = src.copyTo(ss).setName(uniqueName_(name));
  try { copy.setTabColor('#9A95AE'); } catch (e) {}
  ss.setActiveSheet(copy);
  ss.moveActiveSheet(ss.getNumSheets());
  return copy;
}
function sameBlock_(a, b, r, c, nr, nc) {
  var x = a.getRange(r, c, nr, nc).getValues(), y = b.getRange(r, c, nr, nc).getValues();
  return JSON.stringify(x) === JSON.stringify(y);
}

/**
 * Archiva el ciclo actual (copia las hojas «Bitácora 4D» y «Bitácora» con nombre de ciclo),
 * limpia sólo los registros del participante y fija la fecha del nuevo Día 1.
 * Conserva preguntas, fórmulas, formatos, listas desplegables, notas y el plan (toma/descanso, dosis asignadas).
 */
function startNewCycle_(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error('Fecha inválida');
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var info = cyclesInfo_(), n = info.current.n, label = info.current.range;
    var s4 = sh_(CFG.sheet4D), sE = sh_(CFG.sheetEnea);
    var lastCol4 = s4.getLastColumn(), lastColE = sE.getLastColumn();

    // 1) Archivar y verificar la copia antes de borrar nada
    var a4 = archiveSheet_(s4, 'Bitácora 4D · Ciclo ' + n + ' (' + label + ')');
    var aE = archiveSheet_(sE, 'Bitácora (Eneatipo) · Ciclo ' + n + ' (' + label + ')');
    SpreadsheetApp.flush();
    if (!sameBlock_(s4, a4, 1, 1, R4D.eeLast, lastCol4) || !sameBlock_(sE, aE, REN.cambios, 1, REN.last - REN.cambios + 1, lastColE)) {
      throw new Error('La copia de respaldo no coincide; no se borró nada.');
    }
    ss_().setActiveSheet(s4);

    // 2) Limpiar registros de la Bitácora 4D (desde la columna E)
    var w4 = lastCol4 - 4;
    s4.getRange(R4D.gmFirst, 5, R4D.gmLast - R4D.gmFirst + 1, w4).clearContent();
    s4.getRange(R4D.eeFirst, 5, R4D.eeLast - R4D.eeFirst + 1, w4).clearContent();
    entries_().forEach(function (e) {
      var c = col4D_(e.id);
      if (!e.special) s4.getRange(R4D.hora, c).clearContent();
      s4.getRange(R4D.estado, c).setValue('Registro pendiente');
    });

    // 3) Limpiar Eneatipo (filas 34–51, desde la columna D)
    sE.getRange(REN.cambios, 4, REN.last - REN.cambios + 1, lastColE - 3).clearContent();

    // 4) Guardar el ciclo archivado y la nueva fecha
    var list = cyclesList_();
    list.push({ n: n, start: info.current.start, end: info.current.end, label: 'Ciclo ' + n + ' (' + label + ')', sid4D: a4.getSheetId(), sidEn: aE.getSheetId() });
    props_().setProperty('CYCLES', JSON.stringify(list));
    props_().setProperty('START', isoDate);
    SpreadsheetApp.flush();
    refreshCalendar_();
    return getBootstrap_();
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Recordatorios ---------- */
/*
 * Dos tipos (se configuran en la app: Más ▸ Ajustes ▸ Recordatorios):
 *  - Calendario: evento diario «🌿 Registrar Bitácora 4D» con aviso en el celular, hasta el fin del ciclo.
 *  - Correo: cada día a la hora elegida, sólo si ese día todavía no hay registro.
 * La primera vez ejecuta autorizarRecordatorios() en el editor para dar los permisos.
 */
var REM_HANDLER = 'recordatorioDiario';
var REM_TITLE = '🌿 Registrar Bitácora 4D';

function remCfg_() {
  var d = { email: { on: false, time: '20:00' }, cal: { on: false, time: '20:00' }, seriesId: '' };
  try { var c = JSON.parse(props_().getProperty('REMINDERS') || '{}'); } catch (e) { c = {}; }
  return { email: c.email || d.email, cal: c.cal || d.cal, seriesId: c.seriesId || '' };
}
function saveRemCfg_(c) { props_().setProperty('REMINDERS', JSON.stringify(c)); }
function parseTime_(t) {
  var m = String(t || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m || +m[1] > 23 || +m[2] > 59) throw new Error('Hora inválida: ' + t);
  return { h: +m[1], m: +m[2] };
}
function maskEmail_(e) { return String(e || '').replace(/^(.{2}).*(@.*)$/, '$1•••$2'); }

function getReminders_() {
  var c = remCfg_(), msg = '';
  var end = addDays_(startDate_(), CFG.lastDay - 1);
  if (c.cal.on && !c.seriesId) msg = 'El ciclo actual ya terminó: el aviso del calendario se creará cuando empieces un ciclo nuevo.';
  return { email: c.email, cal: c.cal, calActive: !!c.seriesId, tz: Session.getScriptTimeZone(),
           to: maskEmail_(Session.getEffectiveUser().getEmail()), cycleEnd: iso_(end), note: msg };
}

function setReminders_(cfg) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    var c = remCfg_();
    c.email = { on: !!(cfg && cfg.email && cfg.email.on), time: (cfg && cfg.email && cfg.email.time) || c.email.time };
    c.cal = { on: !!(cfg && cfg.cal && cfg.cal.on), time: (cfg && cfg.cal && cfg.cal.time) || c.cal.time };
    parseTime_(c.email.time); parseTime_(c.cal.time);
    saveRemCfg_(c);
    // correo: un activador diario
    ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === REM_HANDLER) ScriptApp.deleteTrigger(t); });
    if (c.email.on) {
      var t = parseTime_(c.email.time);
      ScriptApp.newTrigger(REM_HANDLER).timeBased().everyDays(1).atHour(t.h).nearMinute(t.m).create();
    }
    refreshCalendar_();
    return getReminders_();
  } finally {
    lock.releaseLock();
  }
}

/** (Re)crea el evento diario del calendario para el ciclo actual. */
function refreshCalendar_() {
  var c = remCfg_();
  if (!c.cal.on && !c.seriesId) return;
  var cal = CalendarApp.getDefaultCalendar();
  if (c.seriesId) {
    try { var old = cal.getEventSeriesById(c.seriesId); if (old) old.deleteEventSeries(); } catch (e) {}
    c.seriesId = '';
  }
  if (c.cal.on) {
    var t = parseTime_(c.cal.time), start = startDate_(), end = addDays_(start, CFG.lastDay - 1);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var day = start > today ? start : today;
    var first = new Date(day.getFullYear(), day.getMonth(), day.getDate(), t.h, t.m);
    if (first < new Date()) first = addDays_(first, 1);
    var lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59);
    if (first <= lastDay) {
      var series = cal.createEventSeries(REM_TITLE, first, new Date(first.getTime() + 10 * 60000),
        CalendarApp.newRecurrence().addDailyRule().until(addDays_(lastDay, 1)),
        { description: 'Abre tu app Microdosis y registra el día.\n' + CFG.pwaUrl });
      try { series.removeAllReminders(); series.addPopupReminder(0); } catch (e) {}
      c.seriesId = series.getId();
    }
  }
  saveRemCfg_(c);
}

/** Lo ejecuta el activador diario (no lo llames a mano: usa «Enviar correo de prueba» en la app). */
function recordatorioDiario(e) {
  if (!e || !e.triggerUid) return;   // sólo desde el activador
  sendReminderEmail_(false);
}

/** Envía el correo del día. force=true lo envía aunque ya exista registro (prueba). */
function sendReminderEmail_(force) {
  var today = iso_(new Date());
  var ent = entries_().filter(function (x) { return !x.special && x.date === today; })[0];
  if (!ent && !force) return { sent: false, reason: 'Hoy no es un día del ciclo' };
  var info = '', registered = false;
  if (ent) {
    var d = getEntry_(ent.id);
    registered = /finaliz/i.test(d.estado) || Object.keys(d.rows).some(function (k) { return d.rows[k].score !== null || d.rows[k].text; });
    if (registered && !force) return { sent: false, reason: 'Ya registraste hoy' };
    info = '<p style="font-size:20px;margin:0 0 6px"><b>' + ent.label + '</b></p>' +
      (d.toma ? '<p style="margin:0 0 6px">Hoy toca: <b>' + d.toma + '</b></p>' : '') +
      '<p style="margin:0 0 14px;color:#6B6584">' + (registered ? 'Ya tienes registro hoy (correo de prueba).' : 'Todavía no registras el día de hoy.') + '</p>';
  } else {
    info = '<p style="margin:0 0 14px;color:#6B6584">Correo de prueba: hoy no es un día del ciclo actual.</p>';
  }
  var html = '<div style="font-family:Arial,sans-serif;max-width:480px;color:#231C38">' +
    '<div style="background:#4A3B8F;color:#fff;padding:14px 18px;border-radius:12px 12px 0 0;font-size:18px"><b>🌿 Microdosis</b></div>' +
    '<div style="border:1px solid #E4DFF2;border-top:none;padding:18px;border-radius:0 0 12px 12px">' + info +
    '<a href="' + CFG.pwaUrl + '" style="display:inline-block;background:#4A3B8F;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold">✍️ Registrar ahora</a>' +
    '<p style="font-size:12px;color:#9A95AE;margin:16px 0 0">Cambia o desactiva este recordatorio en la app: Más ▸ Ajustes ▸ Recordatorios.</p></div></div>';
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: '🌿 ' + (ent ? 'Registra tu ' + ent.label : 'Recordatorio de Microdosis'), htmlBody: html });
  return { sent: true };
}

/** Ejecútala una vez desde el editor (▶ Ejecutar) para dar los permisos de calendario, correo y activadores. */
function autorizarRecordatorios() {
  ScriptApp.getProjectTriggers();
  CalendarApp.getDefaultCalendar().getName();
  Logger.log('Permisos listos. Correos disponibles hoy: ' + MailApp.getRemainingDailyQuota() + '. Zona horaria del script: ' + Session.getScriptTimeZone());
}

/* ---------- Ajustes ---------- */

function setStart_(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error('Fecha inválida');
  props_().setProperty('START', isoDate);
  refreshCalendar_();
  return getBootstrap_();
}
```

## Apéndice B — `app/Index.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
<base target="_top">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#4A3B8F">
<title>Microdosis</title>
<style>
:root{
  --bg:#F5F3FB; --card:#FFFFFF; --ink:#231C38; --muted:#6B6584; --line:#E4DFF2;
  --brand:#4A3B8F; --brand2:#7A6BC4; --brand-soft:#ECE8FA;
  --neg3:#C2412D; --neg2:#E0703E; --neg1:#EBA35A; --zero:#9A95AE; --pos1:#7DB86A; --pos2:#3E9B5A; --pos3:#1F7A47;
  --ok:#2E8B57; --warn:#C88A12; --pend:#9A95AE;
  --radius:16px; --shadow:0 1px 2px rgba(35,28,56,.06),0 4px 14px rgba(35,28,56,.06);
}
@media (prefers-color-scheme: dark){
  :root{ --bg:#14111F; --card:#1E1A2E; --ink:#EEEAF9; --muted:#A39DBD; --line:#2F2945;
    --brand:#9C8CF0; --brand2:#B6A9F5; --brand-soft:#2A2442; --shadow:none; --zero:#77718F; }
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
body{padding-bottom:calc(76px + env(safe-area-inset-bottom))}
button{font:inherit;color:inherit}
.top{position:sticky;top:0;z-index:20;background:var(--brand);color:#fff;padding:calc(10px + env(safe-area-inset-top)) 16px 12px}
@media (prefers-color-scheme: dark){.top{background:#2A2442}}
.top h1{margin:0;font-size:19px;font-weight:700;letter-spacing:.2px}
.top .sub{opacity:.85;font-size:13px}
main{max-width:640px;margin:0 auto;padding:14px 14px 24px}
.card{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);padding:16px;margin:0 0 12px;border:1px solid var(--line)}
.card h2{margin:0 0 8px;font-size:17px}
.card h3{margin:0 0 4px;font-size:15px}
.muted{color:var(--muted)} .small{font-size:13px}
.row{display:flex;gap:8px;align-items:center}
.spread{display:flex;justify-content:space-between;align-items:center;gap:8px}
.hero{background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;border:none}
.hero .big{font-size:30px;font-weight:800;line-height:1.1}
.hero .muted{color:rgba(255,255,255,.85)}
.pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:13px;font-weight:600;background:var(--brand-soft);color:var(--brand)}
.hero .pill{background:rgba(255,255,255,.18);color:#fff}
.pill.ok{background:rgba(46,139,87,.14);color:var(--ok)} .pill.warn{background:rgba(200,138,18,.15);color:var(--warn)} .pill.pend{background:rgba(154,149,174,.18);color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:none;border-radius:12px;padding:12px 16px;font-weight:700;background:var(--brand);color:#fff;cursor:pointer;min-height:46px}
.btn.block{width:100%} .btn.ghost{background:var(--brand-soft);color:var(--brand)} .btn.light{background:#fff;color:var(--brand)}
.btn:disabled{opacity:.5}
.grid-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.dcell{aspect-ratio:1;border-radius:10px;border:1px solid var(--line);background:var(--card);font-size:12px;font-weight:700;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;padding:0}
.dcell.sp{grid-column:span 2;aspect-ratio:auto}
.dcell.ok{background:rgba(46,139,87,.16);border-color:transparent;color:var(--ok)}
.dcell.warn{background:rgba(200,138,18,.16);border-color:transparent;color:var(--warn)}
.dcell.has{background:var(--brand-soft);border-color:transparent;color:var(--brand)}
.dcell.today{outline:2px solid var(--brand);outline-offset:1px}
.dcell .t{font-size:10px;font-weight:600;opacity:.8}
.legend{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:var(--muted);margin-top:10px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}
/* selector de día */
.daybar{position:sticky;top:calc(56px + env(safe-area-inset-top));z-index:15;background:var(--bg);padding:8px 0 10px;margin:-14px 0 6px}
.daybar .inner{display:flex;gap:8px;align-items:center}
.iconbtn{width:46px;height:46px;border-radius:12px;border:1px solid var(--line);background:var(--card);font-size:20px;cursor:pointer;flex:none}
select,input[type=text],input[type=date],input[type=time],textarea{width:100%;font:inherit;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:12px;padding:11px 12px}
select{appearance:none;-webkit-appearance:none;font-weight:700;background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),linear-gradient(135deg,var(--muted) 50%,transparent 50%);background-position:calc(100% - 18px) 50%,calc(100% - 13px) 50%;background-size:5px 5px;background-repeat:no-repeat;padding-right:34px}
textarea{min-height:64px;resize:none;line-height:1.4}
textarea:focus,input:focus,select:focus{outline:2px solid var(--brand2);outline-offset:0;border-color:transparent}
.seg{display:flex;background:var(--brand-soft);border-radius:12px;padding:3px;gap:3px;flex-wrap:wrap}
.seg button{flex:1;border:none;background:transparent;border-radius:9px;padding:9px 6px;font-weight:600;font-size:14px;color:var(--muted);cursor:pointer;min-height:40px;white-space:nowrap}
.seg button.on{background:var(--card);color:var(--brand);box-shadow:var(--shadow)}
.field{margin:12px 0}
.field>label{display:block;font-size:13px;font-weight:700;color:var(--muted);margin:0 0 6px;text-transform:uppercase;letter-spacing:.4px}
.sec-title{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;color:var(--brand);margin:18px 4px 8px;display:flex;justify-content:space-between;align-items:center}
.item{padding:14px 14px 12px}
.item .q{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;font-weight:700;margin-bottom:10px}
.info{flex:none;width:30px;height:30px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--brand);font-weight:800;font-size:14px;cursor:pointer}
.scale{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-bottom:10px}
.scale button{border:1.5px solid var(--line);background:var(--card);border-radius:10px;height:42px;font-weight:800;font-size:15px;cursor:pointer;color:var(--muted)}
.scale button.on{color:#fff;border-color:transparent}
.scale button[data-v="-3"].on{background:var(--neg3)} .scale button[data-v="-2"].on{background:var(--neg2)} .scale button[data-v="-1"].on{background:var(--neg1)}
.scale button[data-v="0"].on{background:var(--zero)} .scale button[data-v="1"].on{background:var(--pos1)} .scale button[data-v="2"].on{background:var(--pos2)} .scale button[data-v="3"].on{background:var(--pos3)}
.savebar{position:fixed;left:0;right:0;bottom:calc(64px + env(safe-area-inset-bottom));z-index:25;padding:10px 14px;background:linear-gradient(to top,var(--bg) 70%,transparent);display:none}
.savebar.show{display:block}
.savebar .inner{max-width:640px;margin:0 auto}
nav.tabs{position:fixed;left:0;right:0;bottom:0;z-index:30;background:var(--card);border-top:1px solid var(--line);display:flex;padding-bottom:env(safe-area-inset-bottom)}
nav.tabs button{flex:1;border:none;background:none;padding:8px 0 9px;font-size:11px;font-weight:700;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;min-height:56px}
nav.tabs button .ic{font-size:21px;line-height:1.1;filter:grayscale(1);opacity:.7}
nav.tabs button.on{color:var(--brand)} nav.tabs button.on .ic{filter:none;opacity:1}
.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(140px + env(safe-area-inset-bottom));background:#231C38;color:#fff;padding:10px 16px;border-radius:12px;font-weight:600;font-size:14px;z-index:60;opacity:0;transition:opacity .2s;pointer-events:none;max-width:90%;text-align:center}
.toast.show{opacity:1}
.sheet-bg{position:fixed;inset:0;background:rgba(20,15,35,.45);z-index:50;display:none;align-items:flex-end;justify-content:center}
.sheet-bg.show{display:flex}
.sheet{background:var(--card);width:100%;max-width:640px;max-height:82vh;overflow:auto;border-radius:20px 20px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom))}
.sheet pre{white-space:pre-wrap;font:inherit;margin:0;font-size:15px}
.loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:40px 0;color:var(--muted)}
.spin{width:22px;height:22px;border-radius:50%;border:3px solid var(--brand-soft);border-top-color:var(--brand);animation:sp 0.8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.chips::-webkit-scrollbar{display:none}
.chip{flex:none;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:7px 12px;font-size:13px;font-weight:600;cursor:pointer;color:var(--muted)}
.chip.on{background:var(--brand);color:#fff;border-color:transparent}
.chart{width:100%;height:auto;display:block}
.cmp{display:grid;grid-template-columns:1fr 64px 64px;gap:6px 10px;align-items:center;font-size:14px}
.cmp .h{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase}
.badge{display:inline-block;min-width:44px;text-align:center;padding:3px 6px;border-radius:8px;font-weight:800;font-size:13px;color:#fff}
.journal .e{border-left:3px solid var(--brand2);padding:2px 0 2px 12px;margin:0 0 14px}
.journal .e .d{font-size:12px;font-weight:700;color:var(--muted);margin-bottom:2px}
.list a,.list button.li{display:flex;justify-content:space-between;align-items:center;width:100%;padding:15px 4px;border:none;background:none;border-bottom:1px solid var(--line);text-decoration:none;color:var(--ink);font-weight:600;cursor:pointer;text-align:left}
.list .li:last-child{border-bottom:none}
.check{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}
.check:last-child{border-bottom:none}
.check input{width:22px;height:22px;accent-color:var(--brand);flex:none}
.empty{text-align:center;color:var(--muted);padding:24px 8px}
.err{background:rgba(194,65,45,.1);color:var(--neg3);border-radius:12px;padding:12px;font-weight:600}
@media (prefers-color-scheme: dark){.hero{background:linear-gradient(135deg,#3B2F7A,#5A4BA8)}.btn.light{background:#EEEAF9;color:#3B2F7A}}
</style>
</head>
<body>
<header class="top">
  <h1 id="title">🌿 Microdosis</h1>
  <div class="sub" id="subtitle">Cargando…</div>
</header>

<main id="view"><div class="loading"><div class="spin"></div>Cargando tu bitácora…</div></main>

<div class="savebar" id="savebar"><div class="inner"><button class="btn block" id="saveBtn">💾 Guardar cambios</button></div></div>

<nav class="tabs" id="tabs">
  <button data-tab="hoy" class="on"><span class="ic">🏠</span>Hoy</button>
  <button data-tab="reg"><span class="ic">✍️</span>Registrar</button>
  <button data-tab="prog"><span class="ic">📈</span>Progreso</button>
  <button data-tab="suenos"><span class="ic">🌙</span>Sueños</button>
  <button data-tab="mas"><span class="ic">☰</span>Más</button>
</nav>

<div class="toast" id="toast"></div>
<div class="sheet-bg" id="sheetBg"><div class="sheet" id="sheet"></div></div>

<script>
/* ============ Conexión ============ */
// «gas»: la app se abre desde Apps Script (google.script.run).
// «web»: la app instalable (GitHub Pages) habla con el script por fetch.
var MODE=(window.google&&google.script&&google.script.run)?'gas':'web';
var CFG_KEY='md_cfg';
function getCfg(){try{return JSON.parse(localStorage.getItem(CFG_KEY)||'null')}catch(e){return null}}
function setCfg(c){try{if(c)localStorage.setItem(CFG_KEY,JSON.stringify(c));else localStorage.removeItem(CFG_KEY)}catch(e){}}
function api(fn){
  var args=[].slice.call(arguments,1), c=getCfg()||{};
  if(MODE==='gas'){
    return new Promise(function(res,rej){
      google.script.run.withSuccessHandler(res).withFailureHandler(function(e){rej(e&&e.message?e:new Error(String(e)))}).rpc(c.key||'',fn,args);
    });
  }
  if(!c.url||!c.key)return Promise.reject(new Error('SIN_CONFIG'));
  return fetch(c.url,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:c.key,fn:fn,args:args})})
    .then(function(r){if(!r.ok)throw new Error('El servidor respondió '+r.status);return r.json()})
    .then(function(j){if(!j.ok)throw new Error(j.error||'Error');return j.data});
}
// Enlace de conexión: …/#setup=<base64(url|clave)>
function readSetupHash(){
  var m=location.hash.match(/setup=([A-Za-z0-9+\/=_-]+)/);
  if(!m)return false;
  try{var p=atob(m[1].replace(/-/g,'+').replace(/_/g,'/')).split('|');if(p[0]&&p[1])setCfg({url:p[0],key:p[1]})}catch(e){}
  history.replaceState(null,'',location.pathname+location.search);
  return true;
}
readSetupHash();
window.addEventListener('hashchange',function(){if(readSetupHash()){loading('Conectando…');start()}});

window.addEventListener('error',function(e){try{toast('⚠️ '+(e.message||'Error'))}catch(x){}});
/* ============ Estado ============ */
var S={boot:null,tab:'hoy',sub:null,entryId:null,entry:null,orig:null,dirty:false,progress:null,progItem:null,enea:null,eneaOrig:null,form:null,formOrig:null,eneaId:null};
var $=function(s,el){return (el||document).querySelector(s)};
var $$=function(s,el){return [].slice.call((el||document).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function toast(msg){var t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},2200)}
function clone(o){return JSON.parse(JSON.stringify(o))}
var MESES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var DIAS=['dom','lun','mar','mié','jue','vie','sáb'];
function pdate(iso){var p=iso.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function fdate(iso,long){var d=pdate(iso);return (long?DIAS[d.getDay()]+' ':'')+d.getDate()+' '+MESES[d.getMonth()]+(long?' '+d.getFullYear():'')}
function scoreTxt(v){return v===null||v===undefined?'—':(v>0?'+'+v:String(v))}
function scoreColor(v){if(v===null||v===undefined)return 'var(--line)';var r=Math.round(v);return ['var(--neg3)','var(--neg2)','var(--neg1)','var(--zero)','var(--pos1)','var(--pos2)','var(--pos3)'][Math.max(-3,Math.min(3,r))+3]}
function estadoClass(e){return /finaliz/i.test(e)?'ok':/proceso/i.test(e)?'warn':'pend'}
function autosize(t){t.style.height='auto';t.style.height=Math.min(t.scrollHeight+2,420)+'px'}

/* ============ Arranque ============ */
function start(){
  api('getBootstrap').then(function(b){S.boot=b;S.entryId=suggestedId();render()}).catch(function(e){
    if(/SIN_CONFIG|CLAVE_INVALIDA/.test(e.message))viewSetup(/CLAVE_INVALIDA/.test(e.message));else showErr(e);
  });
}
function viewSetup(bad){
  var c=getCfg()||{};
  $('#subtitle').textContent='Conectar con tu hoja';
  $('#tabs').style.display='none';
  $('#view').innerHTML='<div class="card"><h2>🔗 Conectar con tu hoja</h2>'+
    (bad?'<div class="err" style="margin-bottom:10px">'+(MODE==='gas'?'Esta implementación no te reconoce como dueño de la hoja.':'La clave no es válida o cambió. Vuelve a conectar.')+'</div>':'')+
    (MODE==='gas'?'<p class="small" style="margin:0 0 8px"><b>Solución:</b> en Apps Script ve a <b>Implementar ▸ Gestionar implementaciones</b>, elige la implementación «Solo yo», toca ✏️ y cambia <b>Ejecutar como</b> a <b>«Usuario que accede a la aplicación web»</b>. Elige <b>Nueva versión</b> e Implementar. Luego recarga esta página.</p>':'')+
    (MODE==='web'?'<p style="margin:0 0 8px">Esta app todavía no está conectada. Para conectarla:</p>'+
      '<ol class="small" style="margin:0 0 12px;padding-left:20px;line-height:1.6"><li>Abre la <b>otra</b> app, la de <b>script.google.com</b> (la que ya usabas).</li><li>Ahí ve a <b>Más ▸ Ajustes ▸ App instalable</b>.</li><li>Toca <b>«📲 Abrir app instalable»</b>. Esta app se abrirá ya conectada.</li></ol>'+
      '<p class="small muted" style="margin:0 0 10px">O, si tienes el enlace o la clave, pégalos aquí:</p>'
    :'<p class="small muted" style="margin:0 0 10px">O escribe la clave (en el editor ejecuta la función <b>configurarApp</b> y cópiala del registro):</p>')+
    (MODE==='web'?'<div class="field"><label>Enlace de conexión o URL del script (termina en /exec)</label><input type="text" id="cUrl" value="'+esc(c.url||'')+'" placeholder="https://script.google.com/macros/s/…/exec"></div>':'')+
    '<div class="field"><label>Clave o enlace de conexión</label><input type="text" id="cKey" value="'+esc(c.key||'')+'" autocomplete="off"></div>'+
    '<button class="btn block" id="cGo">Conectar</button></div>';
  $('#cGo').onclick=function(){
    var raw=MODE==='web'?$('#cUrl').value.trim():'', k=$('#cKey').value.trim();
    var link=/#setup=/.test(raw)?raw:(/#setup=/.test(k)?k:'');
    if(link){  // pegó el enlace de conexión completo (en cualquiera de los dos campos)
      try{var p=atob(link.split('#setup=')[1].replace(/-/g,'+').replace(/_/g,'/')).split('|');raw=p[0];k=p[1]}catch(e){toast('El enlace no es válido');return}
    }
    var n={url:raw,key:k};
    if((MODE==='web'&&!n.url)||!n.key){toast('Completa los datos');return}
    setCfg(n);loading('Conectando…');start();
  };
}
function showErr(e){
  var msg=String(e&&e.message||e), c=getCfg()||{};
  if(MODE==='web'&&/fetch|network|load failed/i.test(msg)){
    var id=(String(c.url||'').match(/\/s\/([^\/]+)\//)||[])[1]||'?';
    $('#view').innerHTML='<div class="card"><h2>📡 No pude conectar con tu hoja</h2>'+
      '<p class="small" style="margin:0 0 8px">Google no dejó pasar la conexión. Revisa:</p>'+
      '<ol class="small" style="margin:0 0 10px;padding-left:20px;line-height:1.6"><li>Que tengas internet.</li>'+
      '<li>Que la implementación pública diga <b>Quién tiene acceso: «Cualquier usuario»</b> (no «con una cuenta de Google») y <b>Ejecutar como: Yo</b>.</li>'+
      '<li>Que esta app use esa implementación. Está conectada a: <b style="word-break:break-all">'+esc(id.slice(0,12))+'…</b></li></ol>'+
      '<button class="btn block" onclick="location.reload()">Reintentar</button>'+
      '<button class="btn ghost block" style="margin-top:8px" onclick="setCfg(null);location.reload()">Cambiar la conexión</button></div>';
    $('#subtitle').textContent='Sin conexión';
    $('#tabs').style.display='none';
    return;
  }
  $('#view').innerHTML='<div class="card err">⚠️ '+esc(msg)+'</div><button class="btn block" onclick="location.reload()">Reintentar</button>';
  $('#subtitle').textContent='Error';
}
function todayEntry(){var t=S.boot.today;return S.boot.entries.filter(function(e){return !e.special&&e.date===t})[0]||null}
function suggestedId(){
  var t=todayEntry(); if(t) return t.id;
  // Sin día de hoy: antes del inicio → línea base; después → último día (no línea especial) con datos
  var ents=S.boot.entries;
  if(S.boot.today<ents[1].date) return 'LB';
  var last=null; ents.forEach(function(e){if(e.filled>0&&!e.special&&e.date<=S.boot.today)last=e});
  return last?last.id:'D1';
}
function entryById(id){return S.boot.entries.filter(function(e){return e.id===id})[0]}
function entryIndex(id){var i=-1;S.boot.entries.forEach(function(e,k){if(e.id===id)i=k});return i}

/* ============ Navegación ============ */
$$('#tabs button').forEach(function(b){b.onclick=function(){go(b.dataset.tab)}});
function go(tab,sub){
  if(!S.boot){toast('Primero conecta la app con tu hoja');return}
  if(S.dirty&&!confirm('Tienes cambios sin guardar. ¿Salir sin guardar?'))return;
  if(S.dirty){S.dirty=false}
  S.tab=tab;S.sub=sub||null;
  $$('#tabs button').forEach(function(b){b.classList.toggle('on',b.dataset.tab===tab)});
  window.scrollTo(0,0);render();
}
function setDirty(v){S.dirty=v;$('#savebar').classList.toggle('show',!!v)}
window.addEventListener('beforeunload',function(e){if(S.dirty){e.preventDefault();e.returnValue=''}});

function render(){
  $('#tabs').style.display='';
  setDirty(false);
  var b=S.boot;
  $('#subtitle').textContent=(b.name?b.name.split(' ')[0]+' · ':'')+'Bitácora 4D';
  ({hoy:viewHoy,reg:viewReg,prog:viewProg,suenos:viewSuenos,mas:viewMas})[S.tab]();
}
function loading(msg){$('#view').innerHTML='<div class="loading"><div class="spin"></div>'+esc(msg||'Cargando…')+'</div>'}

/* ============ HOY ============ */
function viewHoy(){
  var b=S.boot, t=todayEntry(), ents=b.entries;
  var done=ents.filter(function(e){return /finaliz/i.test(e.estado)}).length;
  var withData=ents.filter(function(e){return e.filled>0}).length;
  var h='';
  if(t){
    h+='<div class="card hero"><div class="muted small">'+esc(fdate(b.today,true))+'</div>'+
       '<div class="big">'+esc(t.label)+'</div><div style="margin:6px 0 12px" class="row">'+
       (t.week?'<span class="pill">'+esc(t.week)+'</span>':'')+
       (t.toma?'<span class="pill">'+esc(t.toma)+'</span>':'')+
       '</div><div class="spread"><span class="pill">'+esc(t.estado||'Registro pendiente')+'</span>'+
       '<button class="btn light" onclick="openEntry(\''+t.id+'\')">✍️ Registrar hoy</button></div></div>';
  } else {
    var last=ents[ents.length-1];
    var before=b.today<ents[1].date;
    h+='<div class="card hero"><div class="muted small">'+esc(fdate(b.today,true))+'</div>'+
       '<div class="big" style="font-size:24px">'+(before?'Tu proceso empieza el '+esc(fdate(ents[1].date)):'Tu ciclo de 86 días terminó el '+esc(fdate(last.date)))+'</div>'+
       '<p class="muted small" style="margin:8px 0 12px">'+(before?'Mientras tanto puedes completar tu línea base.':'Puedes seguir completando cualquier día, o empezar un ciclo nuevo: tus registros actuales quedan guardados.')+'</p>'+
       '<div class="row" style="flex-wrap:wrap"><button class="btn light" onclick="openEntry(\''+suggestedId()+'\')">✍️ Abrir '+esc(entryById(suggestedId()).label)+'</button>'+
       (before?'':'<button class="btn" style="background:rgba(255,255,255,.18)" onclick="newCycleSheet()">🔄 Ciclo nuevo</button>')+'</div></div>';
  }
  h+='<div class="card" style="padding:12px 16px"><div class="spread"><span class="small muted">'+esc(b.cycles.current.label.replace(' (actual)',''))+' · '+esc(b.cycles.current.range)+'</span>'+(b.cycles.archived.length?'<span class="pill">'+b.cycles.archived.length+' archivado'+(b.cycles.archived.length>1?'s':'')+'</span>':'')+'</div></div>';
  h+='<div class="card"><div class="spread"><div><div class="muted small">Días finalizados</div><div style="font-size:24px;font-weight:800">'+done+' <span class="muted small">/ '+ents.length+'</span></div></div>'+
     '<div><div class="muted small">Con algún registro</div><div style="font-size:24px;font-weight:800">'+withData+'</div></div></div></div>';
  h+='<div class="card"><h2>Calendario del proceso</h2><p class="muted small" style="margin:0 0 10px">Toca un día para abrirlo.</p><div class="grid-days">';
  ents.forEach(function(e){
    var cls=/finaliz/i.test(e.estado)?'ok':/proceso/i.test(e.estado)?'warn':(e.filled>0?'has':'');
    if(t&&t.id===e.id)cls+=' today';
    var ic=/toma/i.test(e.toma)?'▶':(/descanso/i.test(e.toma)?'⏸':'');
    h+='<button class="dcell '+cls+(e.special?' sp':'')+'" onclick="openEntry(\''+e.id+'\')" title="'+esc(e.label+' · '+fdate(e.date))+'">'+esc(e.short)+(ic?'<span class="t">'+ic+'</span>':'')+'</button>';
  });
  h+='</div><div class="legend"><span><i style="background:rgba(46,139,87,.5)"></i>Finalizado</span><span><i style="background:rgba(200,138,18,.5)"></i>En proceso</span><span><i style="background:var(--brand-soft)"></i>Con datos</span><span>▶ Toma · ⏸ Descanso</span></div></div>';
  $('#view').innerHTML=h;
}
function openEntry(id){S.entryId=id;go('reg')}

/* ============ REGISTRAR ============ */
var GM_ICONS={10:'🔎',11:'💭',12:'🍎',13:'🧚',14:'🔆',15:'🌸'};
function daySelect(id,onchg,filter){
  var opts=S.boot.entries.filter(filter||function(){return true}).map(function(e){
    return '<option value="'+e.id+'"'+(e.id===id?' selected':'')+'>'+esc(e.label)+' · '+esc(fdate(e.date))+'</option>';
  }).join('');
  return '<div class="daybar"><div class="inner"><button class="iconbtn" data-step="-1" aria-label="Anterior">‹</button>'+
         '<select id="daySel" aria-label="Elegir día">'+opts+'</select>'+
         '<button class="iconbtn" data-step="1" aria-label="Siguiente">›</button></div></div>';
}
function bindDaybar(onchg,filter){
  var list=S.boot.entries.filter(filter||function(){return true}).map(function(e){return e.id});
  $('#daySel').onchange=function(){onchg(this.value)};
  $$('.daybar [data-step]').forEach(function(b){b.onclick=function(){
    var i=list.indexOf($('#daySel').value)+Number(b.dataset.step);
    if(i>=0&&i<list.length)onchg(list[i]);
  }});
}
function changeEntry(id){
  if(S.dirty&&!confirm('Tienes cambios sin guardar. ¿Cambiar de día sin guardar?')){$('#daySel').value=S.entryId;return}
  S.entryId=id;viewReg();
}
function viewReg(){
  setDirty(false);
  var id=S.entryId||suggestedId(); S.entryId=id;
  $('#view').innerHTML=daySelect(id)+'<div class="loading"><div class="spin"></div>Abriendo '+esc(entryById(id).label)+'…</div>';
  bindDaybar(changeEntry);
  api('getEntry',id).then(function(d){
    if(S.entryId!==id||S.tab!=='reg')return;
    S.entry=d;S.orig=clone(d);drawReg();
  }).catch(showErr);
}
function scaleHtml(v){
  var h='<div class="scale">';[-3,-2,-1,0,1,2,3].forEach(function(n){h+='<button type="button" data-v="'+n+'" class="'+(v===n?'on':'')+'">'+(n>0?'+'+n:n)+'</button>'});return h+'</div>';
}
function itemHtml(it,val,ph){
  var icon=GM_ICONS[it.row]||'';
  var lbl=it.label.replace(/^●\s*/,'').replace(/^[^\wÁÉÍÓÚÑáéíóúñ¿]+\s*/,'');
  return '<div class="card item" data-row="'+it.row+'"><div class="q"><span>'+(icon?icon+' ':'')+esc(lbl)+'</span>'+
    (it.note?'<button class="info" type="button" data-note="'+it.row+'" aria-label="Ver explicación">i</button>':'')+'</div>'+
    scaleHtml(val.score)+'<textarea placeholder="'+esc(ph||'Escribe aquí… (opcional)')+'">'+esc(val.text)+'</textarea></div>';
}
function drawReg(){
  var d=S.entry, e=entryById(d.id), b=S.boot;
  var special=e.special;
  var h=daySelect(d.id);
  h+='<div class="card" style="padding:12px 14px"><div class="spread"><div><div style="font-weight:800">'+esc(e.label)+'</div><div class="muted small">'+esc(fdate(e.date,true))+(e.week?' · '+esc(e.week):'')+'</div></div>'+
     '<span class="pill '+estadoClass(d.estado)+'">'+esc(d.estado||'Pendiente')+'</span></div></div>';
  if(!special){
    h+='<div class="sec-title">💊 Toma del día</div><div class="card">'+
      '<div class="field"><label>¿Toma o descanso?</label>'+seg('toma',['Toma ▶️','Descanso ⏸️'],d.toma)+'</div>'+
      '<div class="field"><label>Asignación</label>'+seg('asignado',['Asignado','Cambio'],d.asignado)+'</div>'+
      '<div class="field"><label>Hora</label><input type="text" id="f_hora" value="'+esc(d.hora)+'" placeholder="Ej. 7:30 am" inputmode="text"></div>'+
      '<div class="field"><label>Dosis</label>'+seg('dosis',['5%','10%','15%','20%','Otra'],d.dosis)+'</div>'+
      '<div class="field"><label>¿Qué dosis tomas y por qué?</label><textarea id="f_dosisNota" placeholder="Opcional">'+esc(d.dosisNota)+'</textarea></div></div>';
  }
  h+='<div class="sec-title"><span>📝 Comentarios generales</span><button class="chip" data-copy="gm">↺ Copiar del día anterior</button></div>';
  b.items.filter(function(i){return i.group==='gm'}).forEach(function(it){h+=itemHtml(it,d.rows[it.row])});
  h+='<div class="sec-title"><span>🌀 Estados y efectos</span><button class="chip" data-copy="ee">↺ Sin cambios (copiar)</button></div>';
  h+='<p class="muted small" style="margin:-4px 4px 10px">Registra entre −3 y +3 y comenta por qué cuando lo necesites. Toca <b>i</b> para ver qué significa cada estado.</p>';
  b.items.filter(function(i){return i.group==='ee'}).forEach(function(it){h+=itemHtml(it,d.rows[it.row])});
  h+='<div class="sec-title">✅ Estado del registro</div><div class="card">'+seg('estado',['Registro pendiente','Registro en proceso','Finalizado'],d.estado)+'</div>';
  h+='<button class="btn ghost block" type="button" onclick="showScale()">📏 Ver la escala −3 a +3</button>';
  $('#view').innerHTML=h;
  bindDaybar(changeEntry);
  bindRegInputs();
}
function seg(name,opts,val){
  var norm=function(s){return String(s||'').replace(/[^\wÁÉÍÓÚÑáéíóúñ%]/g,'').toLowerCase()};
  var other=name==='dosis'&&val&&opts.map(norm).indexOf(norm(val))<0;
  var h='<div class="seg" data-seg="'+name+'">';
  opts.forEach(function(o){var on=norm(o)===norm(val)||(other&&o==='Otra');h+='<button type="button" data-val="'+esc(o)+'" class="'+(on?'on':'')+'">'+esc(o)+'</button>'});
  h+='</div>';
  if(name==='dosis')h+='<input type="text" id="f_dosisOtra" style="margin-top:8px;'+(other||norm(val)==='otra'?'':'display:none')+'" placeholder="¿Cuál dosis?" value="'+esc(other?val:'')+'">';
  return h;
}
function bindRegInputs(){
  var d=S.entry;
  $$('.seg').forEach(function(sg){$$('button',sg).forEach(function(bt){bt.onclick=function(){
    var name=sg.dataset.seg, v=bt.dataset.val, was=bt.classList.contains('on');
    $$('button',sg).forEach(function(x){x.classList.remove('on')});
    if(was&&name!=='estado'){v=''}else bt.classList.add('on');
    if(name==='dosis'){var o=$('#f_dosisOtra');o.style.display=v==='Otra'?'':'none';d.dosis=v==='Otra'?(o.value||'Otra'):v}
    else d[name]=v;
    mark();
  }})});
  var o=$('#f_dosisOtra'); if(o)o.oninput=function(){d.dosis=o.value||'Otra';mark()};
  var hr=$('#f_hora'); if(hr)hr.oninput=function(){d.hora=hr.value;mark()};
  var dn=$('#f_dosisNota'); if(dn){autosize(dn);dn.oninput=function(){d.dosisNota=dn.value;autosize(dn);mark()}}
  $$('.item').forEach(function(card){
    var row=card.dataset.row, ta=$('textarea',card);
    autosize(ta);
    ta.oninput=function(){d.rows[row].text=ta.value;autosize(ta);mark()};
    $$('.scale button',card).forEach(function(bt){bt.onclick=function(){
      var v=Number(bt.dataset.v), was=bt.classList.contains('on');
      $$('.scale button',card).forEach(function(x){x.classList.remove('on')});
      if(was){d.rows[row].score=null}else{bt.classList.add('on');d.rows[row].score=v}
      mark();
    }});
  });
  $$('[data-note]').forEach(function(bt){bt.onclick=function(){
    var it=S.boot.items.filter(function(i){return String(i.row)===bt.dataset.note})[0];
    openSheet('<h2 style="margin-top:0">'+esc(it.label)+'</h2><pre>'+esc(it.note)+'</pre>');
  }});
  $$('[data-copy]').forEach(function(bt){bt.onclick=function(){copyPrev(bt.dataset.copy)}});
}
function mark(){setDirty(JSON.stringify(S.entry)!==JSON.stringify(S.orig))}
function copyPrev(group){
  var i=entryIndex(S.entryId);
  var prev=null;for(var k=i-1;k>=0;k--){if(S.boot.entries[k].filled>0){prev=S.boot.entries[k];break}}
  if(!prev){toast('No hay un día anterior con datos');return}
  if(!confirm('¿Copiar '+(group==='gm'?'los comentarios generales':'los estados y efectos')+' de '+prev.label+'? Se reemplazarán los de este día.'))return;
  api('getEntry',prev.id).then(function(p){
    S.boot.items.filter(function(it){return it.group===group}).forEach(function(it){S.entry.rows[it.row]=clone(p.rows[it.row])});
    var keep=clone(S.entry);drawReg();S.entry=keep;mark();toast('Copiado de '+prev.label);
  }).catch(function(e){toast('Error: '+e.message)});
}
$('#saveBtn').onclick=function(){
  if(S.tab==='reg')saveReg();
  else if(S.sub==='enea')saveEnea();
  else if(S.sub==='form')saveForm();
};
function saveReg(){
  var btn=$('#saveBtn');btn.disabled=true;btn.textContent='Guardando…';
  var d=S.entry;
  if(d.estado===S.orig.estado&&(!d.estado||/pendiente/i.test(d.estado)))d.estado='Registro en proceso';
  api('saveEntry',d.id,d).then(function(r){
    S.entry=r.entry;S.orig=clone(r.entry);
    var e=entryById(d.id);e.estado=r.entry.estado;e.toma=r.entry.toma;
    e.filled=Object.keys(r.entry.rows).filter(function(k){return r.entry.rows[k].score!==null||r.entry.rows[k].text}).length;
    S.progress=null;
    drawReg();setDirty(false);toast('✅ Guardado en tu hoja');
  }).catch(function(e){toast('⚠️ No se pudo guardar: '+e.message)}).then(function(){btn.disabled=false;btn.textContent='💾 Guardar cambios'});
}
function showScale(){openSheet('<h2 style="margin-top:0">Escala de registro</h2><pre>'+esc(S.boot.scaleNote||'')+'</pre>')}
function openSheet(html){$('#sheet').innerHTML=html+'<button class="btn block" style="margin-top:16px" onclick="closeSheet()">Entendido</button>';$('#sheetBg').classList.add('show')}
function closeSheet(){$('#sheetBg').classList.remove('show')}
$('#sheetBg').onclick=function(e){if(e.target.id==='sheetBg')closeSheet()};

/* ============ PROGRESO ============ */
var CYC_COLORS=['var(--brand)','#2A9D8F','#E76F51','#8D99AE','#C9A227'];
function cycleHasData(c){return Object.keys(c.series).some(function(r){return c.series[r].some(function(v){return v!==null})})}
function avgDays(s){var b=S.boot,vals=s.filter(function(v,i){return i>0&&v!==null&&!b.entries[i].special});return vals.length?vals.reduce(function(a,c){return a+c},0)/vals.length:null}
function badge(v,dec){return '<span class="badge" style="background:'+scoreColor(v)+'">'+(v===null?'—':(v>0?'+':'')+(dec?v.toFixed(1):v))+'</span>'}
function viewProg(){
  if(!S.progress){loading('Calculando tu progreso…');api('getProgress').then(function(p){S.progress=p;viewProg()}).catch(showErr);return}
  var p=S.progress,b=S.boot,cyc=p.cycles||[{key:'actual',label:'Ciclo actual',series:p.series}];
  if(!S.progItem)S.progItem=String(b.items.filter(function(i){return i.group==='ee'})[2].row);
  var withData=cyc.filter(cycleHasData);
  if(!S.showCycles){S.showCycles={};(withData.length?withData:cyc).slice(0,2).forEach(function(c){S.showCycles[c.key]=true})}
  if(!S.cmpCycle||!cyc.some(function(c){return c.key===S.cmpCycle}))S.cmpCycle=(withData[0]||cyc[0]).key;
  var h='<div class="card"><h2>Evolución por estado</h2><div class="chips" id="pchips">';
  b.items.forEach(function(it){h+='<button class="chip'+(String(it.row)===S.progItem?' on':'')+'" data-r="'+it.row+'">'+esc(shortLabel(it.label))+'</button>'});
  h+='</div>';
  if(cyc.length>1){
    h+='<div class="chips" id="cchips" style="margin-top:8px">';
    cyc.forEach(function(c,i){var on=!!S.showCycles[c.key];h+='<button class="chip" data-k="'+c.key+'" style="'+(on?'background:'+CYC_COLORS[i%5]+';color:#fff;border-color:transparent':'')+'">'+(on?'● ':'○ ')+esc(c.label.replace(/ \(.*\)$/,''))+'</button>'});
    h+='</div>';
  }
  h+='<div id="chartBox" style="margin-top:10px"></div></div>';
  // antes vs durante
  h+='<div class="card"><h2>Antes vs. durante</h2><p class="muted small" style="margin:0 0 10px">Promedio de la <b>línea base</b> comparado con el promedio de los días registrados.</p>';
  if(cyc.length>1){h+='<div class="chips" id="bchips" style="margin-bottom:10px">';cyc.forEach(function(c){h+='<button class="chip'+(c.key===S.cmpCycle?' on':'')+'" data-k="'+c.key+'">'+esc(c.label.replace(/ \(.*\)$/,''))+'</button>'});h+='</div>'}
  var cc=cyc.filter(function(c){return c.key===S.cmpCycle})[0];
  h+='<div class="cmp"><div class="h">Estado</div><div class="h" style="text-align:center">Base</div><div class="h" style="text-align:center">Días</div>';
  b.items.forEach(function(it){var s=cc.series[it.row];h+='<div>'+esc(shortLabel(it.label))+'</div><div style="text-align:center">'+badge(s[0])+'</div><div style="text-align:center">'+badge(avgDays(s),true)+'</div>'});
  h+='</div></div>';
  // comparar ciclos
  if(withData.length>1){
    var cols=withData.slice(0,3);
    h+='<div class="card"><h2>Comparar ciclos</h2><p class="muted small" style="margin:0 0 10px">Promedio de los días registrados en cada ciclo.</p>'+
      '<div class="cmp" style="grid-template-columns:1fr'+cols.map(function(){return ' 64px'}).join('')+'"><div class="h">Estado</div>'+
      cols.map(function(c){return '<div class="h" style="text-align:center">'+esc(c.label.replace(/^Ciclo (\d+).*$/,'C$1'))+'</div>'}).join('');
    b.items.forEach(function(it){h+='<div>'+esc(shortLabel(it.label))+'</div>'+cols.map(function(c){return '<div style="text-align:center">'+badge(avgDays(c.series[it.row]),true)+'</div>'}).join('')});
    h+='</div><p class="small muted" style="margin:10px 0 0">'+cols.map(function(c){return esc(c.label.replace(/^Ciclo (\d+)/,'C$1 = Ciclo $1'))}).join(' · ')+'</p></div>';
  }
  $('#view').innerHTML=h;
  $$('#pchips .chip').forEach(function(c){c.onclick=function(){S.progItem=c.dataset.r;$$('#pchips .chip').forEach(function(x){x.classList.toggle('on',x===c)});drawChart()}});
  $$('#cchips .chip').forEach(function(c){c.onclick=function(){S.showCycles[c.dataset.k]=!S.showCycles[c.dataset.k];var y=window.scrollY;viewProg();window.scrollTo(0,y)}});
  $$('#bchips .chip').forEach(function(c){c.onclick=function(){S.cmpCycle=c.dataset.k;var y=window.scrollY;viewProg();window.scrollTo(0,y)}});
  drawChart();
}
function shortLabel(l){return l.replace(/^●\s*/,'').replace(/^[^\wÁÉÍÓÚÑáéíóúñ¿]+\s*/,'').replace(/^\d+\.\s*/,'').replace(/^¿Cómo te has sentido hoy\?.*$/,'Cómo me sentí').replace(/^¿Has hecho, sentido o pensado algo distinto.*$/,'Algo distinto').replace(/Sucesos o Experiencias trans-personal/,'Transpersonal')}
function drawChart(){
  var p=S.progress,b=S.boot,cyc=p.cycles||[{key:'actual',label:'Ciclo actual',series:p.series}];
  var box=$('#chartBox');
  var shown=cyc.map(function(c,i){return {c:c,color:CYC_COLORS[i%5]}}).filter(function(x){return cyc.length===1||S.showCycles[x.c.key]});
  var any=shown.some(function(x){return x.c.series[S.progItem].some(function(v){return v!==null})});
  if(!any){box.innerHTML='<div class="empty">'+(shown.length?'Aún no hay registros de este estado en los ciclos elegidos.':'Elige al menos un ciclo.')+'</div>';return}
  var W=600,H=240,L=34,R=10,T=12,B=30,n=b.entries.length;
  var x=function(i){return L+(W-L-R)*i/(n-1)},y=function(v){return T+(H-T-B)*(3-v)/6};
  var css=getComputedStyle(document.documentElement);
  var line=css.getPropertyValue('--line'),muted=css.getPropertyValue('--muted');
  var g='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Gráfica de evolución">';
  for(var v=-3;v<=3;v++){g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="'+line+'" stroke-width="'+(v===0?1.5:1)+'"/><text x="'+(L-8)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="11" fill="'+muted+'">'+(v>0?'+'+v:v)+'</text>'}
  [['LB','Base'],['C1','Cierre'],['C2','Fin']].forEach(function(m){var i=entryIndex(m[0]);if(i<0)return;g+='<line x1="'+x(i)+'" x2="'+x(i)+'" y1="'+T+'" y2="'+(H-B)+'" stroke="'+line+'" stroke-dasharray="3 3"/><text x="'+x(i)+'" y="'+(H-10)+'" text-anchor="middle" font-size="11" fill="'+muted+'">'+m[1]+'</text>'});
  var foot=[];
  shown.slice().reverse().forEach(function(sc,k){
    var pts=[];sc.c.series[S.progItem].forEach(function(v,i){if(v!==null)pts.push({i:i,v:v,e:b.entries[i]})});
    if(!pts.length)return;
    var main=k===shown.length-1;
    var d='';pts.forEach(function(pt,j){var cont=j&&pt.i-pts[j-1].i<=2;d+=(cont?'L':'M')+x(pt.i).toFixed(1)+' '+y(pt.v).toFixed(1)});
    g+='<path d="'+d+'" fill="none" stroke="'+sc.color+'" stroke-width="'+(main?2.5:2)+'" stroke-opacity="'+(main?1:.8)+'" stroke-linejoin="round" stroke-linecap="round"/>';
    pts.forEach(function(pt){g+='<circle cx="'+x(pt.i)+'" cy="'+y(pt.v)+'" r="'+(main?5:3.5)+'" fill="'+(shown.length>1?sc.color:scoreColor(pt.v))+'" stroke="var(--card)" stroke-width="1.5"><title>'+esc(sc.c.label.replace(/ \(.*\)$/,'')+' · '+pt.e.label+': '+scoreTxt(pt.v))+'</title></circle>'});
    var lp=pts[pts.length-1];
    foot.unshift('<span style="color:'+sc.color+';font-weight:700">'+esc(sc.c.label.replace(/ \(.*\)$/,''))+'</span>: '+pts.length+' reg. · último '+esc(lp.e.label)+' '+badge(lp.v));
  });
  g+='</svg>';
  box.innerHTML=g+'<div class="small muted" style="margin-top:6px;line-height:1.9">'+foot.join('<br>')+'</div>';
}

/* ============ SUEÑOS ============ */
var DREAM_ROW=13;
function viewSuenos(){
  loading('Abriendo tu diario de sueños…');
  api('getJournal',DREAM_ROW).then(function(list){
    if(S.tab!=='suenos')return;
    var t=todayEntry();
    var h='<div class="card"><h2>🌙 Diario de sueños</h2><p class="muted small" style="margin:0 0 12px">Se guarda en la fila «Sueños» de tu Bitácora 4D.</p>'+
      '<button class="btn block" onclick="dreamEditor(\''+(t?t.id:suggestedId())+'\')">✍️ Escribir un sueño</button></div>';
    if(!list.length)h+='<div class="card empty">Todavía no has registrado sueños.</div>';
    else{
      h+='<div class="card journal">';
      list.slice().reverse().forEach(function(x){var e=entryById(x.id);
        h+='<div class="e"><div class="d spread"><span>'+esc(e.label+' · '+fdate(e.date))+'</span>'+(x.score!==null?'<span class="badge" style="background:'+scoreColor(x.score)+'">'+scoreTxt(x.score)+'</span>':'')+'</div>'+
           '<div>'+esc(x.text||'(sin texto)').replace(/\n/g,'<br>')+'</div><button class="chip" style="margin-top:6px" onclick="dreamEditor(\''+x.id+'\')">Editar</button></div>';
      });
      h+='</div>';
    }
    $('#view').innerHTML=h;
  }).catch(showErr);
}
function dreamEditor(id){
  var opts=S.boot.entries.map(function(e){return '<option value="'+e.id+'"'+(e.id===id?' selected':'')+'>'+esc(e.label+' · '+fdate(e.date))+'</option>'}).join('');
  $('#sheet').innerHTML='<h2 style="margin-top:0">🌙 Sueño</h2><div class="field"><label>Día</label><select id="dDay">'+opts+'</select></div>'+
    '<div class="field"><label>¿Cómo lo viviste? (opcional)</label>'+scaleHtml(null)+'</div><div class="field"><label>Describe tu sueño</label><textarea id="dText" style="min-height:140px" placeholder="¿Qué soñaste? ¿Le encuentras algún significado?"></textarea></div>'+
    '<div class="row"><button class="btn ghost" style="flex:1" onclick="closeSheet()">Cancelar</button><button class="btn" style="flex:2" id="dSave">Guardar</button></div>';
  $('#sheetBg').classList.add('show');
  var score=null;
  function load(eid){api('getEntry',eid).then(function(d){var r=d.rows[DREAM_ROW];score=r.score;$('#dText').value=r.text;autosize($('#dText'));$$('#sheet .scale button').forEach(function(b){b.classList.toggle('on',Number(b.dataset.v)===score)})})}
  load(id);
  $('#dDay').onchange=function(){load(this.value)};
  $$('#sheet .scale button').forEach(function(bt){bt.onclick=function(){var v=Number(bt.dataset.v);score=score===v?null:v;$$('#sheet .scale button').forEach(function(b){b.classList.toggle('on',Number(b.dataset.v)===score)})}});
  $('#dText').oninput=function(){autosize(this)};
  $('#dSave').onclick=function(){var b=this;b.disabled=true;b.textContent='Guardando…';
    var eid=$('#dDay').value;
    api('saveItem',eid,DREAM_ROW,score,$('#dText').value).then(function(){closeSheet();toast('✅ Sueño guardado');S.progress=null;var e=entryById(eid);e.filled=Math.max(e.filled,1);viewSuenos()}).catch(function(e){b.disabled=false;b.textContent='Guardar';toast('⚠️ '+e.message)})};
}

/* ============ MÁS ============ */
function viewMas(){
  if(S.sub==='enea')return viewEnea();
  if(S.sub==='form')return viewForm();
  if(S.sub==='ajustes')return viewAjustes();
  var h='<div class="card list">'+
    '<button class="li" onclick="go(\'mas\',\'enea\')"><span>🎭 Eneatipo (rasgos y virtud)</span><span class="muted">›</span></button>'+
    '<button class="li" onclick="go(\'mas\',\'form\')"><span>📝 Formulario de inicio</span><span class="muted">›</span></button>'+
    '<button class="li" onclick="showScale()"><span>📏 Escala −3 a +3</span><span class="muted">›</span></button>'+
    '<button class="li" onclick="go(\'mas\',\'ajustes\')"><span>⚙️ Ajustes</span><span class="muted">›</span></button>'+
    '<a class="li" href="'+esc(S.boot.url)+'" target="_blank" rel="noopener"><span>📄 Abrir la hoja de cálculo</span><span class="muted">↗</span></a></div>'+
    '<p class="muted small" style="text-align:center">Todo lo que registras se guarda en tu hoja de Google.</p>';
  $('#view').innerHTML=h;
}
function backBtn(){return '<button class="chip" style="margin-bottom:12px" onclick="go(\'mas\')">‹ Más</button>'}

/* --- Eneatipo --- */
function eneaFilter(e){return e.id!=='C2'}
function viewEnea(){
  setDirty(false);
  var id=S.eneaId||(eneaFilter(entryById(S.entryId||suggestedId()))?(S.entryId||suggestedId()):'D1');S.eneaId=id;
  $('#view').innerHTML=daySelect(id,null,eneaFilter)+backBtn()+'<div class="loading"><div class="spin"></div>Cargando…</div>';
  bindDaybar(changeEnea,eneaFilter);
  api('getEnea',id).then(function(d){if(S.sub!=='enea'||S.eneaId!==id)return;S.enea=d;S.eneaOrig=clone(d);drawEnea()}).catch(showErr);
}
function changeEnea(id){if(S.dirty&&!confirm('Tienes cambios sin guardar. ¿Cambiar de día?')){$('#daySel').value=S.eneaId;return}S.eneaId=id;viewEnea()}
function drawEnea(){
  var d=S.enea,e=entryById(d.id);
  var h=daySelect(d.id,null,eneaFilter)+backBtn()+'<div class="card"><h2>🎭 '+esc(d.title.replace(/\s+/g,' '))+'</h2><div class="muted small">'+esc(e.label+' · '+fdate(e.date,true))+'</div>'+
    '<div class="field"><label>Registro</label>'+seg('cambios',['Registro cambios','Sin cambios (valores del día anterior)'],d.cambios)+'</div></div>';
  d.items.forEach(function(it){
    var lbl=it.label;
    h+='<div class="card item" data-row="'+it.row+'"><div class="q"><span>'+esc(lbl)+'</span>'+((it.note||(it.row===35&&d.pasionNote))?'<button class="info" data-enote="'+it.row+'">i</button>':'')+'</div>'+scaleHtml(it.score)+'<textarea placeholder="Comentario (opcional)">'+esc(it.text)+'</textarea></div>';
  });
  $('#view').innerHTML=h;
  bindDaybar(changeEnea,eneaFilter);
  $$('.seg').forEach(function(sg){$$('button',sg).forEach(function(bt){bt.onclick=function(){var was=bt.classList.contains('on');$$('button',sg).forEach(function(x){x.classList.remove('on')});if(!was)bt.classList.add('on');d.cambios=was?'':bt.dataset.val;markE()}})});
  $$('.item').forEach(function(card){
    var it=d.items.filter(function(x){return String(x.row)===card.dataset.row})[0], ta=$('textarea',card);
    autosize(ta);ta.oninput=function(){it.text=ta.value;autosize(ta);markE()};
    $$('.scale button',card).forEach(function(bt){bt.onclick=function(){var v=Number(bt.dataset.v),was=bt.classList.contains('on');$$('.scale button',card).forEach(function(x){x.classList.remove('on')});if(was)it.score=null;else{bt.classList.add('on');it.score=v}markE()}});
  });
  $$('[data-enote]').forEach(function(bt){bt.onclick=function(){var it=d.items.filter(function(x){return String(x.row)===bt.dataset.enote})[0];openSheet('<h2 style="margin-top:0">'+esc(it.label)+'</h2><pre>'+esc(it.row===35&&d.pasionNote?d.pasionNote:it.note)+'</pre>')}});
}
function markE(){setDirty(JSON.stringify(S.enea)!==JSON.stringify(S.eneaOrig))}
function saveEnea(){
  var btn=$('#saveBtn');btn.disabled=true;btn.textContent='Guardando…';
  api('saveEnea',S.enea.id,S.enea).then(function(r){S.enea=r.enea;S.eneaOrig=clone(r.enea);drawEnea();setDirty(false);toast('✅ Guardado')})
  .catch(function(e){toast('⚠️ '+e.message)}).then(function(){btn.disabled=false;btn.textContent='💾 Guardar cambios'});
}

/* --- Formulario --- */
function viewForm(){
  setDirty(false);
  $('#view').innerHTML=backBtn()+'<div class="loading"><div class="spin"></div>Cargando formulario…</div>';
  api('getForm').then(function(f){if(S.sub!=='form')return;S.form=f;S.formOrig=clone(f);drawForm()}).catch(showErr);
}
function drawForm(){
  var f=S.form,h=backBtn()+'<div class="sec-title">Datos generales</div><div class="card">';
  f.general.forEach(function(g){h+='<div class="field"><label>'+esc(g.label)+'</label><input type="text" data-cell="'+g.cell+'" value="'+esc(g.value)+'"></div>'});
  h+='</div>';
  var groups={};f.checks.forEach(function(c){(groups[c.group]=groups[c.group]||[]).push(c)});
  Object.keys(groups).forEach(function(gname){
    h+='<div class="sec-title">'+esc(gname)+'</div><div class="card" style="padding:6px 16px">';
    groups[gname].forEach(function(c){h+='<label class="check"><input type="checkbox" data-cell="'+c.cell+'"'+(c.value?' checked':'')+'><span>'+esc(c.label)+'</span></label>'});
    h+='</div>';
  });
  f.open.forEach(function(o){
    if(o.section)h+='<div class="sec-title">'+esc(o.section)+'</div>';
    h+='<div class="card"><div style="font-weight:700;margin-bottom:8px">'+esc(o.label)+'</div><textarea data-cell="'+o.cell+'">'+esc(o.value)+'</textarea></div>';
  });
  $('#view').innerHTML=h;
  $$('[data-cell]').forEach(function(el){
    if(el.tagName==='TEXTAREA')autosize(el);
    var upd=function(){var cell=el.dataset.cell;var all=f.general.concat(f.open,f.checks);all.forEach(function(x){if(x.cell===cell)x.value=el.type==='checkbox'?el.checked:el.value});if(el.tagName==='TEXTAREA')autosize(el);setDirty(JSON.stringify(S.form)!==JSON.stringify(S.formOrig))};
    el.oninput=upd;el.onchange=upd;
  });
}
function saveForm(){
  var btn=$('#saveBtn');btn.disabled=true;btn.textContent='Guardando…';
  var data={};S.form.general.concat(S.form.open,S.form.checks).forEach(function(x){data[x.cell]=x.value});
  api('saveForm',data).then(function(r){S.form=r.form;S.formOrig=clone(r.form);drawForm();setDirty(false);toast('✅ Formulario guardado')})
  .catch(function(e){toast('⚠️ '+e.message)}).then(function(){btn.disabled=false;btn.textContent='💾 Guardar cambios'});
}

/* --- Ajustes --- */
function viewAjustes(){
  var b=S.boot, cy=b.cycles;
  var arch=cy.archived.slice().reverse().map(function(c){return '<li>'+esc(c.label)+'</li>'}).join('');
  $('#view').innerHTML=backBtn()+
    '<div class="card"><h2>🔄 Ciclos</h2><div class="spread" style="margin-bottom:10px"><div><div style="font-weight:800">'+esc(cy.current.label)+'</div><div class="small muted">'+esc(cy.current.range)+'</div></div></div>'+
    (arch?'<div class="small muted" style="margin:0 0 4px">Archivados (en hojas aparte de tu archivo):</div><ul class="small" style="margin:0 0 12px;padding-left:20px">'+arch+'</ul>':'')+
    '<button class="btn block" onclick="newCycleSheet()">🔄 Empezar ciclo nuevo</button>'+
    '<details style="margin-top:12px"><summary class="small" style="cursor:pointer;color:var(--muted)">Corregir la fecha del Día 1 sin archivar</summary>'+
    '<p class="small muted" style="margin:8px 0">Sólo si te equivocaste de fecha en este mismo ciclo. No archiva ni borra nada.</p>'+
    '<input type="date" id="startIn" value="'+esc(b.start)+'"><button class="btn ghost block" style="margin-top:8px" id="startSave">Guardar fecha</button></details></div>'+
    '<div class="card" id="remCard"><h2>🔔 Recordatorios</h2><div class="loading" style="padding:10px 0"><div class="spin"></div></div></div>'+
    (MODE==='gas'?'<div class="card" id="pwaCard"><h2>📲 App instalable</h2><div class="loading" style="padding:10px 0"><div class="spin"></div></div></div>':
     '<div class="card"><h2>📲 Instalar</h2>'+(INSTALL_EVT?'<button class="btn block" id="instBtn">Instalar la app</button>':'<p class="small" style="margin:0"><b>Android (Chrome):</b> menú ⋮ ▸ «Instalar app» o «Agregar a la pantalla principal».<br><b>iPhone (Safari):</b> Compartir ▸ «Agregar a inicio».</p>')+
     '<button class="btn ghost block" style="margin-top:10px" id="discBtn">Desconectar este celular</button></div>');
  $('#startSave').onclick=function(){var v=$('#startIn').value;if(!v)return;this.disabled=true;
    api('setStart',v).then(function(nb){S.boot=nb;S.entryId=suggestedId();S.progress=null;toast('✅ Fecha actualizada');go('hoy')}).catch(function(e){toast('⚠️ '+e.message)})};
  if(MODE==='gas')loadPwaCard();
  loadRemCard();
  var ib=$('#instBtn');if(ib)ib.onclick=function(){INSTALL_EVT.prompt();INSTALL_EVT=null};
  var db=$('#discBtn');if(db)db.onclick=function(){if(confirm('¿Desconectar? Tendrás que volver a conectar este celular.')){setCfg(null);location.reload()}};
}
function remRow(id,icon,title,desc,cfg){
  return '<div style="padding:10px 0;border-bottom:1px solid var(--line)"><label class="check" style="border:none;padding:0;align-items:flex-start">'+
    '<input type="checkbox" id="'+id+'On"'+(cfg.on?' checked':'')+'><span><b>'+icon+' '+title+'</b><br><span class="small muted">'+desc+'</span></span></label>'+
    '<div class="row" style="margin:8px 0 0 32px"><span class="small muted">Hora</span><input type="time" id="'+id+'Time" value="'+esc(cfg.time)+'" style="max-width:140px"></div></div>';
}
function loadRemCard(){
  api('getReminders').then(function(r){
    var box=$('#remCard');if(!box)return;
    box.innerHTML='<h2>🔔 Recordatorios</h2>'+
      remRow('rc','📅','Aviso en el celular','Evento diario en tu Google Calendar con notificación, hasta el fin del ciclo ('+esc(fdate(r.cycleEnd))+'). Activa las notificaciones de la app Google Calendar.',r.cal)+
      remRow('re','📧','Correo diario','Llega a '+esc(r.to)+' sólo si ese día aún no registraste.',r.email)+
      (r.note?'<p class="small" style="margin:10px 0 0;color:var(--warn)">'+esc(r.note)+'</p>':'')+
      '<p class="small muted" style="margin:10px 0">Zona horaria: '+esc(r.tz)+'</p>'+
      '<button class="btn block" id="remSave">Guardar recordatorios</button>'+
      '<button class="btn ghost block" style="margin-top:8px" id="remTest">📧 Enviar correo de prueba</button>';
    $('#remSave').onclick=function(){var b=this;b.disabled=true;b.textContent='Guardando…';
      api('setReminders',{cal:{on:$('#rcOn').checked,time:$('#rcTime').value||'20:00'},email:{on:$('#reOn').checked,time:$('#reTime').value||'20:00'}})
        .then(function(){toast('✅ Recordatorios guardados');loadRemCard()})
        .catch(function(e){b.disabled=false;b.textContent='Guardar recordatorios';toast('⚠️ '+remErr(e))})};
    $('#remTest').onclick=function(){var b=this;b.disabled=true;api('testReminder').then(function(){toast('📧 Correo enviado. Revisa tu bandeja.');b.disabled=false}).catch(function(e){b.disabled=false;toast('⚠️ '+remErr(e))})};
  }).catch(function(e){var box=$('#remCard');if(box)box.innerHTML='<h2>🔔 Recordatorios</h2><p class="small" style="margin:0">'+esc(remErr(e))+'</p>'});
}
function remErr(e){var m=String(e&&e.message||e);return /permis|authoriz|autoriz|scope/i.test(m)?'Falta dar permisos: en Apps Script ejecuta una vez la función «autorizarRecordatorios».':m}
function todayIso(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function newCycleSheet(){
  var cy=S.boot.cycles.current;
  $('#sheet').innerHTML='<h2 style="margin-top:0">🔄 Empezar ciclo nuevo</h2>'+
    '<p class="small" style="margin:0 0 10px">Esto hará, en este orden:</p>'+
    '<ol class="small" style="margin:0 0 12px;padding-left:20px;line-height:1.55">'+
    '<li><b>Archivar</b> tu '+esc(cy.label.replace(' (actual)',''))+' ('+esc(cy.range)+') en hojas nuevas de tu archivo. Nada se pierde.</li>'+
    '<li><b>Limpiar</b> tus registros (puntajes, comentarios, hora y estado) en la Bitácora 4D y el Eneatipo. Se conservan las preguntas, el formato y el plan de tomas.</li>'+
    '<li>Poner la fecha del nuevo <b>Día 1</b>.</li></ol>'+
    '<div class="field"><label>Fecha del nuevo Día 1</label><input type="date" id="ncDate" value="'+todayIso()+'"></div>'+
    '<p class="small muted" style="margin:-4px 0 10px">La línea base es el día anterior. Si quieres registrarla antes de empezar, elige una fecha futura.</p>'+
    '<label class="check" style="border:none"><input type="checkbox" id="ncOk"><span class="small">Entiendo que la Bitácora 4D quedará vacía y mis registros pasarán a la hoja de archivo.</span></label>'+
    '<div class="row" style="margin-top:12px"><button class="btn ghost" style="flex:1" onclick="closeSheet()">Cancelar</button><button class="btn" style="flex:2" id="ncGo" disabled>Empezar ciclo</button></div>';
  $('#sheetBg').classList.add('show');
  $('#ncOk').onchange=function(){$('#ncGo').disabled=!this.checked};
  $('#ncGo').onclick=function(){
    var v=$('#ncDate').value; if(!v){toast('Elige una fecha');return}
    var b=this;b.disabled=true;b.textContent='Archivando…';
    api('startNewCycle',v).then(function(nb){S.boot=nb;S.entryId=suggestedId();S.progress=null;S.cmpCycle=null;closeSheet();toast('✅ Ciclo archivado. ¡Empieza tu '+nb.cycles.current.label.replace(' (actual)','')+'!');go('hoy')})
      .catch(function(e){b.disabled=false;b.textContent='Empezar ciclo';toast('⚠️ '+e.message)});
  };
}
var INSTALL_EVT=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();INSTALL_EVT=e});
function setupLink(s){return s.pwaUrl+'#setup='+btoa(s.apiUrl+'|'+s.key).replace(/\+/g,'-').replace(/\//g,'_')}
function loadPwaCard(){
  api('getMobileSetup').then(function(s){
    var box=$('#pwaCard');if(!box)return;
    var h='<h2>📲 App instalable</h2><p class="small muted" style="margin:0 0 10px">Versión a pantalla completa, sin la barra de script.google.com, con su propio ícono.</p>'+
      '<div class="field"><label>1. URL de la implementación pública (termina en /exec)</label><input type="text" id="apiUrl" value="'+esc(s.apiUrl)+'" placeholder="https://script.google.com/macros/s/…/exec"></div>'+
      '<button class="btn ghost block" id="apiSave">Guardar URL</button>';
    if(s.apiUrl){
      h+='<div class="field" style="margin-top:16px"><label>2. En tu celular</label><a class="btn block" style="text-decoration:none" href="'+esc(setupLink(s))+'" target="_blank" rel="noopener">📲 Abrir app instalable</a></div>'+
         '<p class="small muted" style="margin:6px 0 10px">Ábrelo desde esta misma app en tu celular. Luego, en Chrome: menú ⋮ ▸ «Instalar app». No compartas este enlace: lleva tu clave.</p>'+
         '<details><summary class="small" style="cursor:pointer;font-weight:700;color:var(--brand)">Ver el enlace para copiarlo</summary><textarea readonly id="setupTxt" style="margin-top:8px;font-size:12px" onclick="this.select()">'+esc(setupLink(s))+'</textarea></details>';
    }
    box.innerHTML=h;
    $('#apiSave').onclick=function(){var b=this;b.disabled=true;api('setApiUrl',$('#apiUrl').value).then(function(){toast('✅ URL guardada');loadPwaCard()}).catch(function(e){b.disabled=false;toast('⚠️ '+e.message)})};
  }).catch(function(e){var box=$('#pwaCard');if(box)box.innerHTML='<h2>📲 App instalable</h2><p class="small muted" style="margin:0">'+esc(/dueño/.test(e.message)?'Disponible sólo al abrir la app con tu cuenta (implementación «Solo yo»).':e.message)+'</p>'});
}

start();
</script>
</body>
</html>
```

## Apéndice C — `docs/manifest.webmanifest`

```json
{
  "name": "Microdosis — Bitácora 4D",
  "short_name": "Microdosis",
  "description": "Registro diario de la Bitácora 4D, conectado a tu hoja de Google.",
  "lang": "es",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#F5F3FB",
  "theme_color": "#4A3B8F",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## Apéndice D — `docs/sw.js`

```javascript
// Service worker: guarda la interfaz para que abra rápido. Los datos siempre vienen de la hoja (red).
const VERSION = 'md-v7';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // las llamadas al script van directo a la red
  // Red primero (para recibir actualizaciones); si no hay conexión, usa la copia guardada.
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
```

## Apéndice E — `tools/build-pwa.js`

```javascript
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
```

## Apéndice F — `Microdosis_AppsScript.gs` (opcional, menú dentro de la hoja)

Primer script entregado: agrega a la hoja un menú «🌿 Microdosis» (ir a hojas, ir a HOY, casillas). **No es necesario** para la app; si lo instalas, ponlo en un archivo aparte y **borra su función `getid()`** si `Código.gs` ya la tiene (no puede haber dos funciones con el mismo nombre).

```javascript
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
```
