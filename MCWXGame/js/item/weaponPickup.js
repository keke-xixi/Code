import Entity from '../base/entity';
import { PICKUP_WEAPON_CONFIG } from '../config/pickupWeapons';
import { SCREEN_HEIGHT } from '../config/constants';

/**
 * 武器道具 - 击毁敌机后掉落，战机触碰拾取
 */
export default class WeaponPickup extends Entity {
  constructor() {
    super(0, 0, 28, 28);
    this.pickupKind = 'weapon';
    this.weaponType = '';
    this.vy = 1.2;
    this.bob = 0;
    this.cfg = null;
  }

  init(type, x, y) {
    this.pickupKind = 'weapon';
    this.weaponType = type;
    this.cfg = PICKUP_WEAPON_CONFIG[type];
    this.width = 28;
    this.height = 28;
    this.x = x - this.width / 2;
    this.y = y;
    this.vy = 1.2;
    this.bob = Math.random() * Math.PI * 2;
    this.isActive = true;
    this.visible = true;
    this.pickupKind = 'weapon';
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    this.bob += 0.06;
    this.y += this.vy;
    this.x += Math.sin(this.bob) * 0.8;

    if (this.y > SCREEN_HEIGHT + this.height) {
      this.destroy();
    }
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = 13;
    const pulse = 1 + Math.sin(this.bob * 2) * 0.08;

    ctx.save();
    ctx.shadowColor = this.cfg.dropColor;
    ctx.shadowBlur = 10;

    // 外圈
    ctx.strokeStyle = this.cfg.dropColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // 填充
    ctx.fillStyle = `${this.cfg.dropColor}55`;
    ctx.beginPath();
    ctx.arc(cx, cy, r * pulse - 2, 0, Math.PI * 2);
    ctx.fill();

    // 文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.cfg.label, cx, cy);
    ctx.restore();
  }

  destroy() {
    this.isActive = false;
    this.visible = false;
    GameGlobal.databus.removePickup(this);
  }
}
