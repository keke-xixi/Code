import { generateBoard, remainingOnBoard, partitionBoardTiles } from './base/board';
import { getBoardArea } from './base/layout';
import CONFIG from './config/game.config';
import { getLevel } from './config/levels.config';
import { setStars, unlock } from './base/progress';
let instance;

export default class DataBus {
  scene = 'menu';
  levelId = 1;
  frame = 0;

  tiles = [];
  slots = [];
  bombsFound = 0;
  cleared = 0;

  flashMsg = '';
  flashUntil = 0;

  isWin = false;
  isOver = false;
  stars = 0;

  menuIndex = 0;
  menuDragX = 0;
  showExitConfirm = false;
  touchStartScene = '';

  _boardPartition = null;

  constructor() {
    if (instance) return instance;
    instance = this;
  }

  startLevel(id) {
    const lv = getLevel(id);
    const area = getBoardArea();

    this.scene = 'play';
    this.levelId = id;
    this.frame = 0;
    this.tiles = generateBoard(lv, area);
    this.slots = [];
    this.bombsFound = 0;
    this.cleared = 0;
    this.flashMsg = '';
    this.flashUntil = 0;
    this.isWin = false;
    this.isOver = false;
    this.stars = 0;
    this.showExitConfirm = false;
    this._boardPartition = null;
  }

  invalidateBoardPartition() {
    this._boardPartition = null;
  }

  getBoardPartition() {
    if (!this._boardPartition) {
      const { blocked, exposed, liveCount } = partitionBoardTiles(this.tiles);
      this._boardPartition = {
        blocked,
        exposed,
        liveCount,
        exposedSet: new Set(exposed.map((t) => t.uid)),
      };
    }
    return this._boardPartition;
  }

  tick() {
    if (this.scene === 'menu') {
      this.frame += 1;
      return;
    }
    if (this.scene !== 'play' || this.isOver || this.showExitConfirm) return;
    this.frame += 1;
    if (this.flashUntil > 0) {
      this.flashUntil -= 1;
      if (this.flashUntil <= 0) this.flashMsg = '';
    }
  }

  pickTile(tile) {
    if (!tile || tile.removed || this.isOver) return null;
    const partition = this.getBoardPartition();
    if (!partition.exposedSet.has(tile.uid)) return null;

    tile.removed = true;
    this.invalidateBoardPartition();

    if (tile.kind === 'bomb') {
      this.bombsFound += 1;
      if (this.bombsFound >= 3) {
        this.win();
        return { action: 'bomb', done: true };
      }
      return { action: 'bomb', done: false };
    }

    let insertAt = this.slots.length;
    for (let i = this.slots.length - 1; i >= 0; i -= 1) {
      if (this.slots[i].fruitId === tile.fruitId) insertAt = i + 1;
      else break;
    }

    return { action: 'fruit', tile, insertAt };
  }

  commitFruitPick(pending) {
    const { tile, insertAt } = pending;
    this.slots.splice(insertAt, 0, tile);

    const matched = this.clearSlotTriples();
    if (this.slots.length >= CONFIG.slotMax) {
      this.fail();
      return matched ? 'clear' : 'overflow';
    }
    return matched ? 'clear' : 'pick';
  }

  clearSlotTriples() {
    const counts = {};
    this.slots.forEach((s) => {
      counts[s.fruitId] = (counts[s.fruitId] || 0) + 1;
    });
    let cleared = false;
    Object.keys(counts).forEach((fid) => {
      if (counts[fid] < 3) return;
      let n = 0;
      this.slots = this.slots.filter((s) => {
        if (s.fruitId === fid && n < 3) {
          n += 1;
          this.cleared += 1;
          cleared = true;
          return false;
        }
        return true;
      });
    });
    return cleared;
  }

  remainingTiles() {
    return remainingOnBoard(this.tiles);
  }

  fail() {
    this.isOver = true;
    this.isWin = false;
    this.flashMsg = '槽位已满！';
    this.flashUntil = 80;
  }

  win() {
    this.isWin = true;
    this.isOver = true;
    const lv = getLevel(this.levelId);
    let stars = 1;
    if (this.cleared >= lv.tileCount * 0.12) stars = 2;
    if (this.cleared >= lv.tileCount * 0.25) stars = 3;
    this.stars = stars;
    setStars(this.levelId, stars);
    unlock(this.levelId + 1);
  }
}
