# UI 素材（游戏内引用）

项目内请优先使用下列**短文件名**（来自 `public/img/mouse` 与聊天提供的金币图）：

| 文件 | 用途 |
|------|------|
| `coin_clover.png` | 金币图标（HUD、商店、弹窗） |
| `coin_stack.png` | 兑换列表「卖出」按钮 |
| `gem_trade.png` | 背包「兑换」入口 |
| `loading_anim.gif` | 读档/新局加载动画（可选） |
| `logo.png` / `menu_bg.png` | 主菜单 |

代码入口：`UiIcons`、`UiJuice`、`loading_overlay.tscn`。

同目录下其它文件为素材库拷贝，**未被 `res://` 引用**，可后续手动清理以减小体积。
