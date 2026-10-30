"""Export reviewed candidates using cwebp; inventory and HTML only, no runtime edits."""
import hashlib
import html
import json
import pathlib
import subprocess

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent


def build():
    plan = json.loads((ROOT / 'plan.json').read_text())
    assets = []
    for job in plan['jobs']:
        record_path = ROOT / 'records' / (job['id'] + '.json')
        if not record_path.exists():
            assets.append(job)
            continue
        record = json.loads(record_path.read_text())
        original = ROOT / 'originals' / job['kind'] / (job['id'] + '.png')
        exported = ROOT / 'exports' / job['kind'] / (job['id'] + '.webp')
        exported.parent.mkdir(parents=True, exist_ok=True)
        size = ['1280', '0'] if job['kind'] == 'scenes' else ['0', '768'] if job['kind'] == 'characters' else ['384', '0']
        if not exported.exists() or exported.stat().st_mtime < original.stat().st_mtime:
            subprocess.run(['cwebp', '-quiet', '-q', '85', '-alpha_q', '100', '-resize', *size, str(original), '-o', str(exported)], check=True)
        with Image.open(original) as im:
            record['dimensions'] = list(im.size)
            record['alphaRange'] = list(im.getchannel('A').getextrema()) if 'A' in im.getbands() else None
        record['original'] = str(original.relative_to(ROOT))
        record['export'] = str(exported.relative_to(ROOT))
        record['bytes'] = exported.stat().st_size
        record['sha256'] = hashlib.sha256(exported.read_bytes()).hexdigest()
        assets.append(record)
    (ROOT / 'manifest.json').write_text(json.dumps({'scope': 'candidates-not-runtime', 'assets': assets}, ensure_ascii=False, indent=2) + '\n')
    cards = []
    rows = ['# 素材台账', '', '候选资源与剧情功能分开验收。planned 表示尚未完成；generated-awaiting-qa 表示已出图待验收；reviewed-candidate 表示候选图已检查，不代表已接入。', '', '| ID | 名称 | 类型 | 状态 | 使用条件 |', '| --- | --- | --- | --- | --- |']
    for a in sorted(assets, key=lambda a: (not ('outfit-' in a['id'] or a['id'] == 'shentinglan-simple'), a['phase'])):
        rows.append('| ' + ' | '.join(str(a.get(k, '')).replace('|', '/') for k in ['id', 'name', 'kind', 'status', 'gate']) + ' |')
        if 'export' not in a:
            continue
        e = html.escape
        cards.append(f'<article data-kind="{e(a["kind"])}" data-id="{e(a["id"])}"><div class="art {e(a["kind"])}"><img loading="lazy" src="{e(a["export"])}" alt="{e(a["name"])}"></div><h2>{e(a["name"])}</h2><p>{e(a["id"])} · {e(a["status"])}</p><p>{e(a["gate"])}</p><a href="{e(a["original"])}">PNG 原图</a> · <a href="{e(a["export"])}">WebP 导出</a></article>')
    (ROOT / 'ledger.md').write_text('\n'.join(rows) + '\n')
    (ROOT / 'gallery.html').write_text('''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>筑基后素材候选</title><style>
body{margin:0;padding:24px;background:#eee9dd;color:#25332e;font:16px/1.6 system-ui}header{max-width:1100px;margin:auto}h1{font-size:28px}button{padding:9px 18px;margin:4px;border:1px solid #6d7c70;border-radius:6px;background:#faf8f1;color:#25332e;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;margin-top:24px}article{background:#faf8f1;padding:12px;border-radius:10px;overflow:hidden}.art{height:330px;background:repeating-conic-gradient(#e4e1d6 0% 25%,#f4f2ea 0% 50%) 0/24px 24px}.art img{width:100%;height:100%;object-fit:contain}.scenes img{object-fit:cover}body.dark .art{background:#263c39}h2{font-size:18px}p{font-size:13px}a{color:#245d52}article[hidden]{display:none}</style><header><h1>筑基后剧情素材候选</h1><p>独立美术交付；未接入游戏。姓名、关系、死亡与境界条件须由真实剧情决定。静态立绘不等于完整动画。</p><nav id="filters"><button data-kind="all">全部</button><button data-kind="wardrobe">沈听澜五套服装</button><button data-kind="characters">角色</button><button data-kind="scenes">场景</button><button data-kind="items">物件</button><button data-kind="effects">效果</button><button id="background">切换深浅底</button></nav><p><a href="README.md">交付说明</a> · <a href="ledger.md">完整台账</a> · <a href="manifest.json">清单与校验值</a></p></header><main class="grid">''' + ''.join(cards) + '''</main><script>document.querySelector('#filters').addEventListener('click',e=>{const kind=e.target.dataset.kind;if(kind)document.querySelectorAll('article').forEach(a=>a.hidden=kind==='wardrobe'?!(a.dataset.id.includes('outfit-')||a.dataset.id==='shentinglan-simple'):kind!=='all'&&a.dataset.kind!==kind)});document.querySelector('#background').onclick=()=>document.body.classList.toggle('dark');</script></html>''')
    print(json.dumps({'planned': len(assets), 'exported': sum('export' in a for a in assets), 'bytes': sum(a.get('bytes', 0) for a in assets)}))


if __name__ == '__main__':
    build()
