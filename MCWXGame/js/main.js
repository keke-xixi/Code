import './render';
import Fighter from './player/fighter';
import EnemySpawner from './enemy/spawner';
import Background from './runtime/background';
import HUD from './runtime/hud';
import Music from './runtime/music';
import DataBus from './databus';
import { getCurrentLevelCfg } from './config/levels';
import ScoreBoard from './runtime/scoreBoard';
import GameClubButton, { openGameClub } from './runtime/gameClub';
import adManager from './runtime/ads';

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
    GameGlobal.databus.bg = this.bg;

    GameGlobal.gameClub = new GameClubButton();
    GameGlobal.gameClub.open = openGameClub;
    GameGlobal.adManager = adManager;
    adManager.init();

    this.hud.on('restart', () => {
      if (GameGlobal.databus.isGameOver || GameGlobal.databus.gameCleared) {
        adManager.showInterstitialThen(() => this.start());
      } else {
        this.start();
      }
    });
    GameGlobal.databus.topScores = ScoreBoard.load();
    this.start();
  }

  start() {
    GameGlobal.adManager?.resetDeathFlags?.();
    GameGlobal.databus.reset();
    GameGlobal.databus.hud.showRankPanel = false;
    this.player.init();
    this.spawner.reset();
    this.bg.setLevel(1);
    cancelAnimationFrame(this.aniId);
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  collisionDetection() {
    const { bullets, enemies } = GameGlobal.databus;

    for (let bi = 0; bi < bullets.length; bi++) {
      const bullet = bullets[bi];
      if (!bullet.isActive) continue;

      for (let ei = 0; ei < enemies.length; ei++) {
        const enemy = enemies[ei];
        if (!enemy.isActive) continue;
        if (bullet.hitEnemies?.has(enemy)) continue;

        const hit = bullet.radius
          ? bullet.isCircleCollideWith(enemy)
          : bullet.isCollideWith(enemy);

        if (hit) {
          if (bullet.onHitEnemy(enemy)) break;

          enemy.takeDamage(bullet.damage);

          if (bullet.pierce) {
            bullet.hitEnemies.add(enemy);
          } else {
            bullet.destroy();
            break;
          }
        }
      }
    }

    if (!this.player.isActive) return;

    // 拾取道具
    GameGlobal.databus.pickups.forEach((pickup) => {
      if (!pickup.isActive || !this.player.isCollideWith(pickup)) return;

      if (pickup.pickupKind === 'equip') {
        this.player.applyEquipment(pickup.equipType);
      } else {
        this.player.weaponSystem.setPickupWeapon(pickup.weaponType);
      }
      pickup.destroy();
    });

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.isActive && this.player.isCollideWith(enemy)) {
        const lvCfg = getCurrentLevelCfg();
        const dmg = enemy.isBoss
          ? (lvCfg.bossContactDamage || 35)
          : (lvCfg.contactDamage || 18);
        this.player.takeDamage(dmg);
        if (!enemy.isBoss) {
          enemy.takeDamage(999);
        }
        break;
      }
    }
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.bg.render(ctx);

    const enemies = GameGlobal.databus.enemies;
    for (let i = 0; i < enemies.length; i++) {
      enemies[i].render(ctx);
    }

    const pickups = GameGlobal.databus.pickups;
    for (let i = 0; i < pickups.length; i++) {
      pickups[i].render(ctx);
    }

    const bullets = GameGlobal.databus.bullets;
    for (let i = 0; i < bullets.length; i++) {
      bullets[i].render(ctx);
    }
    this.player.render(ctx);
    GameGlobal.databus.particles.forEach((p) => p.render(ctx));
    this.hud.render(ctx);
  }

  update() {
    GameGlobal.databus.frame++;

    if (GameGlobal.databus.isGameOver || GameGlobal.databus.gameCleared || GameGlobal.databus.isPaused) return;

    this.bg.update();
    this.player.update();
    this.spawner.update();

    const bullets = GameGlobal.databus.bullets;
    for (let i = 0; i < bullets.length; i++) {
      bullets[i].update();
    }

    const enemies = GameGlobal.databus.enemies;
    for (let i = 0; i < enemies.length; i++) {
      enemies[i].update();
    }

    const pickups = GameGlobal.databus.pickups;
    for (let i = 0; i < pickups.length; i++) {
      pickups[i].update();
    }

    GameGlobal.databus.particles = GameGlobal.databus.particles.filter((p) => p.update());

    this.collisionDetection();
    GameGlobal.databus.compactBullets();
  }

  loop() {
    this.update();
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
