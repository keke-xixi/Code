# 星河拾弹记 - 微信小游戏

竖版射击类微信小游戏，Canvas 绘制，无需外部图片资源。

## 项目结构

```
MCWXGame/
├── game.js                 # 入口
├── game.json
├── js/
│   ├── main.js             # 主循环
│   ├── databus.js          # 全局状态
│   ├── render.js           # Canvas 初始化
│   ├── config/
│   │   ├── constants.js    # 游戏常量
│   │   └── weapons.js      # 武器/技能配置
│   ├── base/
│   │   ├── entity.js       # 实体基类
│   │   └── pool.js         # 对象池
│   ├── player/
│   │   └── fighter.js      # 玩家战机
│   ├── bullet/
│   │   ├── bullet.js       # 子弹实体
│   │   └── weaponSystem.js # 武器与技能系统
│   ├── enemy/
│   │   ├── enemy.js        # 敌机
│   │   └── spawner.js      # 敌机生成器
│   └── runtime/
│       ├── background.js   # 星空背景
│       ├── hud.js          # UI（分数/血条/技能按钮）
│       ├── particles.js    # 爆炸粒子
│       └── music.js        # 音效
```

## 玩法

- **触摸拖动** 控制战机移动
- **自动射击** 三种武器随得分自动升级
- **底部技能按钮** 释放五种技能（冷却后可再次使用）

## 五种子弹（自动武器）

| 武器 | 说明 |
|------|------|
| 脉冲弹 | 单发直线弹，射速快 |
| 双联弹 | 平行双发 |
| 散射弹 | 三向扇形散射 |

每 500 分自动升级武器，最高散射弹。

## 五种技能（手动释放）

| 按钮 | 技能 | 效果 | 冷却 |
|------|------|------|------|
| 镭 | 雷霆镭射 | 穿透全屏的竖向激光 | 6秒 |
| 弹 | 导弹风暴 | 5枚追踪导弹 | 8秒 |
| 盾 | 能量护盾 | 3秒免疫伤害 | 10秒 |
| 炸 | 全屏轰炸 | 清除屏幕所有敌机 | 15秒 |
| 速 | 超速射击 | 5秒射击速度翻倍 | 12秒 |

## 敌机类型

- **侦察机** - 低血量，快速
- **战斗机** - 中等血量
- **重装舰** - 高血量，带血条
- **精英机** - 超高血量，高分

## 开发

使用微信开发者工具打开本项目目录即可预览。

可选：在 `audio/` 目录放置 `bgm.mp3`、`bullet.mp3`、`boom.mp3` 启用音效。

## 游戏圈

已在**暂停界面**和**结算界面**（游戏结束 / 通关）提供「游戏圈」入口，对局进行中不显示，不影响操作。

### 配置 openlink

已在 `js/config/gameClub.config.js` 填入 MP 后台「游戏圈首页链接 → **游戏内打开**」的 openlink。

| 后台字段 | 用途 | 是否写入代码 |
|----------|------|--------------|
| 游戏内打开 | 游戏内跳转游戏圈首页 | ✅ `GAME_CLUB_OPENLINK` |
| 游戏内推荐 | 推荐至游戏圈 | 预留 `GAME_CLUB_RECOMMEND_OPENLINK` |
| 微信内/外打开 | H5 分享链接 | 不需要写入游戏代码 |

### 游戏玩法 ID（战绩上报）

MP 后台「游戏玩法」配置的 ID 须与 `js/config/gameClub.config.js` 中一致：

| 玩法名称 | 玩法 ID | 战绩类型 | 单位 |
|----------|---------|----------|------|
| 最高得分 | `bestScore` | 整数 | 分 |
| 最高关卡 | `maxLevel` | 整数 | 关 |
| 通关状态 | `gameCleared` | 整数 | （通关上报 1） |

游戏结束/通关时会自动调用 `wx.setUserCloudStorage` 上报（仅在新纪录时更新）。

### 技术说明

- 原生入口：`wx.createGameClubButton`（与 Canvas 按钮位置对齐，仅在暂停/结算时显示）
- 指定页面：`wx.createPageManager` + openlink（配置 openlink 后，Canvas 点击也可跳转）
- 文档：[游戏圈接入指南](https://developers.weixin.qq.com/minigame/dev/guide/open-ability/game-club.html)
