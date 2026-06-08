import FRUITS from '../config/fruits.config';
import { buildPlatePositions, calcPlateTileSize, getPlateBounds } from './plate';

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function overlapRatio(a, b, size) {
  const h = size * 0.34;
  const box = (t) => ({ left: t.x - h, right: t.x + h, top: t.y - h, bottom: t.y + h });
  const A = box(a);
  const B = box(b);
  const ox = Math.max(0, Math.min(A.right, B.right) - Math.max(A.left, B.left));
  const oy = Math.max(0, Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top));
  return (ox * oy) / (size * size * 0.55);
}

function buildLayerBuckets(tiles) {
  const buckets = new Map();
  for (let i = 0; i < tiles.length; i += 1) {
    const t = tiles[i];
    if (t.removed) continue;
    const list = buckets.get(t.layer);
    if (list) list.push(t);
    else buckets.set(t.layer, [t]);
  }
  return buckets;
}

function isBlockedByUpper(tile, buckets, upperLayers) {
  for (let i = 0; i < upperLayers.length; i += 1) {
    const layer = upperLayers[i];
    const list = buckets.get(layer);
    if (!list) continue;
    for (let j = 0; j < list.length; j += 1) {
      const other = list[j];
      if (overlapRatio(tile, other, Math.min(tile.size, other.size)) > 0.42) return true;
    }
  }
  return false;
}

/** 一次划分遮挡/可点，供渲染与点击复用 */
export function partitionBoardTiles(tiles) {
  const buckets = buildLayerBuckets(tiles);
  const layers = [...buckets.keys()].sort((a, b) => a - b);
  const blocked = [];
  const exposed = [];

  for (let li = 0; li < layers.length; li += 1) {
    const layer = layers[li];
    const list = buckets.get(layer);
    const upper = layers.slice(li + 1);
    for (let i = 0; i < list.length; i += 1) {
      const tile = list[i];
      if (isBlockedByUpper(tile, buckets, upper)) blocked.push(tile);
      else exposed.push(tile);
    }
  }

  const sortFn = (a, b) => a.layer - b.layer || a.uid - b.uid;
  blocked.sort(sortFn);
  exposed.sort(sortFn);
  return { blocked, exposed, liveCount: blocked.length + exposed.length };
}

function buildTileDeck(count) {
  const fruitSlots = count - 3;
  const triples = Math.floor(fruitSlots / 3);
  const deck = [];
  for (let i = 0; i < 3; i += 1) deck.push({ kind: 'bomb' });
  for (let i = 0; i < triples; i += 1) {
    const fruit = FRUITS[i % FRUITS.length];
    deck.push({ kind: 'fruit', fruit }, { kind: 'fruit', fruit }, { kind: 'fruit', fruit });
  }
  const remain = fruitSlots - triples * 3;
  for (let i = 0; i < remain; i += 1) {
    const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    deck.push({ kind: 'fruit', fruit });
  }
  return shuffle(deck);
}

export function generateBoard(level, area) {
  const plate = getPlateBounds(area);
  const tileSize = calcPlateTileSize(level, plate);
  const positions = buildPlatePositions(level, plate, tileSize);
  const deck = buildTileDeck(level.tileCount);

  return deck.map((entry, i) => {
    const pos = positions[i] || positions[positions.length - 1];
    const base = {
      uid: i,
      x: pos.x,
      y: pos.y,
      layer: pos.layer,
      rot: pos.rot,
      size: tileSize,
      removed: false,
    };
    if (entry.kind === 'bomb') {
      return { ...base, kind: 'bomb', emoji: '💣' };
    }
    const fruit = entry.fruit;
    return {
      ...base,
      kind: 'fruit',
      fruitId: fruit.id,
      emoji: fruit.emoji,
      color: fruit.color,
    };
  });
}

export function isTileBlocked(tile, tiles) {
  for (let i = 0; i < tiles.length; i += 1) {
    const other = tiles[i];
    if (other.removed || other.uid === tile.uid) continue;
    if (other.layer <= tile.layer) continue;
    if (overlapRatio(tile, other, Math.min(tile.size, other.size)) > 0.42) return true;
  }
  return false;
}

export function isExposed(tile, tiles) {
  return !tile.removed && !isTileBlocked(tile, tiles);
}

export function hitExposedTile(tiles, x, y, partition) {
  const list = partition ? partition.exposed : partitionBoardTiles(tiles).exposed;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i];
    const h = t.size * 0.48;
    if (x >= t.x - h && x <= t.x + h && y >= t.y - h && y <= t.y + h) return t;
  }
  return null;
}

export function remainingOnBoard(tiles) {
  let n = 0;
  for (let i = 0; i < tiles.length; i += 1) {
    if (!tiles[i].removed) n += 1;
  }
  return n;
}
