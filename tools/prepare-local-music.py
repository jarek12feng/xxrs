"""macOS local audition only. No music is copied to public/ or dist/."""
import array
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile
import wave
import zipfile

root = Path(__file__).resolve().parent.parent
archive = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'music.zip'
out = root / '.local-music'
out.mkdir(exist_ok=True)
tracks = [('新桃旧符', 'home'), ('破阵乐', 'trial'), ('少年游', 'journey'), ('御剑江湖', 'vista'), ('悬疑1', 'mystery')]
report = []
with zipfile.ZipFile(archive) as z, tempfile.TemporaryDirectory() as tmp:
    for title, cue in tracks:
        matches = [n for n in z.namelist() if title in n and n.endswith('.mp4')]
        if len(matches) != 1:
            raise ValueError(f'{title}: expected exactly one source')
        source = Path(tmp) / 'source.mp4'
        source.write_bytes(z.read(matches[0]))
        decoded = Path(tmp) / 'decoded.wav'
        decoded.unlink(missing_ok=True)
        subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16', '-r', '44100', '-c', '2', str(source), str(decoded)], check=True)
        with wave.open(str(decoded), 'rb') as w:
            rate, channels = w.getframerate(), w.getnchannels()
            data = array.array('h', w.readframes(w.getnframes()))
        # Exclude original intro/tail fades; overlap tail into head for a smooth loop.
        data = data[rate * channels * 2:-rate * channels * 4]
        overlap = rate * channels * 2
        seam = array.array('h', (round(data[-overlap+i]*(1-i/overlap) + data[i]*(i/overlap)) for i in range(overlap)))
        data = data[overlap:-overlap] + seam
        rms = math.sqrt(sum(float(v)*v for v in data) / len(data)) / 32768
        peak = max(abs(v) for v in data) / 32768
        gain = min(10**(-23/20)/rms, 10**(-3/20)/peak)
        data = array.array('h', (round(v*gain) for v in data))
        with wave.open(str(out / f'{cue}.wav'), 'wb') as w:
            w.setnchannels(channels); w.setsampwidth(2); w.setframerate(rate); w.writeframes(data.tobytes())
        report.append({'cue': cue, 'title': title, 'seconds': len(data)/rate/channels, 'gainDb': round(20*math.log10(gain), 2), 'rmsDbFS': round(20*math.log10(rms*gain), 2)})
(out / 'analysis.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps(report, ensure_ascii=False, indent=2))
