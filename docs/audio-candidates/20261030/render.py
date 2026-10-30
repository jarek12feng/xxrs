"""Original deterministic synthesized score and foley. No external recordings.
Run: python3 docs/audio-candidates/20261030/render.py (requires numpy).
Outputs only foundation-v2 and this dated review directory; does not run v1 renderer.
"""
from pathlib import Path
import hashlib, json, wave
import numpy as np
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'public/audio/foundation-v2'
DOC = Path(__file__).resolve().parent
SR = 32000
rng = np.random.default_rng(20261030)
assets = []

def tone(note, duration, kind='pluck'):
    t = np.arange(round(duration * SR)) / SR
    f = 440 * 2 ** ((note - 69) / 12)
    if kind == 'pluck':
        y = sum(np.sin(2*np.pi*f*k*t + k*.03) * np.exp(-t*(1.4+k*.8)) / k**1.6 for k in range(1, 8))
        y *= np.minimum(t/.006, 1)
    elif kind == 'flute':
        phase = 2*np.pi*f*t + .025*np.sin(2*np.pi*4.6*t)
        y = (np.sin(phase)+.14*np.sin(2*phase))*.6
        y *= np.minimum(t/.18, 1)*np.minimum((duration-t)/.25, 1)
    elif kind == 'pad':
        y = (np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*1.0015*t))*.5
        y *= np.minimum(t/.6, 1)*np.minimum((duration-t)/.8, 1)
    elif kind == 'bell':
        y = sum(a*np.sin(2*np.pi*f*k*t)*np.exp(-t*r) for k,a,r in [(1,1,1.5),(2.01,.22,2.5),(2.76,.08,4)])
        y *= np.minimum(t/.004, 1)
    elif kind == 'wood':
        y = (np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*1.63*t))*np.exp(-t*20)
        y *= np.minimum(t/.002, 1)
    else:
        y = np.convolve(rng.normal(0,1,len(t)), np.ones(31)/31, mode='same')
        y *= np.sin(np.pi*t/duration)**2
    return y*np.minimum((duration-t)/.025, 1)

def add(buf, y, start, gain=.15, pan=0):
    idx = (round(start*SR)+np.arange(len(y))) % len(buf)
    stereo = y[:,None]*np.sqrt([(1-pan)/2,(1+pan)/2])*gain
    np.add.at(buf, idx, stereo)

