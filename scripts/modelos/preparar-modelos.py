#!/usr/bin/env python3
"""Prepara os modelos .glb do Tripo para o jogo (celular): reduz a textura embutida e tira extensões que encarecem o desenho.
Entrada: pasta com os .glb originais (ficam intactos).  Saída: public/modelos/<nome>.glb  +  resumo no terminal.
Uso:  python3 scripts/modelos/preparar-modelos.py "<pasta dos originais>" [--lado 512] [--so nome1,nome2]
Precisa do Pillow (pip install pillow). Não usa rede nem API.
"""
import sys, os, json, struct, io, glob
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
args = sys.argv[1:]
if not args: sys.exit(__doc__)
src = args[0]
lado = int(args[args.index('--lado') + 1]) if '--lado' in args else 512
so = set(args[args.index('--so') + 1].split(',')) if '--so' in args else None
out = os.path.join(ROOT, 'public', 'modelos'); os.makedirs(out, exist_ok=True)

def pad4(b, fill=b'\x00'): return b + fill * ((4 - len(b) % 4) % 4)

def preparar(path, dest):
    raw = open(path, 'rb').read()
    assert raw[:4] == b'glTF', 'não é .glb'
    jl = struct.unpack_from('<I', raw, 12)[0]; j = json.loads(raw[20:20 + jl].decode('utf8'))
    bo = 20 + jl; bl = struct.unpack_from('<I', raw, bo)[0]; binb = raw[bo + 8:bo + 8 + bl]
    views = j['bufferViews']; datas = [binb[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in views]
    info = []
    for im in j.get('images', []):
        i = im['bufferView']; img = Image.open(io.BytesIO(datas[i])); w0, h0 = img.size
        if max(w0, h0) > lado: img = img.convert('RGB').resize((lado, lado) if w0 == h0 else (round(w0 * lado / max(w0, h0)), round(h0 * lado / max(w0, h0))), Image.LANCZOS)
        else: img = img.convert('RGB')
        b = io.BytesIO(); img.save(b, 'JPEG', quality=86, optimize=True); datas[i] = b.getvalue(); im['mimeType'] = 'image/jpeg'
        info.append(f'{w0}x{h0}→{img.size[0]}x{img.size[1]}')
    # extensões só de vidro/volume (o Tripo põe em tudo): tiram o modelo do material simples sem ganho visual
    for m in j.get('materials', []):
        ex = m.get('extensions', {}); ex.pop('KHR_materials_volume', None); ex.pop('KHR_materials_transmission', None)
        if not ex: m.pop('extensions', None)
    for k in ('extensionsUsed', 'extensionsRequired'):
        if k in j:
            j[k] = [e for e in j[k] if e not in ('KHR_materials_volume', 'KHR_materials_transmission', 'FB_ngon_encoding')]
            if not j[k]: del j[k]
    for mesh in j.get('meshes', []):
        for p in mesh['primitives']: (p.get('extensions') or {}).pop('FB_ngon_encoding', None); p.pop('extensions', None) if not p.get('extensions') else None
    off = 0; blob = b''
    for v, d in zip(views, datas):
        d = pad4(d); v['byteOffset'] = off; v['byteLength'] = len(datas[views.index(v)]); blob += d; off += len(d)
    j['buffers'] = [{'byteLength': len(blob)}]
    js = pad4(json.dumps(j, separators=(',', ':')).encode('utf8'), b' ')
    total = 12 + 8 + len(js) + 8 + len(blob)
    with open(dest, 'wb') as f:
        f.write(b'glTF' + struct.pack('<II', 2, total) + struct.pack('<I', len(js)) + b'JSON' + js + struct.pack('<I', len(blob)) + b'BIN\x00' + blob)
    return len(raw), total, ', '.join(info)

tot0 = tot1 = 0
for p in sorted(glob.glob(os.path.join(src, '*.glb'))):
    nome = os.path.basename(p)[:-4].replace('ian-', '')
    if so and nome not in so: continue
    a, b, info = preparar(p, os.path.join(out, nome + '.glb')); tot0 += a; tot1 += b
    print(f'{nome:16s} {a/1024:7.0f} KB → {b/1024:6.0f} KB   textura {info}')
print(f'total {tot0/1048576:.1f} MB → {tot1/1048576:.1f} MB em {out}')
