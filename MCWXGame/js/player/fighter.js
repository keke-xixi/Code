import Entity from '../base/entity';
import { PLAYER_MAX_HP, PLAYER_SIZE, SCREEN_HEIGHT, SCREEN_WIDTH } from '../config/constants';
import WeaponSystem from '../bullet/weaponSystem';

export default class Fighter extends Entity {
  constructor() {
    super(0, 0, PLAYER_SIZE, PLAYER_SIZE);
    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.touched = false;
    this.weaponSystem = new WeaponSystem(this);
    this.invincibleTimer = 0;
    this.initTouchEvents();
  }

  init() {
    this.x = SCREEN_WIDTH / 2 - this.width / 2;
    this.y = SCREEN_HEIGHT - this.height - 60;
    this.hp = PLAYER_MAX_HP;
    this.touched = false;
    this.isActive = true;
    this.visible = true;
    this.invincibleTimer = 60;
    this.weaponSystem.reset();
  }

  initTouchEvents() {
    wx.onTouchStart((e) => {
      if (GameGlobal.databus.isGameOver) return;
      const { clientX: x, clientY: y } = e.touches[0];

      const skillHit = GameGlobal.databus.hud?.hitSkillButton(x, y);
      if (skillHit) {
        this.weaponSystem.useSkill(skillHit);
        return;
      }

      this.touched = true;
      this.moveTo(x, y);
    });

    wx.onTouchMove((e) => {
      if (GameGlobal.databus.isGameOver || !this.touched) return;
      const { clientX: x, clientY: y } = e.touches[0];
      this.moveTo(x, y);
    });

    wx.onTouchEnd(() => {
      this.touched = false;
    });

    wx.onTouchCancel(() => {
      this.touched = false;
    });
  }

  moveTo(x, y) {
    this.x = Math.max(0, Math.min(x - this.width / 2, SCREEN_WIDTH - this.width));
    this.y = Math.max(0, Math.min(y - this.height / 2, SCREEN_HEIGHT - this.height - 80));
  }

  takeDamage(dmg) {
    if (this.invincibleTimer > 0 || this.weaponSystem.isShielded()) return;

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

    if (this.invincibleTimer > 0) this.invincibleTimer--;
    this.weaponSystem.update();
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    if (this.weaponSystem.isShielded()) {
      ctx.save();
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6 + Math.sin(GameGlobal.databus.frame * 0.2) * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, this.width * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#0984e3';
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(-this.width / 2, this.height / 3);
    ctx.lineTo(-this.width / 4, this.height / 2);
    ctx.lineTo(this.width / 4, this.height / 2);
    ctx.lineTo(this.width / 2, this.height / 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#74b9ff';
    ctx.beginPath();
    ctx.arc(0, -this.height / 8, this.width / 5, 0, Math.PI * 2);
    ctx.fill();

    const flameH = 6 + Math.sin(GameGlobal.databus.frame * 0.5) * 3;
    ctx.fillStyle = '#fdcb6e';
    ctx.beginPath();
    ctx.moveTo(-this.width / 6, this.height / 2);
    ctx.lineTo(0, this.height / 2 + flameH);
    ctx.lineTo(this.width / 6, this.height / 2);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  destroy() {
    if (!this.isActive) return;
    this.isActive = false;
    GameGlobal.databus.addExplosion(
      this.x + this.width / 2,
      this.y + this.height / 2,
      '#0984e3',
      30
    );
    GameGlobal.musicManager.playExplosion();
    GameGlobal.databus.gameOver();
    wx.vibrateShort({ type: 'heavy' });
  }
}
