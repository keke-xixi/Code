import CONFIG from '../config/game.config';
import { clamp } from '../base/math';

export default class Player {
  x = 0;
  y = 0;
  power = 1;
  kills = 0;
  targetX = 0;
  targetY = 0;
  moving = false;
  rushTimer = 0;
  rushMul = 1;
  magnetTimer = 0;
  rangeMul = 1;

  init(x, y, power) {
    this.x = x;
    this.y = y;
    this.power = power;
    this.kills = 0;
    this.targetX = x;
    this.targetY = y;
    this.moving = false;
    this.rushTimer = 0;
    this.rushMul = 1;
    this.magnetTimer = 0;
    this.rangeMul = 1;
  }

  getRadius() {
    const { minRadius, radiusScale } = CONFIG.player;
    const logP = Math.log10(Math.max(1, this.power));
    return (minRadius + logP * radiusScale) * this.rangeMul;
  }

  setMoveTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
    this.moving = true;
  }

  stopMove() {
    this.moving = false;
  }

  update() {
    if (this.rushTimer > 0) this.rushTimer -= 1;
    if (this.magnetTimer > 0) this.magnetTimer -= 1;
    if (!this.moving) return;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    let speed = CONFIG.player.baseSpeed + Math.min(3.2, Math.log10(Math.max(10, this.power)) * 0.85);
    if (this.rushTimer > 0) speed *= this.rushMul;
    if (len < speed) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.moving = false;
      return;
    }
    this.x += (dx / len) * speed;
    this.y += (dy / len) * speed;
    const r = this.getRadius();
    this.x = clamp(this.x, r, CONFIG.world.width - r);
    this.y = clamp(this.y, r, CONFIG.world.height - r);
  }

  absorb(value) {
    this.power += value;
    this.kills += 1;
  }
}
