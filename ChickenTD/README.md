# 鸡窝保卫战 (ChickenTD)

微信小游戏塔防：指挥各种防御鸡守护鸡窝，抵御老鹰、毒蛇、黄鼠狼、狐狸、黄梅老妖等入侵。

## 目录结构

```
ChickenTD/
├── game.js                      # 入口
├── game.json
├── js/
│   ├── main.js                  # 主循环、波次、渲染
│   ├── databus.js               # 全局状态
│   ├── render.js                # Canvas
│   ├── config/
│   │   └── game.config.js       # ★ 所有数值、塔、怪、波次（带注释）
│   ├── map/layout.js            # 路径、槽位、坐标换算
│   ├── base/pool.js             # 对象池
│   ├── tower/index.js           # 防御鸡逻辑 + 子弹
│   ├── enemy/index.js           # 怪兽逻辑
│   ├── runtime/gameinfo.js      # HUD、建造栏、升星 UI
│   └── libs/tinyemitter.js
```

## 玩法

1. **点击空槽位** → 底部选择防御鸡建造（消耗金币）
2. **点击已建造的鸡** → 底部升星（最高 3 星，消耗金币）
3. **击杀怪兽** → 获得金币
4. **漏怪进鸡窝** → 扣除生命值，归零则失败
5. **守过全部波次** → 胜利

## 防御鸡

| ID | 名称 | 特点 |
|----|------|------|
| chick | 小黄鸡 | 便宜、均衡 |
| rooster | 大公鸡 | 范围减速 |
| kungfu | 功夫鸡 | 高攻速，3星暴击 |
| kun | 坤行者 | 范围内敌人易伤 |
| fighter | 歼鸡号 | 远程高伤 |
| satellite | 天眼鸡 | 周期性全图减速 |

## 调数值

只改 `js/config/game.config.js`：

- `game`：生命、初始金币
- `towers`：建造费、升星费、各星级属性
- `enemies`：血量、速度、赏金
- `waves`：波次组合

## 运行

微信开发者工具 → 导入 `ChickenTD` 目录 → 编译类型选「小游戏」。
