# 微信小游戏迁移说明

## 是否需要重构？

**需要，属于大改，不是改 AppID 或开发者工具里切换「小游戏」就行。**

| 对比 | 当前（uni-app 小程序） | 微信小游戏 |
|------|------------------------|------------|
| 入口 | `app.json` + `pages/` | `game.json` + `game.js` |
| UI | Vue 组件、WXML | Canvas / 游戏引擎为主 |
| 构建 | `npm run dev:mp-weixin` → `dist/dev/mp-weixin` | 导入 `minigame/` 目录 |
| 开发者工具 | **小程序模式** | **小游戏模式** |

`dist/dev/mp-weixin` **不能**在微信开发者工具「小游戏」里直接导入运行（会报找不到 `game.json`）。

## 本分支（dev-wexin-game）做什么

1. **`minigame/`**：原生微信小游戏工程骨架，AppID `wxdb70767113810f88`
2. **`src/`**：保留现有 uni-app 小程序代码，供逻辑对照与逐步迁移
3. 后续把挖矿、存档、商店等从 `src/composables`、`src/services` 迁到 `minigame/js/`

## 怎么运行小游戏工程

```bash
# 无需 uni 编译，直接导入目录：
# 微信开发者工具 → 小游戏 → 导入 → 选择本仓库 minigame 文件夹
```

AppID：`wxdb70767113810f88`

## 推荐迁移路线

1. 用 Canvas 复刻格子地图 + 矿工移动（或接入 Cocos/Laya 导出）
2. 移植 `src/services/game/save.js` 等纯 JS 逻辑（改为 `wx.setStorageSync`）
3. 商店 / 抽卡 UI 用 Canvas 或小游戏 UI 插件重做
4. 流量主、广告组件走小游戏广告 API（与小程序不同）

## 小程序分支

继续维护 **`dev-weixin`**（AppID `wx9430aecf60877fad`），两套产品并行直到小游戏版可上线。
