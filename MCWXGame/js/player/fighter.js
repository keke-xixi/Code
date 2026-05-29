import Entity from '../base/entity';
import {
  PLAYER_MAX_HP,
  PLAYER_SIZE,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from '../config/constants';
import { EQUIP_CONFIG, EQUIP_TYPES, SHIP_SKINS } from '../config/equipment';
import WeaponSystem from '../bullet/weaponSystem';

export default class Fighter extends Entity {
  constructor() {
    super(0, 0, PLAYER_SIZE, PLAYER_SIZE);
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.touched = false;
    this.targetX = 0;
    this.targetY = 0;
    this.weaponSystem = new WeaponSystem(this);
    this.invincibleTimer = 0;
    this.armorLevel = 0;
    this.armorCharges = 0;
    this.attackLevel = 0;
    this.speedLevel = 0;
    this.initTouchEvents();
  }

  init() {
    this.x = SCREEN_WIDTH / 2 - this.width / 2;
    this.y = SCREEN_HEIGHT - this.height - 30;
    this.targetX = this.x;
    this.targetY = this.y;
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.touched = false;
    this.isActive = true;
    this.visible = true;
    this.invincibleTimer = 60;
    this.armorLevel = 0;
    this.armorCharges = 0;
    this.attackLevel = 0;
    this.speedLevel = 0;
    this.weaponSystem.reset();
  }

  getMoveFactor() {
    return Math.min(0.85, 0.28 + this.speedLevel * 0.15);
  }

  getSkin() {
    return SHIP_SKINS[Math.min(this.armorLevel, SHIP_SKINS.length - 1)];
  }

  applyEquipment(type) {
    switch (type) {
      case EQUIP_TYPES.HP:
        this.upgradeArmor();
        break;
      case EQUIP_TYPES.ATTACK:
        this.upgradeAttack();
        break;
      case EQUIP_TYPES.SPEED:
        this.upgradeSpeed();
        break;
      default:
        break;
    }
  }

  upgradeArmor() {
    const cfg = EQUIP_CONFIG[EQUIP_TYPES.HP];
    if (this.armorLevel >= cfg.maxLevel) {
      this.showMsg('生命已达上限');
      this.armorCharges += 1;
      return;
    }
    this.armorLevel++;
    this.maxHp += cfg.hpBonus;
    this.hp = Math.min(this.hp + cfg.hpBonus, this.maxHp);
    this.armorCharges += 1;
    this.width = PLAYER_SIZE + this.armorLevel * 2;
    this.height = PLAYER_SIZE + this.armorLevel * 2;
    this.showMsg(`生命强化 Lv.${this.armorLevel} +护甲`);
  }

  upgradeAttack() {
    const cfg = EQUIP_CONFIG[EQUIP_TYPES.ATTACK];
    if (this.attackLevel >= cfg.maxLevel) {
      this.showMsg('火力已达上限');
      return;
    }
    this.attackLevel++;
    this.showMsg(`火力强化 Lv.${this.attackLevel} +1弹道`);
  }

  upgradeSpeed() {
    const cfg = EQUIP_CONFIG[EQUIP_TYPES.SPEED];
    if (this.speedLevel >= cfg.maxLevel) {
      this.showMsg('移速已达上限');
      return;
    }
    this.speedLevel++;
    this.showMsg(`移速强化 Lv.${this.speedLevel}`);
  }

  showMsg(msg) {
    GameGlobal.databus.weaponSwitchMsg = msg;
    GameGlobal.databus.weaponSwitchTimer = 90;
  }

  initTouchEvents() {
    wx.onTouchStart((e) => {
      const { clientX: x, clientY: y } = e.touches[0];

      const touchResult = GameGlobal.databus.hud?.handleTouch(x, y);
      if (touchResult === 'restart') {
        GameGlobal.databus.hud.emit('restart');
        return;
      }
      if (touchResult === 'pause') {
        GameGlobal.databus.togglePause();
        return;
      }
      if (touchResult === 'resume') {
        GameGlobal.databus.isPaused = false;
        return;
      }
      if (touchResult === 'rank') {
        GameGlobal.databus.hud.showRankPanel = !GameGlobal.databus.hud.showRankPanel;
        return;
      }
      if (touchResult === 'paused' || touchResult === 'toggle') return;
      if (touchResult && typeof touchResult === 'string') {
        if (!GameGlobal.databus.isGameOver && !GameGlobal.databus.gameCleared && !GameGlobal.databus.isPaused) {
          this.weaponSystem.useSkill(touchResult);
        }
        return;
      }

      if (GameGlobal.databus.isGameOver || GameGlobal.databus.gameCleared || GameGlobal.databus.isPaused) return;

      this.touched = true;
      this.setTarget(x, y);
      this.x = this.targetX;
      this.y = this.targetY;
    });

    wx.onTouchMove((e) => {
      if (GameGlobal.databus.isGameOver || GameGlobal.databus.gameCleared || GameGlobal.databus.isPaused || !this.touched) return;
      const { clientX: x, clientY: y } = e.touches[0];
      this.setTarget(x, y);
    });

    wx.onTouchEnd(() => {
      this.touched = false;
    });

    wx.onTouchCancel(() => {
      this.touched = false;
    });
  }

  setTarget(x, y) {
    const rightPad = 58;
    const w = this.width;
    const h = this.height;
    this.targetX = Math.max(0, Math.min(x - w / 2, SCREEN_WIDTH - w - rightPad));
    this.targetY = Math.max(60, Math.min(y - h / 2, SCREEN_HEIGHT - h - 20));
  }

  takeDamage(dmg) {
    if (this.invincibleTimer > 0 || this.weaponSystem.isShielded()) return;

    if (this.armorCharges > 0) {
      this.armorCharges--;
      this.invincibleTimer = 45;
      GameGlobal.databus.addExplosion(
        this.x + this.width / 2,
        this.y + this.height / 2,
        '#2ed573',
        20
      );
      wx.vibrateShort({ type: 'light' });
      return;
    }

    this.hp -= dmg;
    this.invincibleTimer = 30;

    if (this.hp <= 0) {
      this.destroy();
    } else {
      wx.vibrateShort({ type: 'light' });
    }
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    const factor = this.getMoveFactor();
    this.x += (this.targetX - this.x) * factor;
    this.y += (this.targetY - this.y) * factor;

    if (this.invincibleTimer > 0) this.invincibleTimer--;
    this.weaponSystem.update();
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const skin = this.getSkin();
    const s = this.width / 2;

    if (skin.glow) {
      ctx.save();
      ctx.fillStyle = skin.glow;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.weaponSystem.isShielded()) {
      ctx.save();
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 + Math.sin(GameGlobal.databus.frame * 0.2) * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.armorCharges > 0) {
      ctx.save();
      ctx.strokeStyle = '#2ed573';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.save();
    ctx.translate(cx, cy);

    // 侧翼（等级2+）
    if (skin.wing) {
      ctx.fillStyle = skin.wing;
      ctx.globalAlpha = 0.85;
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.moveTo(side * s * 0.3, s * 0.1);
        ctx.lineTo(side * s * 0.9, s * 0.35);
        ctx.lineTo(side * s * 0.5, s * 0.45);
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // 主机身
    ctx.fillStyle = skin.body;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s * 0.55, s * 0.25);
    ctx.lineTo(-s * 0.3, s * 0.55);
    ctx.lineTo(s * 0.3, s * 0.55);
    ctx.lineTo(s * 0.55, s * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.arc(0, -s * 0.15, s * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // 等级4+ 双引擎
    const flameH = 7 + Math.sin(GameGlobal.databus.frame * 0.5) * 3;
    ctx.fillStyle = this.armorLevel >= 4 ? '#ff7675' : '#fdcb6e';
    const engines = this.armorLevel >= 3 ? [-s * 0.22, s * 0.22] : [0];
    engines.forEach((ex) => {
      ctx.beginPath();
      ctx.moveTo(ex - s * 0.1, s * 0.5);
      ctx.lineTo(ex, s * 0.5 + flameH);
      ctx.lineTo(ex + s * 0.1, s * 0.5);
      ctx.fill();
    });

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  destroy() {
    if (!this.isActive) return;
    this.isActive = false;
    GameGlobal.databus.addExplosion(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.getSkin().body,
      30
    );
    GameGlobal.musicManager.playExplosion();
    GameGlobal.databus.gameOver();
    wx.vibrateShort({ type: 'heavy' });
  }
}
