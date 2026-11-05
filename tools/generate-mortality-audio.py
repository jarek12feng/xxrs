"""Original deterministic ending scores. No recordings, third-party samples or network."""
import array, json, math, wave
from pathlib import Path
root = Path(__file__).resolve().parent.parent
out = root / 'public/audio/mortality-v1'
out.mkdir(parents=True, exist_ok=True)
rate, seconds = 22050, 36
report = []
# Three related, descending pentatonic phrases, with space for the life review.
for name, base, melody in [
    ('last-lamp', 146.8324, [12, 7, 9, 4, 2, 7, 4, 2, 0]),
    ('lost-tide', 130.8128, [19, 14, 12, 7, 9, 4, 7, 2, 0]),
    ('silent-thunder', 110, [24, 19, 14, 12, 7, 9, 4, 2, 0]),
]:
    data = [0.] * (rate * seconds)
    def note(at, length, frequency, volume, soft=False):
        for i in range(int(length * rate)):
            pos = round(at * rate) + i
            if pos >= len(data): break
            t = i / rate
            env = (1-math.exp(-t*(3 if soft else 24))) * math.exp(-t*(.6 if soft else .95))
            tone = math.sin(2*math.pi*frequency*t)
            tone += .2*math.sin(4*math.pi*frequency*t)*math.exp(-t*2)
            tone += .06*math.sin(6*math.pi*frequency*t)*math.exp(-t*3)
            data[pos] += volume * env * tone
    for k, step in enumerate(melody):
        at = 1.2 + k*3.4
        freq = base*2**(step/12)
        note(at, 5.5, freq, .18)
        note(at+.31, 5.5, freq, .035, True)
        if k % 3 == 0:
            note(at, 8, base/2, .075, True)
            note(at+.8, 7, base*.75, .04, True)
    # Very quiet breath-like low harmonic bed, fading to silence at the loop seam.
    for i in range(len(data)):
        t = i/rate
        fade = min(1,t/2)*min(1,(seconds-t)/4)
        data[i] = (data[i] + .012*math.sin(2*math.pi*base/4*t)*(1+.3*math.sin(t*.6))) * fade
    peak = max(map(abs,data)); gain = min(1,.6/peak)
    pcm = array.array('h',(round(x*gain*32767) for x in data))
    with wave.open(str(out/f'{name}.wav'),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(pcm.tobytes())
    report.append({'cue':name,'seconds':seconds,'sampleRate':rate,'peak':round(peak*gain,4),'rms':round(math.sqrt(sum((x*gain)**2 for x in data)/len(data)),4)})
(out/'provenance.json').write_text(json.dumps({'source':'Original procedural composition by tools/generate-mortality-audio.py; no third-party samples','files':report},indent=2)+'\n')
print(json.dumps(report))
