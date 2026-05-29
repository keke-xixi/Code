import './render';
import Fighter from './player/fighter';
import EnemySpawner from './enemy/spawner';
import Background from './runtime/background';
import HUD from './runtime/hud';
import Music from './runtime/music';
import DataBus from './databus';

const ctx = canvas.getContext('2d');

GameGlobal.databus = new DataBus();
GameGlobal.musicManager = new Music();

/**
 * 雷霆战机 - 主循环
 */
export default class Main {
  aniId = 0;
  bg = new Background();
  player = new Fighter();
  spawner = new EnemySpawner();
  hud = new HUD();

  constructor() {
    GameGlobal.databus.player = this.player;
    GameGlobal.databus.spawner = this.spawner;
    GameGlobal.databus.hud = this.hud;

    this.hud.on('restart', this.start.bind(this));
    this.start();
  }

  start() {
    GameGlobal.databus.reset();
    this.player.init();
    this.spawner.reset();
    cancelAnimationFrame(this.aniId);
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  collisionDetection() {
    const { bullets, enemies } = GameGlobal.databus;

    bullets.forEach((bullet) => {
      if (!bullet.isActive) return;

      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (!enemy.isActive) continue;
        if (bullet.hitEnemies?.has(enemy)) continue;

        const hit = bullet.radius
          ? bullet.isCircleCollideWith(enemy)
          : bullet.isCollideWith(enemy);

        if (hit) {
          enemy.takeDamage(bullet.damage);

          if (bullet.pierce) {
            bullet.hitEnemies.add(enemy);
          } else {
            bullet.destroy();
            break;
          }
        }
      }
    });

    if (!this.player.isActive) return;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.isActive && this.player.isCollideWith(enemy)) {
        this.player.takeDamage(20);
        enemy.takeDamage(999);
        break;
      }
    }
  }

  /** 随机掉落武器升级 */
  checkPowerUp() {
    if (GameGlobal.databus.frame % 600 === 0 && GameGlobal.databus.score > 0) {
      this.player.weaponSystem.upgradeWeapon();
    }
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.bg.render(ctx);
    GameGlobal.databus.enemies.forEach((e) => e.render(ctx));
    GameGlobal.databus.bullets.forEach((b) => b.render(ctx));
    this.player.render(ctx);
    GameGlobal.databus.particles.forEach((p) => p.render(ctx));
    this.hud.render(ctx);
  }

  update() {
    GameGlobal.databus.frame++;

    if (GameGlobal.databus.isGameOver) return;

    this.bg.update();
    this.player.update();
    this.spawner.update();
    GameGlobal.databus.bullets.forEach((b) => b.update());
    GameGlobal.databus.enemies.forEach((e) => e.update());

    GameGlobal.databus.particles = GameGlobal.databus.particles.filter((p) => {
      return p.update();
    });

    this.collisionDetection();
    this.checkPowerUp();
  }

  loop() {
    this.update();
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
