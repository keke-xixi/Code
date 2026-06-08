# MCZD — 找炸弹（竖屏叠层消除）

微信小游戏：在多层叠放的水果牌中，找出并消除全部 **3 颗炸弹**，避免槽位被占满。

## 特性

- 竖屏 (`game.json` → `portrait`)
- 7 个关卡，牌块 18～420 张、最多 24 层叠放
- 10 种水果 emoji + 隐藏 💣 炸弹（每关固定 3 颗）
- 仅最上层未被遮挡的牌可点击
- 底部 7 格槽位：三消清槽，误点炸弹即失败
- 椭圆果盘布局 + 粒子反馈 + BGM/音效
- 关卡进度与星级本地存档

## 调数值

| 文件 | 说明 |
|------|------|
| `js/config/game.config.js` | 标题、槽位数、音效音量 |
| `js/config/levels.config.js` | 关卡牌数、层数、网格、块大小 |
| `js/config/fruits.config.js` | 水果种类与配色 |
| `js/config/theme.config.js` | 菜单/对局 UI 主题色 |

## 资源

```
images/start_btn.png   开始按钮
audio/find.wav         点中音效
audio/miss.wav         误点音效
audio/clear.wav        三消音效
audio/bgm_menu.wav     菜单 BGM
audio/bgm_warm.wav     对局 BGM
```

## 工具脚本

```bash
# 本地验证果盘布局、可点击牌数量
node scripts/verify-board.js
```

## 运行

微信开发者工具 → **小游戏** → 导入 `MCZD` → 编译
