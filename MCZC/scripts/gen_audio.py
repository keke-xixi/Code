"""Generate soft puzzle-game audio for 镜像双生."""
import math
import struct
import wave
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'audio'
RATE = 22050


def write_wav(path, samples):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        frames = b''.join(struct.pack('<h', max(-32767, min(32767, int(s * 32767)))) for s in samples)
        w.writeframes(frames)


def env(t, attack, release, duration):
    if t < attack:
        return t / attack
    if t > duration - release:
        return max(0, (duration - t) / release)
    return 1.0


def tone(freq, t, vol=1.0):
    return vol * math.sin(2 * math.pi * freq * t)


def gen_find():
    duration = 0.42
    n = int(RATE * duration)
    samples = []
    freqs = [(523.25, 0.55), (659.25, 0.35), (783.99, 0.2)]
    for i in range(n):
        t = i / RATE
        e = env(t, 0.01, 0.18, duration)
        s = sum(tone(f, t, v) for f, v in freqs) * e * 0.22
        samples.append(s)
    write_wav(OUT / 'find.wav', samples)


def gen_miss():
    duration = 0.28
    n = int(RATE * duration)
    samples = []
    for i in range(n):
        t = i / RATE
        e = env(t, 0.005, 0.12, duration)
        f = 180 - 40 * (t / duration)
        s = (tone(f, t, 0.7) + tone(f * 1.5, t, 0.15)) * e * 0.12
        samples.append(s)
    write_wav(OUT / 'miss.wav', samples)


def gen_bgm_loop(path, chords, arp, tempo=2.2, pad_vol=0.09, bell_vol=0.05, duration=24.0):
    n = int(RATE * duration)
    samples = []
    for i in range(n):
        t = i / RATE
        ci = int(t / 3.0) % len(chords)
        chord = chords[ci]
        pad = sum(tone(f, t, pad_vol) + tone(f * 0.998, t, pad_vol * 0.45) for f in chord)
        ai = int((t * tempo) % len(arp))
        arp_t = (t * tempo) % 1.0
        arp_e = env(arp_t, 0.02, 0.35, 1.0)
        bell = tone(arp[ai], t, bell_vol) * arp_e
        breath = math.sin(2 * math.pi * 0.08 * t) * 0.012
        fade = 1.0
        if t < 1.5:
            fade = t / 1.5
        elif t > duration - 2.0:
            fade = max(0, (duration - t) / 2.0)
        s = (pad + bell + breath) * fade * 0.55
        samples.append(s)
    write_wav(path, samples)


def gen_all_bgm():
    # 选关 · 空灵慢板
    gen_bgm_loop(
        OUT / 'bgm_menu.wav',
        [[261.63, 329.63, 392.00], [293.66, 369.99, 440.00], [246.94, 311.13, 369.99]],
        [392.00, 493.88, 587.33, 493.88],
        tempo=1.6, pad_vol=0.07, bell_vol=0.035,
    )
    # 暖阳场景 · 午后/露营/海边
    gen_bgm_loop(
        OUT / 'bgm_warm.wav',
        [[261.63, 329.63, 392.00, 523.25], [293.66, 369.99, 440.00, 587.33], [329.63, 415.30, 493.88, 659.25]],
        [523.25, 659.25, 783.99, 659.25],
        tempo=2.0, pad_vol=0.08, bell_vol=0.045,
    )
    # 静夜场景 · 古巷/樱花/雪村/秘境
    gen_bgm_loop(
        OUT / 'bgm_cool.wav',
        [[220.00, 277.18, 329.63, 440.00], [246.94, 311.13, 369.99, 493.88], [196.00, 246.94, 293.66, 392.00]],
        [440.00, 523.25, 659.25, 523.25],
        tempo=1.8, pad_vol=0.075, bell_vol=0.04,
    )


if __name__ == '__main__':
    gen_find()
    gen_miss()
    gen_all_bgm()
    print('ok', OUT)