def save(key, title, kind, buf, usage, target=-24):
    loop = kind != 'effect'
    dry = buf.copy()
    for sec, gain in [(.083,.1),(.167,.08),(.331,.06),(.557,.04)]:
        n = round(sec*SR)
        if loop: buf += np.roll(dry[:,::-1],n,axis=0)*gain
        else: buf[n:] += dry[:-n,::-1]*gain
    buf -= buf.mean(axis=0)
    if loop:
        # A short circular endpoint correction preserves the body and avoids a click.
        n = round(.025*SR)
        midpoint = (buf[0]+buf[-1])/2
        buf[:n] += (midpoint-buf[0])*np.linspace(1,0,n)[:,None]
        buf[-n:] += (midpoint-buf[-1])*np.linspace(0,1,n)[:,None]
    else:
        n = round(.025*SR)
        buf[:n] *= np.linspace(0,1,n)[:,None]
        buf[-n:] *= np.linspace(1,0,n)[:,None]
    rms = np.sqrt(np.mean(buf*buf)); peak = np.max(np.abs(buf))
    buf *= min(10**(target/20)/rms, 10**(-4/20)/peak)
    pcm = np.round(buf*32767).astype('<i2')
    path = OUT/(key+'.wav')
    with wave.open(str(path),'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    assets.append(dict(id=key,title=title,kind=kind,file=path.name,usage=usage,loop=loop,
        seconds=round(len(buf)/SR,3),sampleRate=SR,channels=2,peakDbFS=round(20*np.log10(np.max(np.abs(pcm))/32768),2),
        rmsDbFS=round(20*np.log10(np.sqrt(np.mean((pcm.astype(float)/32768)**2))),2),
        seamDelta=float(np.max(abs(pcm[-1].astype(int)-pcm[0].astype(int))))/32768,
        sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    print(path.name, flush=True)

# Each theme has its own melody, register, rhythm and instrumentation; 16 bars.
SCORES = [
 ('foundation','筑基出关',80,62,[0,7,9,5],[[0,2,7,None],[9,7,2,0],[7,9,12,14],[12,7,2,0]],'筑基后修行、能力兑现；开阔拨弦与笛声'),
 ('survey','尺绳过雨',84,62,[0,5,7,0],[[2,5,7,2],[0,None,2,5],[7,9,7,5],[2,0,None,0]],'沈听澜勘路、绘图、交接；轻快拨弦与木击'),
 ('lamps','两岸应灯',72,57,[0,7,5,0],[[0,7,None,2],[5,2,0,None],[7,12,9,7],[5,2,0,None]],'尹照川校阵、轮值与渡口夜灯；钟音左右应答'),
 ('sunken','沉井灵痕',60,50,[0,0,5,7],[[0,None,2,None],[7,None,5,2],[0,7,None,9],[5,2,None,0]],'无名渡沉井探索、传承室；低持续音与稀疏钟声，不暗示死者发声'),
 ('frontier','长风破禁',96,50,[0,7,5,9],[[0,2,7,9],[7,5,2,0],[7,9,12,7],[5,7,2,0]],'筑基挑战、雪线与外府破禁；低木击脉冲与拨弦'),
 ('parting','各赴青山',68,62,[0,5,9,7],[[7,5,2,None],[0,2,5,2],[9,7,5,None],[2,0,None,0]],'正常分别、各自成长；克制的笛声，不用于确认死亡'),
 ('return','归来有期',76,62,[0,9,5,0],[[0,2,7,5],[2,7,9,None],[12,9,7,2],[5,2,0,None]],'正常重逢、旅亭与共同生活；温暖应答，不能以失联推定团聚'),
]
OUT.mkdir(parents=True, exist_ok=True)
for key,title,bpm,root,roots,phrases,usage in SCORES:
    beat = 60/bpm; bar = beat*4
    buf = np.zeros((round(16*bar*SR),2))
    for b in range(16):
        start = b*bar; bass = root-12+roots[(b//2)%4]
        for interval,gain,pan in [(0,.10,-.3),(7,.045,.3)]:
            add(buf,tone(bass+interval,bar*1.4,'pad'),start,gain,pan)
        pattern = [0,7,12,7,14,7,12,7] if key=='frontier' else [0,7,14,7]
        if key=='sunken': pattern=[0,14]
        for i,note in enumerate(pattern):
            add(buf,tone(bass+12+note,2.4),start+i*bar/len(pattern),.14 if key=='survey' else .10,(-1)**i*.35)
        if b%4 != 2:
            for i,note in enumerate(phrases[b%4]):
                if note is None: continue
                instrument = 'bell' if key in ('lamps','sunken') else 'flute'
                duration = 3 if instrument=='bell' else beat*1.25
                add(buf,tone(root+12+note,duration,instrument),start+(i+.2)*beat,.085,(-1)**i*.3)
        else:
            for i,n in enumerate([9,7,2]):
                add(buf,tone(root+12+n,2.8),start+(i+.4)*beat,.12,.2)
        if key in ('survey','frontier'):
            for i in ([0,2] if key=='survey' else [0,1.5,2,3.5]):
                add(buf,tone(38,.4,'wood'),start+i*beat,.10 if key=='survey' else .18)
    save(key,title,'music',buf,usage)

EFFECTS = [
 ('route-mark','落定路标',[74,69,76],'pluck','勘路实际完成或修订图线'),
 ('lamp-align','校准阵灯',[57,64,69,76],'bell','灯阵实际校准，双音应答'),
 ('ward-learn','护身诀领悟',[50,57,62,69],'pluck','首次获得护身诀，或实际研习成果'),
 ('ward-test','护势化流',[50,62,69],'pad','已装配功法并成功通过归路试验'),
 ('handover','同行交接',[69,74,76,74],'pluck','协作段落实际完成，不表示定情'),
 ('array-open','禁制开启',[38,50,57,62],'bell','实际破禁成功'),
 ('inheritance','传承入识',[62,69,74,81],'bell','真实取得修行传承，不按图片播放'),
 ('signal-send','发出灯讯',[69,76],'bell','发出求援或联络，不能代表已获回应'),
 ('signal-reply','彼端应讯',[76,69,74],'bell','确认收到对方真实回应'),
 ('rescue-clear','共同脱险',[50,57,62,74],'pluck','双方撤离成功，单方猜测不触发'),
 ('vow','同心立契',[62,69,76,74],'bell','双方明确结契；普通朋友不播放'),
 ('farewell','暂别珍重',[74,69,62],'flute','正常分别，不等同死亡'),
 ('memorial','故人留念',[50,57,50],'pad','已确认死亡后的纪念；未知和失联禁用'),
 ('boat-step','踏上船板',[43,46],'wood','船板脚步，非环境循环'),
]
for key,title,notes,instrument,usage in EFFECTS:
    buf = np.zeros((round(4*SR),2))
    for i,note in enumerate(notes):
        add(buf,tone(note,1.8 if instrument!='wood' else .35,instrument),.1+i*.28,.24,(i%2-.5)*.4)
    if key in ('ward-test','array-open','rescue-clear'):
        add(buf,tone(40,1.6,'air'),.05,.20)
    save(key,title,'effect',buf,usage,-24 if key not in ('boat-step','route-mark') else -28)

for key,title,usage in [
 ('waterside','渡口水岸','水岸、船埠的连续水声'),
 ('rain-shelter','雨落棚檐','勘路雨棚、听雨旅亭'),
 ('wind-chimes','山风檐铃','灯房、庭院与山门'),
 ('snow-wind','雪线长风','雪线与外府高地，轻风不带人声')]:
    duration=24; buf=np.zeros((duration*SR,2)); t=np.arange(len(buf))/SR
    for channel in range(2):
        noise=rng.normal(0,1,len(buf))
        smooth=np.convolve(noise,np.ones(95 if key in ('waterside','snow-wind') else 13)/(95 if key in ('waterside','snow-wind') else 13),mode='same')
        rate=4 if key=='waterside' else 2
        buf[:,channel]=smooth*(.6+.3*np.sin(2*np.pi*rate*t/duration+channel*.8))
    if key=='rain-shelter':
        for _ in range(140):
            add(buf,tone(int(rng.integers(65,90)),.15,'wood'),float(rng.uniform(0,duration)),.012,float(rng.uniform(-.8,.8)))
    if key=='wind-chimes':
        buf*=.3
        for i,note in enumerate([81,88,90,81,85,88,90]):
            add(buf,tone(note,3.2,'bell'),1+i*3.1,.035,(-1)**i*.5)
    save(key,title,'ambience',buf,usage,-31)

(DOC/'manifest.json').write_text(json.dumps({'version':'foundation-v2','source':'Original procedural composition and synthesis; no external samples or recordings.','assets':assets},ensure_ascii=False,indent=2)+'\n')
# Static audition page works from file:// and from the Vite dev server.
rows=[]
for a in assets:
    loop=' loop' if a['loop'] else ''
    rows.append(f'<article><h2>{a["title"]} <small>{a["id"]} · {a["seconds"]} 秒</small></h2><p>{a["usage"]}</p><audio controls preload="none"{loop} src="../../../public/audio/foundation-v2/{a["file"]}"></audio></article>')
(DOC/'index.html').write_text('''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>筑基声音库 · 试听</title><style>body{max-width:1000px;margin:auto;padding:24px;background:#162522;color:#eee5d3;font:17px/1.6 system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}article{background:#253a33;padding:18px;border-radius:12px}h2{font-size:20px}small{display:block;color:#c3cabc;font-size:13px}audio{width:100%}p{min-height:3em}button{padding:10px 22px}</style><h1>筑基声音库</h1><p>7 首配乐 · 14 个音效 · 4 条环境循环。原创程序合成音色，非真人演奏或实地录音。点击播放；切换时自动停止上一条。循环文件可跨接缝试听。</p><button onclick="document.querySelectorAll('audio').forEach(a=>a.pause())">停止播放</button><main>'''+''.join(rows)+'''</main><script>document.querySelectorAll('audio').forEach(a=>{a.volume=.45;a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(b=>{if(a!==b)b.pause()}))})</script></html>''')
