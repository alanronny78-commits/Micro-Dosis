# 🌿 Micro-Dosis — App web para celular

App para registrar la **Bitácora 4D** desde el celular. Lee y escribe directamente en la hoja de Google de tu bitácora: no hay otra base de datos.

## Qué incluye

| Pantalla | Qué hace | Dónde guarda |
|---|---|---|
| 🏠 **Hoy** | Qué día del proceso es, si toca toma o descanso, el estado del registro y un calendario de los 86 días | — |
| ✍️ **Registrar** | Toma del día (toma/descanso, hora, dosis, por qué), 6 comentarios generales y 14 estados y efectos con botones −3…+3, «copiar del día anterior» y estado del registro | Hoja «Bitácora 4D» |
| 📈 **Progreso** | Gráfica de cada estado a lo largo del proceso y comparación línea base vs. días registrados | (solo lectura) |
| 🌙 **Sueños** | Diario de sueños | Fila «Sueños» de la «Bitácora 4D» |
| 🎭 **Eneatipo** (en Más) | Pasión, 15 rasgos y virtud con escala −3…+3 | Hoja «Bitácora» |
| 📝 **Formulario** (en Más) | Datos generales, casillas de salud y respuestas abiertas | Hoja «Formulario de inicio» |
| ⚙️ **Ajustes** (en Más) | Cambiar la fecha del Día 1 para empezar un ciclo nuevo | Propiedades del script |

## Instalación (una sola vez, ~5 minutos)

1. Abre tu hoja de Google y ve a **Extensiones ▸ Apps Script**.
2. **No borres** el código que ya exista (la hoja usa la función `getid()`).
3. Junto a «Archivos», pulsa **＋ ▸ Secuencia de comandos**, llámalo `App` y pega todo el contenido de [`app/App.gs`](app/App.gs).
4. Pulsa **＋ ▸ HTML**, llámalo exactamente `Index` y pega todo el contenido de [`app/Index.html`](app/Index.html).
5. Pulsa 💾 **Guardar**.
6. Arriba a la derecha: **Implementar ▸ Nueva implementación**.
   - Tipo (⚙️): **Aplicación web**
   - Ejecutar como: **Usuario que accede a la aplicación web** (así la app sabe que eres tú, sin clave)
   - Quién tiene acceso: **Solo yo** (son datos personales y de salud)
   - Pulsa **Implementar** y acepta los permisos (Google avisa que la app «no está verificada»: es tuya; pulsa *Configuración avanzada ▸ Ir a…*).
7. Copia la **URL de la aplicación web** (termina en `/exec`) y ábrela en tu celular con la misma cuenta de Google.
8. Agrégala a la pantalla de inicio:
   - **iPhone (Safari):** Compartir ▸ «Agregar a inicio».
   - **Android (Chrome):** menú ⋮ ▸ «Agregar a la pantalla principal».

## App instalable (pantalla completa, sin barra de script.google.com)

La carpeta [`docs/`](docs/) es la misma app publicada en GitHub Pages como app instalable (PWA):
**https://alanronny78-commits.github.io/Micro-Dosis/**. Habla con tu hoja a través del mismo script, protegido con una clave secreta.

1. **Actualiza el script** con los `App.gs` e `Index.html` nuevos (ver «Actualizar a una versión nueva»). Al guardar, acepta los permisos nuevos.
2. **Crea una segunda implementación** (la de «Solo yo» se queda como está):
   **Implementar ▸ Nueva implementación ▸ Aplicación web** · Ejecutar como: **Yo** · Quién tiene acceso: **Cualquier usuario** ▸ Implementar ▸ copia la URL `/exec`.
   Sin la clave, esa URL no muestra ni guarda nada.
3. **Publica la app en GitHub Pages** (una sola vez):
   - Repositorio ▸ **Settings ▸ General ▸ Danger Zone ▸ Change visibility ▸ Public** (GitHub Pages gratis lo requiere; en el repositorio sólo hay código, nunca tus datos).
   - **Settings ▸ Pages ▸ Build and deployment**: Source **Deploy from a branch**, rama **`claude/affectionate-maxwell-2nzu70`**, carpeta **`/docs`** ▸ Save. Espera 1–2 minutos.
4. **Conecta la app:** abre tu app actual (la de «Solo yo») ▸ **Más ▸ Ajustes ▸ App instalable** ▸ pega la URL del paso 2 ▸ **Guardar URL**.
5. **En el celular:** abre la app actual ▸ **Más ▸ Ajustes ▸ 📲 Abrir app instalable**. Se abre la nueva app ya conectada. En Chrome: menú ⋮ ▸ **Instalar app**.

Si la app te pide la clave: en el editor ejecuta `configurarApp` y mira el «Registro de ejecución» (muestra la clave y el enlace de conexión). Si la tarjeta de Ajustes no aparece, pega la URL pública en la función `guardarUrlPublica` y ejecútala.

Si alguna vez quieres invalidar la clave (por ejemplo, perdiste el celular): en el editor de Apps Script ejecuta la función `cambiarClave` y vuelve a conectar.

Para regenerar `docs/index.html` después de cambiar `app/Index.html`: `node tools/build-pwa.js`.

### Actualizar a una versión nueva

Pega el código nuevo en `App` e `Index`, guarda y ve a **Implementar ▸ Gestionar implementaciones**. Para **cada** implementación: ✏️ ▸ Versión: **Nueva versión** ▸ Implementar. Las URL no cambian.

## Cómo se ubican los datos

- **Bitácora 4D:** 2 columnas por día (puntaje, comentario). Línea base = E/F, Día 1 = G/H … Día 56 = DM/DN,
  Línea de cierre = DO/DP, Día 57 = DQ/DR … Día 86 = FW/FX, Línea de cierre 2 = FY/FZ.
  Filas: 6 asignado/cambio, 7 hora y toma/descanso, 8 dosis y por qué, 9 estado, 10–15 comentarios generales, 17–30 estados y efectos.
- **Bitácora (Eneatipo):** 3 columnas por día. Línea base = D, Día 1 = G … Día 30 = CP, Día 31 = CT … Día 56 = FQ,
  Cierre = FT, Día 57 = FW … Día 86 = JF. Filas 34 (registro cambios) y 35–51 (pasión, rasgos, virtud).
- Las fechas se calculan desde el **Día 1 (13/04/2026)**; se cambia en Ajustes.
- La app sólo escribe las celdas que cambiaste y nunca toca fórmulas ni el formato de la hoja.
