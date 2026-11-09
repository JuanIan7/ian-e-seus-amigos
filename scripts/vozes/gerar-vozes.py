#!/usr/bin/env python3
"""Gera as falas do jogo com voz natural (Gemini TTS) e escreve o manifesto usado por src/audio.js.
Entrada: scripts/vozes/falas.json  [{texto, voz: 'f'|'m'}]
Saída:   public/vozes/<id>.m4a  +  src/vozes-manifest.js
Chave:   GEMINI_API_KEY no ambiente ou em ~/Projetos/gbs-online/.env.local (só rodar com autorização do Juan: API paga).
Uso:     python3 scripts/vozes/gerar-vozes.py [--so-faltantes] [--voz-f Kore] [--voz-m Charon]
"""
import json, os, re, sys, base64, struct, subprocess, hashlib, time, urllib.request, urllib.error
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
args = sys.argv[1:]
def opt(name, default):
    return args[args.index(name) + 1] if name in args else default
VOZ = {'f': opt('--voz-f', 'Kore'), 'm': opt('--voz-m', 'Charon')}
SO_FALTANTES = '--so-faltantes' in args
MODELO = 'gemini-2.5-flash-preview-tts'
ESTILO = {'f': 'Leia em português do Brasil com voz feminina jovem, carinhosa e animada, como uma mãe falando com uma criança de 4 anos num jogo; frase curta, clara, sem pressa: ',
          'm': 'Leia em português do Brasil com voz masculina calorosa e firme, como um pai bombeiro falando com o filho pequeno num jogo; frase curta, clara, sem pressa: '}
chave = os.environ.get('GEMINI_API_KEY')
if not chave and os.path.exists(os.path.expanduser('~/Projetos/gbs-online/.env.local')):
    for l in open(os.path.expanduser('~/Projetos/gbs-online/.env.local')):
        if l.startswith('GEMINI_API_KEY='): chave = l.split('=', 1)[1].strip().strip('"')
if not chave: sys.exit('falta GEMINI_API_KEY')
falas = json.load(open(f'{ROOT}/scripts/vozes/falas.json'))
outdir = f'{ROOT}/public/vozes'; os.makedirs(outdir, exist_ok=True)
def ident(texto, voz):
    return voz + '-' + hashlib.sha1((voz + '|' + texto).encode()).hexdigest()[:10]
def gerar(texto, voz, dest):
    corpo = {'contents': [{'parts': [{'text': ESTILO[voz] + texto}]}],
             'generationConfig': {'responseModalities': ['AUDIO'], 'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': VOZ[voz]}}}}}
    for tent in range(4):
        try:
            req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{MODELO}:generateContent',
                                         data=json.dumps(corpo).encode(), headers={'Content-Type': 'application/json', 'x-goog-api-key': chave})
            r = json.loads(urllib.request.urlopen(req, timeout=120).read()); break
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and tent < 3: time.sleep(8 * (tent + 1)); continue
            raise
    parte = r['candidates'][0]['content']['parts'][0]['inlineData']
    pcm = base64.b64decode(parte['data']); taxa = int(re.search(r'rate=(\d+)', parte['mimeType']).group(1)) if 'rate=' in parte['mimeType'] else 24000
    wav = dest + '.wav'
    with open(wav, 'wb') as w:
        w.write(b'RIFF' + struct.pack('<I', 36 + len(pcm)) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, 1, taxa, taxa * 2, 2, 16) + b'data' + struct.pack('<I', len(pcm)) + pcm)
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', wav, dest], check=True); os.remove(wav)
manifest = {}
total = 0
for f in falas:
    voz = f.get('voz', 'f'); fid = ident(f['texto'], voz) + '.m4a'; dest = f'{outdir}/{fid}'
    if not (SO_FALTANTES and os.path.exists(dest)) and not os.path.exists(dest):
        gerar(f['texto'], voz, dest); total += 1; print('ok ', voz, f['texto'])
    manifest[f['texto']] = {'f': fid, 'v': voz}
# remove arquivos órfãos (frases que saíram do jogo)
usados = {m['f'] for m in manifest.values()}
for fn in os.listdir(outdir):
    if fn.endswith('.m4a') and fn not in usados: os.remove(f'{outdir}/{fn}'); print('removido', fn)
js = "// GERADO por scripts/vozes/gerar-vozes.py a partir de scripts/vozes/falas.json. Não editar à mão.\n// texto exato -> { f: arquivo em public/vozes/, v: 'f' (feminina) | 'm' (masculina) }\nexport const VOICES = " + json.dumps(manifest, ensure_ascii=False, indent=1) + ";\n"
open(f'{ROOT}/src/vozes-manifest.js', 'w').write(js)
print(f'{total} geradas; manifesto com {len(manifest)} falas')
