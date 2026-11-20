# Uso: python3 tests/make_fixture.py <bitacora.xlsx>
# Crea tests/fixture.json (copia local de la estructura de la hoja + datos de ejemplo). NO subir fixture.json: contiene tus datos.
import json, datetime, openpyxl, random, sys, os
wb = openpyxl.load_workbook(sys.argv[1])
out = {}
for ws in wb:
    if ws.title == 'INFORMACIÓN': continue
    R, C = ws.max_row, ws.max_column
    vals = [[None]*C for _ in range(R)]
    notes = [['']*C for _ in range(R)]
    fmts = [['']*C for _ in range(R)]
    for row in ws.iter_rows():
        for c in row:
            v = c.value
            if hasattr(v, 'text'): v = '=ARRAY'
            if isinstance(v, datetime.datetime): v = {'date': v.strftime('%Y-%m-%d')}
            if isinstance(v, datetime.time): v = v.strftime('%H:%M')
            if isinstance(v, str) and v.startswith('='): v = ''
            vals[c.row-1][c.column-1] = v
            fmts[c.row-1][c.column-1] = c.number_format
            if c.comment: notes[c.row-1][c.column-1] = c.comment.text
    out[ws.title] = {'values': vals, 'notes': notes, 'fmts': fmts}
# seed sample data in Bitácora 4D (synthetic)
s = out['Bitácora 4D ']['values']
random.seed(3)
def col4d(n): return 7+2*(n-1) if n<=56 else 121+2*(n-57)
samples = ['Me sentí tranquilo durante el día.', 'Un poco cansado por la mañana, mejor por la tarde.', 'Día con más energía de lo habitual.', 'Algo de ansiedad por el trabajo.']
for n, base in [(0,-1)] + [(d, -1 if d < 5 else 0) for d in range(1,6)] + [(d,1) for d in range(57,61)]:
    c = 5 if n == 0 else col4d(n)
    s[8][c-1] = 'Finalizado'
    for r in list(range(10,16)) + list(range(17,31)):
        if r == 15: continue
        s[r-1][c-1] = max(-3, min(3, base + random.choice([-1,0,0,1])))
        s[r-1][c] = random.choice(samples)
    if n:
        s[6][c] = 'Toma ▶️' if n % 3 == 1 else 'Descanso ⏸️'
s[12][col4d(3)] = 'Soñé que caminaba por un bosque con mi familia; sentí mucha paz.'
s[12][col4d(58)] = 'Sueño con agua, muy vívido.'
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixture.json'), 'w'), ensure_ascii=False)
print('ok', {k: (len(v['values']), len(v['values'][0])) for k, v in out.items()})
