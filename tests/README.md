# Pruebas

Requisitos: Node 18+, Python 3 con `openpyxl`, y Playwright con Chromium (para las pruebas de pantalla).

1. Descarga tu hoja como Excel (Archivo ▸ Descargar ▸ .xlsx) y crea la copia local de prueba:
   `python3 tests/make_fixture.py ruta/a/tu-bitacora.xlsx`  → genera `tests/fixture.json` (no se sube a GitHub).
2. Lógica del script (lectura, escritura, clave, ciclos): `node tests/run_tests.js`
3. App instalable contra un servidor simulado: `node tests/e2e_pwa.js`
4. Capturas de la app (modo Apps Script): `node tests/build_preview.js && node tests/shots.js && node tests/shots_cycle.js`

Ninguna prueba toca tu hoja real.
