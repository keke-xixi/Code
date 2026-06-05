import CONFIG from './config/game.config';
import Player from './entity/player';
import { getNormalMax, recordRun } from './base/progress';
import { buildWorld } from './world/generator';
import { buildTerrain } from './world/terrain';
import { tickSpawner, updateEnemies } from './world/spawner';
import { tickMagnet, tickSkillCooldowns } from './combat/skills';
import { getCollisionRadius, getRangeMul, getUnlockedWeapons, tickWeapons } from './combat/weapons';
import { dist, formatPower } from './base/math';

let instance;

export default class DataBus {
  scene = 'menu';
  mode = 'normal';
  frame = 0;
  enemySeq = 0;
  mobileUnlocked = false;
  wheelAngle = 0;
  wheelOrbs = [];

  player = new Player();
  enemies = [];
  terrain = [];
  camX = 0;
  camY = 0;
  skillCooldowns = {};
  fx = [];

  isOver = false;
  isWin = false;
  peakPower = 1;

  menuIndex = 0;
  menuDragX = 0;
  showExitConfirm = false;
  actionBarOpen = false;

  constructor() {
    if (instance) return instance;
    instance = this;
    CONFIG.skills.forEach((s) => { this.skillCooldowns[s.id] = 0; });
  }

  startMode(modeId) {
    const modeCfg = CONFIG.modes[modeId];
    this.scene = 'play';
    this.mode = modeId;
    this.frame = 0;
    this.enemySeq = 0;
    this.mobileUnlocked = false;
    this.wheelAngle = 0;
    this.wheelOrbs = [];
    this.isOver = false;
    this.isWin = false;
    this.showExitConfirm = false;
    this.actionBarOpen = false;
    this.fx = [];
    CONFIG.skills.forEach((s) => { this.skillCooldowns[s.id] = 0; });

    const startPower = modeId === 'extreme' ? getNormalMax() : modeCfg.startPower;
    this.peakPower = startPower;

    const { world } = CONFIG;
    const sx = world.width * world.spawnRatio;
    const sy = world.height * world.spawnRatio;
    this.player.init(sx, sy, startPower);
    this.enemies = buildWorld(modeCfg, startPower);
    this.terrain = buildTerrain(modeCfg, this.enemies);
    this.updateCamera();
  }

  tick() {
    if (this.scene !== 'play' || this.isOver) return;
    this.frame += 1;

    this.player.rangeMul = getRangeMul(this.player);
    tickSkillCooldowns(this.skillCooldowns);
    this.player.update();

    const modeCfg = CONFIG.modes[this.mode];
    if (this.player.power >= CONFIG.moveThreshold && !this.mobileUnlocked) {
      this.mobileUnlocked = true;
      this.enemies.forEach((e) => {
        if (e.alive && !e.mobile && (e.power + this.frame) % 3 === 0) e.mobile = true;
      });
    }

    tickMagnet(this);
    updateEnemies(this.enemies, this.player, this.frame, this);
    tickWeapons(this, this.frame);
    tickSpawner(this, modeCfg);
    this.updateCamera();
    this.checkCollisions();
    this.peakPower = Math.max(this.peakPower, this.player.power);

    this.fx = this.fx.filter((f) => {
      f.life -= 1;
      return f.life > 0;
    });

    if (this.mode !== 'extreme' && this.player.power >= CONFIG.winPower) {
      this.win();
    }
  }

  updateCamera() {
    const sw = GameGlobal.screenW;
    const sh = GameGlobal.screenH;
    const hud = sh * CONFIG.hudHeight;
    const actionH = this.actionBarOpen ? sh * CONFIG.actionBarHeight : 0;
    const viewH = sh - hud - actionH;
    this.camX = this.player.x - sw / 2;
    this.camY = this.player.y - viewH / 2;
    const { world } = CONFIG;
    this.camX = Math.max(0, Math.min(world.width - sw, this.camX));
    this.camY = Math.max(0, Math.min(world.height - viewH, this.camY));
  }

  checkCollisions() {
    const pr = getCollisionRadius(this.player);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const er = this.enemyRadius(e);
      if (dist(this.player, e) > pr + er - 4) continue;
      if (this.player.power >= e.power) {
        e.alive = false;
        this.player.absorb(e.power);
        GameGlobal.particles.burst(e.x, e.y, '#BA68C8');
        GameGlobal.particles.floatText(e.x, e.y - 20, `+${formatPower(e.power)}`);
        GameGlobal.audio?.playAbsorb();
        try { wx.vibrateShort({ type: 'light' }); } catch (err) { /* ignore */ }
      } else {
        this.fail();
        return;
      }
    }
  }

  enemyRadius(e) {
    const logP = Math.log10(Math.max(1, e.power));
    return CONFIG.player.minRadius + logP * CONFIG.player.radiusScale;
  }

  win() {
    this.isWin = true;
    this.isOver = true;
    recordRun(this.mode, this.peakPower, true);
    GameGlobal.audio?.playWin();
  }

  fail() {
    this.isWin = false;
    this.isOver = true;
    recordRun(this.mode, this.peakPower, false);
    GameGlobal.audio?.playDie();
    try { wx.vibrateShort({ type: 'heavy' }); } catch (e) { /* ignore */ }
  }

  aliveCount() {
    return this.enemies.filter((e) => e.alive).length;
  }

  unlockedWeapons() {
    return getUnlockedWeapons(this.player);
  }
}
