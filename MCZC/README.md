# MCZC — 镜像双生（横屏找茬）

微信小游戏：左右镜像对照场景图，在右侧镜像图中找出全部差异点。

## 特性

- 横屏 (`game.json` → `landscape`)
- 7 个主题关卡（茶歇、露营、古巷、海边、樱花、雪村、秘境花园）
- 左图原貌 / 右图含差异（图标、色块、染色补丁）
- 生命制 + 连击 + 提示（每关 2 次，用时惩罚）
- 按用时评星（≤75s 三星，≤120s 二星）
- 关卡进度与星级本地存档
- 粒子反馈 + 多段 BGM/音效

## 调数值

| 文件 | 说明 |
|------|------|
| `js/config/game.config.js` | 生命、提示、评星时间、音效音量 |
| `js/config/levels.config.js` | 关卡场景图与差异点坐标/类型 |

差异点坐标为 **0～1 相对位置**，仅在右图渲染（见 `js/base/diff.js`）。

## 资源

```
images/menu_bg.png       菜单背景
images/scene_cafe.png    午后茶歇
images/scene_camp.png    星空露营
images/scene_alley.png   古巷记忆
images/scene_beach.png   海边晨曦
images/scene_sakura.png  樱花步道
images/scene_snow.png    雪村灯火
images/scene_garden.png  秘境花园
audio/find.wav           找对音效
audio/miss.wav           点错音效
audio/bgm_menu.wav       菜单 BGM
audio/bgm_warm.wav       暖色场景 BGM
audio/bgm_cool.wav       冷色场景 BGM
```

## 工具脚本

```bash
# 生成/更新 puzzle 风格音效（Python）
python scripts/gen_audio.py
```

## 运行

微信开发者工具 → **小游戏** → 导入 `MCZC` → 编译 → **模拟器切换横屏**
