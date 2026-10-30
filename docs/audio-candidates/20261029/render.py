"""Original score/sound design; numpy synthesis, no external samples. Python3 + numpy.
Run from repository root. Deterministic PCM masters; circular reverb on music.
"""
from pathlib import Path
import numpy as np
import wave, json, hashlib, subprocess
SR=44100
OUT=Path('public/audio/original-v1'); OUT.mkdir(parents=True, exist_ok=True)
DOC=Path('docs/audio-candidates/20261029'); DOC.mkdir(parents=True, exist_ok=True)
rng=np.random.default_rng(20261029)
report=[]
def hz(m): return 440*2**((m-69)/12)
def voice(m,d,kind):
 t=np.arange(round(d*SR))/SR; f=hz(m)
 if kind=='pluck':
  y=sum(np.sin(2*np.pi*f*k*t+.06*k)*np.exp(-t*(1.5+k*.65))*k**-1.5 for k in range(1,9))
  y*=np.minimum(t/.004,1)
 elif kind=='flute':
  phase=2*np.pi*f*t+.025*np.sin(2*np.pi*4.7*t)*np.minimum(t/.4,1)
  y=(np.sin(phase)+.19*np.sin(phase*2)+.055*np.sin(phase*3))*.65
  y*=np.minimum(t/.18,1)*np.minimum((d-t)/.3,1)
 elif kind=='pad':
  y=(np.sin(2*np.pi*f*t)+.28*np.sin(2*np.pi*f*1.002*t)+.12*np.sin(4*np.pi*f*t))*.5
  y*=np.minimum(t/.7,1)*np.minimum((d-t)/1.2,1)
 elif kind=='bell':
  y=sum(a*np.sin(2*np.pi*f*k*t)*np.exp(-t*r) for k,a,r in [(1,1,1.3),(2.01,.27,2.2),(2.76,.12,3),(5.4,.035,7)])
  y*=np.minimum(t/.004,1)
 elif kind=='drum':
  y=np.sin(2*np.pi*(f*t+35*.035*(1-np.exp(-t/.035))))*np.exp(-t*11)
  y+=rng.normal(0,.09,len(t))*np.exp(-t*45)
  y*=np.minimum(t/.002,1)
 elif kind=='air':
  n=rng.normal(0,1,len(t)); y=np.convolve(n,np.ones(19)/19,mode='same')
  y*=np.sin(np.pi*t/d)**2
 y*=np.minimum((d-t)/.012,1)
 return y

def add(buf,y,start,amp=1,pan=0,loop=False):
 idx=round(start*SR)+np.arange(len(y)); stereo=y[:,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])[None,:]*amp
 if loop:
  np.add.at(buf,idx%len(buf),stereo)
 else:
  valid=(idx>=0)&(idx<len(buf));buf[idx[valid]]+=stereo[valid]

def space(x,loop=False):
 y=x.copy()
 for delay,gain in [(.071,.12),(.113,.1),(.229,.09),(.367,.07),(.541,.05),(.811,.035)]:
  n=round(delay*SR)
  if loop:y+=np.roll(x[:,::-1],n,axis=0)*gain
  else:y[n:]+=x[:-n,::-1]*gain
 return y

