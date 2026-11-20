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
{{App.gs}}
```

## Apéndice B — `app/Index.html`

```html
{{Index.html}}
```

## Apéndice C — `docs/manifest.webmanifest`

```json
{{manifest}}
```

## Apéndice D — `docs/sw.js`

```javascript
{{sw}}
```

## Apéndice E — `tools/build-pwa.js`

```javascript
{{build-pwa}}
```

## Apéndice F — `Microdosis_AppsScript.gs` (opcional, menú dentro de la hoja)

Primer script entregado: agrega a la hoja un menú «🌿 Microdosis» (ir a hojas, ir a HOY, casillas). **No es necesario** para la app; si lo instalas, ponlo en un archivo aparte y **borra su función `getid()`** si `Código.gs` ya la tiene (no puede haber dos funciones con el mismo nombre).

```javascript
{{menu}}
```
