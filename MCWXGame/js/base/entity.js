import Emitter from '../libs/tinyemitter';

/**
 * 游戏实体基类 - 使用 Canvas 绑制，无需图片资源
 */
export default class Entity extends Emitter {
  visible = true;
  isActive = true;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  render(ctx) {
    if (!this.visible) return;
    this.draw(ctx);
  }

  draw(ctx) {}

  isCollideWith(other) {
    if (!this.visible || !other.visible) return false;
    if (!this.isActive || !other.isActive) return false;

    const cx = other.x + other.width / 2;
    const cy = other.y + other.height / 2;

    return (
      cx >= this.x &&
      cx <= this.x + this.width &&
      cy >= this.y &&
      cy <= this.y + this.height
    );
  }

  /** 圆形碰撞检测（用于子弹） */
  isCircleCollideWith(other) {
    if (!this.visible || !other.visible) return false;
    if (!this.isActive || !other.isActive) return false;

    const cx1 = this.x + this.width / 2;
    const cy1 = this.y + this.height / 2;
    const cx2 = other.x + other.width / 2;
    const cy2 = other.y + other.height / 2;
    const r1 = this.radius || this.width / 2;
    const r2 = other.radius || other.width / 2;

    const dx = cx1 - cx2;
    const dy = cy1 - cy2;
    return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
  }
}
