# UI 素材（游戏内引用）

项目内请优先使用下列**短文件名**（来自 `public/img/mouse` 与聊天提供的金币图）：

| 文件 | 用途 |
|------|------|
| `coin_clover.png` | 金币图标（HUD、商店、弹窗） |
| `coin_stack.png` | 兑换列表「卖出」按钮 |
| `sz.png` | 右下角状态/设置齿轮 |
| `money_bag.png` | 左上角金币数 / 兑换入口（绿钱袋，已抠底） |
| `gem_trade.png` | （旧）背包兑换入口参考 |
| `loading_dots.gif` | 参考素材；进局加载用脚本八点环（无边框） |
| `logo.png` / `menu_bg.png` | 主菜单 |

代码入口：`UiIcons`、`UiJuice`、`loading_overlay.tscn`。

同目录下其它文件为素材库拷贝，**未被 `res://` 引用**，可后续手动清理以减小体积。
