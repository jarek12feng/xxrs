"""Decode and check the delivered PCM, not just renderer metadata."""
from pathlib import Path
import hashlib, json, wave
import numpy as np
DOC=Path(__file__).resolve().parent
ROOT=DOC.parents[2]
manifest=json.loads((DOC/'manifest.json').read_text())
results=[]
preview=[]
for a in manifest['assets']:
    p=ROOT/'public/audio/foundation-v2'/a['file']
    with wave.open(str(p),'rb') as w:
        assert (w.getnchannels(),w.getsampwidth(),w.getframerate())==(2,2,32000)
        pcm=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2)
    x=pcm.astype(float)/32768
    peak=float(np.max(np.abs(x))); rms=float(np.sqrt(np.mean(x*x)))
    seam=float(np.max(np.abs(x[-1]-x[0])))
    assert 0 < peak <= 10**(-3.99/20), (p,peak)
    assert rms > .001, (p,rms)
    assert abs(len(x)/32000-a['seconds']) <= .001
    assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256']
    if a['loop']: assert seam < .001, (p,seam)
    else: assert np.max(np.abs(x[[0,-1]])) == 0
    results.append({'file':a['file'],'decodedFrames':len(x),'peakDbFS':round(20*np.log10(peak),2),'rmsDbFS':round(20*np.log10(rms),2),'seamDelta':seam,'passed':True})
    clip=x[:min(len(x),32000*(12 if a['kind']=='music' else 6))].copy()
    if a['loop']:
        n=round(.15*32000); clip[:n]*=np.linspace(0,1,n)[:,None];clip[-n:]*=np.linspace(1,0,n)[:,None]
    preview.extend([clip,np.zeros((16000,2))])
assert len(results)==25
with wave.open(str(DOC/'preview.wav'),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(32000)
    w.writeframes(np.round(np.concatenate(preview)*32767).astype('<i2').tobytes())
(DOC/'validation.json').write_text(json.dumps({'checks':'Decoded PCM format, non-silence, peak headroom, duration, loop seam, one-shot endpoints, SHA-256','notValidated':'Human listening quality, true-peak/LUFS, Windows device mix, long-session fatigue','files':results},ensure_ascii=False,indent=2)+'\n')
print(f'{len(results)} PCM files passed; preview.wav created')
