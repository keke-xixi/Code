"""Remove white/near-white backgrounds from game sprites (in-place)."""
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'images'
SPRITES = [
    'slot_nest.png', 'nest.png', 'bullet.png',
    'tower_chick.png', 'tower_rooster.png', 'tower_kungfu.png',
    'tower_kun.png', 'tower_fighter.png', 'tower_satellite.png',
    'enemy_eagle.png', 'enemy_snake.png', 'enemy_weasel.png',
    'enemy_fox.png', 'enemy_demon.png',
]
WHITE_THRESH = 228
FEATHER_THRESH = 200


def is_near_white(rgb, thresh=WHITE_THRESH):
    r, g, b = rgb[:3]
    return r >= thresh and g >= thresh and b >= thresh


def remove_white_bg(path: Path) -> None:
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = img.load()
    visited = set()
    q = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))
        c = px[x, y]
        if not is_near_white(c):
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
            if m >= FEATHER_THRESH and max(abs(r - g), abs(g - b), abs(r - b)) < 18:
                fade = max(0, min(255, int((255 - m) * 6)))
                px[x, y] = (r, g, b, fade)

    img.save(path, 'PNG')
    print(f'OK {path.name}')


def main():
    for name in SPRITES:
        p = ROOT / name
        if p.exists():
            remove_white_bg(p)
        else:
            print(f'SKIP missing {name}')


if __name__ == '__main__':
    main()
