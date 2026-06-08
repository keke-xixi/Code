# WLSS — 噬魂荒原（横屏吞噬）

微信小游戏：在大世界荒原中移动吞噬弱魂，壮大自身灵力，解锁技能与武器。

## 特性

- 横屏 (`game.json` → `landscape`)
- 超大开放地图 + 程序化地形与刷怪
- 普通 / 极限两种模式（极限继承普通最高灵力）
- 4 种主动技能：加速、吸魂、震爆、炼狱
- 4 种被动武器：扩域、金轮、寒冰、烈焰
- 灵力数值成长 + 碰撞吞噬机制
- 粒子特效 + BGM/音效

## 调数值

`js/config/game.config.js` — 地图尺寸、刷怪、技能/武器解锁与冷却

## 资源

```
images/menu_bg.png       菜单背景
images/player_hero.png   玩家
images/enemy_ghost.png   普通魂体
images/boss_lord.png     Boss
images/tile_ground.png   地面
images/terrain_*.png     树木、岩石、骸骨等装饰
audio/bgm.mp3            背景音乐
audio/bullet.mp3         吸收音效
audio/boom.mp3           死亡音效
audio/upgrade.mp3        胜利音效
```

## 工具脚本

```bash
# 批量去除图片白底（Python + Pillow）
python scripts/remove_white_bg.py
```

## 运行

微信开发者工具 → **小游戏** → 导入 `WLSS` → 编译 → **模拟器切换横屏**
