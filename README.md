# Code
代码仓库

## 游戏

| 目录 | 说明 |
|------|------|
| MC | 挖矿小游戏 H5 / uni-app（含微信小游戏同步 `MC/minigame`） |
| MCTF | 鸡窝保卫战 — 横屏塔防微信小游戏 |
| WLSS | 噬魂荒原 — 横屏大世界吞噬微信小游戏 |
| MCZD | 找炸弹 — 竖屏叠层消除微信小游戏 |
| MCZC | 镜像双生 — 横屏找茬微信小游戏 |
| MCWXGame | 竖版射击微信小游戏（星河拾弹记） |
| MCBack | 挖矿小游戏后端（Node.js，暂不需要） |
| MCNovel | 小说网站（规划中） |

详见各子目录 README。

## 云笔记

WXApp 微信小程序 — 个人云笔记与文件存储

WXAppBack 云笔记后端（Node.js + Express + MySQL）

### 快速开始

```bash
# 后端
cd WXAppBack && cp .env.example .env && npm install && npm run dev

# 小程序
cd WXApp && npm install && npm run dev:mp-weixin
# 微信开发者工具导入 WXApp/dist/dev/mp-weixin
```

详见各子目录 README。
