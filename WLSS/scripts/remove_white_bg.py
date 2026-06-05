"""Remove white backgrounds from character/terrain sprites."""
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'images'
SPRITES = [
    'player_hero.png', 'enemy_ghost.png', 'boss_lord.png',
    'terrain_tree.png', 'terrain_rock.png', 'terrain_bone.png',
    'terrain_grave.png', 'terrain_ruin.png',
]
WHITE = 228
FEATHER = 200


def is_white(rgb, t=WHITE):
    r, g, b = rgb[:3]
    return r >= t and g >= t and b >= t


def process(path: Path) -> None:
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = img.load()
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    seen = set()
    while q:
        x, y = q.popleft()
        if (x, y) in seen:
            continue
        seen.add((x, y))
        c = px[x, y]
        if not is_white(c):
            continue
        px[x, y] = (c[0], c[1], c[2], 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                q.append((nx, ny))
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            m = min(r, g, b)
            if m >= FEATHER and max(abs(r - g), abs(g - b), abs(r - b)) < 20:
                fade = max(0, min(255, int((255 - m) * 6)))
                px[x, y] = (r, g, b, fade)
    img.save(path, 'PNG')
    print('OK', path.name)


def main():
    for name in SPRITES:
        p = ROOT / name
        if p.exists():
            process(p)


if __name__ == '__main__':
    main()