def write(name,x,loop=False,target=-23):
 x=space(x,loop);x-=x.mean(axis=0)
 rms=np.sqrt(np.mean(x*x));peak=np.max(np.abs(x)); x*=min(10**(target/20)/max(rms,1e-9),10**(-3/20)/max(peak,1e-9))
 if not loop:
  n=min(441,len(x)//4);x[:n]*=np.linspace(0,1,n)[:,None];x[-n:]*=np.linspace(1,0,n)[:,None]
 pcm=np.round(np.clip(x,-1,1)*32767).astype('<i2');p=OUT/(name+'.wav')
 with wave.open(str(p),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
 report.append(dict(file=p.name,seconds=round(len(x)/SR,3),peakDbFS=round(20*np.log10(np.max(np.abs(x))),2),rmsDbFS=round(20*np.log10(np.sqrt(np.mean(x*x))),2),loop=loop,seamDelta=round(float(np.max(abs(x[-1]-x[0]))),6),sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
 return x

# Shared five-note identity D-E-A-G-E, reharmonized per scene; rests leave room for text.
configs=[('home',68,62),('mystery',56,50),('journey',84,62),('vista',64,62),('trial',100,50)]
for name,bpm,root in configs:
 beat=60/bpm;bar=4*beat;buf=np.zeros((round(16*bar*SR),2))
 roots=[0,7,9,5] if name not in ('mystery','trial') else [0,0,7,5]
 pent=[0,2,5,7,9]
 phrases=[[0,2,7,5],[2,0,-3,0],[7,9,12,7],[5,2,0,None]]
 for b in range(16):
  r=root+roots[(b//2)%4]-12; st=b*bar
  # Open fifths and added ninths avoid a busy cinematic chord wall.
  for k,a,p in [(0,.12,-.35),(7,.065,.3),(14,.03,0)]:
   add(buf,voice(r+k,bar*1.25,'pad'),st,a,p,True)
  arp=[r+12,r+19,r+26,r+19]
  if name=='trial':arp=[r+12,r+19,r+12,r+24,r+19,r+12,r+26,r+19]
  if name=='mystery':arp=[r+12,r+26]
  for i,m in enumerate(arp):
   add(buf,voice(m,2.7,'pluck'),st+i*bar/len(arp),.17 if name=='trial' else .12,(-.35 if i%2 else .35),True)
  phrase=phrases[b%4]
  # 4-bar call/response, then higher answering phrase; sparse flute entry.
  if name!='mystery' and b%4 in (0,1,3):
   for i,n in enumerate(phrase):
    if n is None:continue
    m=root+12+n+(0 if b<8 else (12 if b in (8,12) else 0))
    add(buf,voice(m,beat*(1.45 if i==3 else .8),'flute'),st+(i*.85+.35)*beat,.115 if name!='trial' else .065,.1,True)
  if name=='mystery' and b%2==0:
   add(buf,voice(root+24+[0,7,2,5][(b//2)%4],4.5,'bell'),st+beat*.7,.095,-.25,True)
   add(buf,voice(root+19,bar*.9,'air'),st,.025,.55,True)
  if name in ('journey','trial'):
   for i in ([0,2] if name=='journey' else [0,1.5,2,3.5]):
    add(buf,voice(38 if i in (0,2) else 50,.65,'drum'),st+i*beat,.13 if name=='journey' else .24,0,True)
  if name=='vista' and b%4==2:
   for i,n in enumerate([0,7,12,14]):add(buf,voice(root+12+n,4,'bell'),st+i*.5*beat,.06,-.5+i*.3,True)
  if name=='home' and b%4==2:
   for i,n in enumerate([9,7,2]):add(buf,voice(root+12+n,3,'pluck'),st+(i+.4)*beat,.18,.2,True)
 write(name,buf,True)
 print('rendered',name,flush=True)

# File-based effects: quiet interaction, tactile combat, recognisable growth cadence.
specs={
 'failure':(2.0,[(0,62,1.5,'pluck',.25),(.3,57,1.5,'pluck',.2)]),
 'death':(4.5,[(0,50,3.8,'pad',.25),(.5,45,3.7,'pad',.15),(.1,62,2.4,'bell',.08)]),
 'rebirth':(4.8,[(0,50,3.8,'pad',.18)]+[(.4+i*.3,m,2.3,'bell',.16) for i,m in enumerate([62,69,74,81])]),
 'reunion':(3.5,[(i*.24,m,2.6,'pluck',.2) for i,m in enumerate([62,66,69,74])]),
 'closure':(4.0,[(i*.35,m,2.8,'bell',.16) for i,m in enumerate([69,66,62])]+[(.6,50,3.2,'pad',.2)]),
 'work':(.65,[(0,45,.2,'drum',.2),(.22,50,.25,'drum',.12)]),
 'step':(.32,[(0,74,.25,'pluck',.4)]),
 'discovery':(1.9,[(0,74,1.7,'bell',.3),(.19,81,1.5,'bell',.22)]),
 'choice':(1.6,[(0,62,1.4,'pluck',.3),(.12,69,1.3,'pluck',.25),(.24,76,1.2,'bell',.15)]),
 'strike':(.65,[(0,45,.28,'air',.7),(.09,38,.45,'drum',.6),(.1,86,.4,'bell',.08)]),
 'guard':(1.0,[(0,45,.6,'drum',.45),(.02,62,.8,'bell',.22),(.04,69,.8,'bell',.14)]),
 'discern':(1.3,[(0,74,1.15,'bell',.3),(.14,81,1,'bell',.22)]),
 'hurt':(.65,[(0,35,.45,'drum',.5),(.06,47,.5,'air',.35)]),
 'victory':(3.2,[(i*.19,m,2.2,'bell',.22) for i,m in enumerate([62,69,74,78,81])]),
 'promotion':(4.3,[(i*.23,m,2.7,'bell',.23) for i,m in enumerate([50,57,62,69,74,81])]),
 'upgrade':(2.8,[(0,50,.5,'drum',.2)]+[(i*.14+.1,m,1.8,'bell',.24) for i,m in enumerate([62,69,74,81])]),
 'breakthrough':(5.0,[(0,50,2.1,'air',.2)]+[(i*.25+.5,m,2.8,'bell',.23) for i,m in enumerate([50,57,62,69,74,78,81])]),
 'gather':(1.15,[(0,50,.28,'air',.45),(.18,55,.32,'air',.3),(.45,74,.6,'pluck',.12)]),
 'cultivate':(2.2,[(0,50,2,'pad',.35),(.15,57,1.8,'pad',.18),(.1,50,1.6,'air',.08)]),
 'meditate':(1.8,[(0,81,1.6,'bell',.22),(.22,86,1.3,'bell',.12)]),
 'study':(.85,[(0,60,.18,'air',.45),(.15,60,.24,'air',.3),(.36,74,.4,'pluck',.08)]),
 'rest':(2.0,[(0,57,1.8,'pad',.3),(.2,62,1.6,'pad',.12)]),
 'medicine':(1.8,[(0,69,1.5,'pluck',.32),(.16,74,1.4,'bell',.17)])}
for name,(dur,events) in specs.items():
 buf=np.zeros((round(dur*SR),2))
 for st,m,d,kind,amp in events:add(buf,voice(m,d,kind),st,amp)
 write(name,buf,target=-26 if name in ('gather','cultivate','meditate','study','rest','work') else (-22 if name in ('step','hurt') else -19))
(DOC/'analysis.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
# A short, clearly separated listening reel; masters above have no intro fade.
parts=[]
for name,_,_ in configs:
 with wave.open(str(OUT/(name+'.wav')),'rb') as w:x=np.frombuffer(w.readframes(SR*12),dtype='<i2').reshape(-1,2).astype(float)/32768
 n=SR;x[:n]*=np.linspace(0,1,n)[:,None];x[-n:]*=np.linspace(1,0,n)[:,None];parts.extend([x,np.zeros((SR,2))])
for name in specs:
 with wave.open(str(OUT/(name+'.wav')),'rb') as w:x=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
 parts.extend([x,np.zeros((SR//2,2))])
x=np.concatenate(parts)
with wave.open(str(DOC/'试听合集.wav'),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype('<i2').tobytes())
(DOC/'试听合集.m4a').unlink(missing_ok=True)
subprocess.run(['afconvert','-f','m4af','-d','aac','-b','192000',str(DOC/'试听合集.wav'),str(DOC/'试听合集.m4a')],check=True)
print('done',len(report),'files')
