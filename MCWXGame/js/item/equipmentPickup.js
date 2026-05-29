import Entity from '../base/entity';
import { EQUIP_CONFIG } from '../config/equipment';
import { SCREEN_HEIGHT } from '../config/constants';

/**
 * 装备道具 - 生命/攻击/移速
 */
export default class EquipmentPickup extends Entity {
  constructor() {
    super(0, 0, 26, 26);
    this.pickupKind = 'equip';
    this.equipType = '';
    this.vy = 1;
    this.bob = 0;
    this.cfg = null;
    this.rotation = 0;
  }

  init(type, x, y) {
    this.pickupKind = 'equip';
    this.equipType = type;
    this.cfg = EQUIP_CONFIG[type];
    this.width = 26;
    this.height = 26;
    this.x = x - this.width / 2;
    this.y = y;
    this.vy = 1;
    this.bob = Math.random() * Math.PI * 2;
    this.rotation = 0;
    this.isActive = true;
    this.visible = true;
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    this.bob += 0.05;
    this.rotation += 0.02;
    this.y += this.vy;
    this.x += Math.sin(this.bob) * 0.6;

    if (this.y > SCREEN_HEIGHT + this.height) {
      this.destroy();
    }
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const pulse = 1 + Math.sin(this.bob * 2.5) * 0.1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.shadowColor = this.cfg.dropColor;
    ctx.shadowBlur = 12;

    // 菱形装备图标
    ctx.fillStyle = `${this.cfg.dropColor}66`;
    ctx.strokeStyle = this.cfg.dropColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const s = 12 * pulse;
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.cfg.label, 0, 1);
    ctx.restore();
  }

  destroy() {
    this.isActive = false;
    this.visible = false;
    GameGlobal.databus.removePickup(this);
  }
}
