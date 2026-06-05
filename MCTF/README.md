# MCTF — 鸡窝保卫战（横屏塔防）

微信小游戏：指挥防御鸡守护鸡窝，抵御怪兽入侵。

## 特性

- 横屏 (`game.json` → `landscape`)
- 6 种防御鸡 + 5 种怪兽（独立立绘）
- 升星系统（最高 3 星）
- 滚动背景 + 云层层叠
- 角色 idle 浮动 / 攻击 / 受击动画
- 粒子特效 + BGM/音效

## 调数值

`js/config/game.config.js`

## 资源

```
images/tower_*.png   防御鸡
images/enemy_*.png   怪兽
images/bg_*.png      背景
images/nest.png      鸡窝
audio/               音效
```

## 运行

微信开发者工具 → 导入 MCTF → 编译 → **模拟器切换横屏**
