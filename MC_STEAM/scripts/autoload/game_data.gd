extends Node
## 数值与表数据（对齐 MC/src/config/game.js，便于 Steam 版平衡调参）

const CELL_SIZE: int = 64
const EXTEND_AMOUNT: int = 6

const WORLD_DEFAULT: Dictionary = {
	"left": 0,
	"right": 24,
	"top": 0,
	"bottom": 24,
	"spawn_x": 12,
	"spawn_y": 8,
}

const ZOOM: Dictionary = {"min": 0.45, "max": 2.2, "step": 0.1, "default": 1.0}

const COMBO: Dictionary = {
	"window_sec": 2.5,
	"bonus_per_stack": 0.08,
	"max_bonus": 0.55,
}

## instant_mine_on_break：踏入未挖格时直接凿开并拾取（无需回头再踩）
const GAMEPLAY: Dictionary = {
	"instant_mine_on_break": true,
}

const ORE_TYPES: Dictionary = {
	1: {"name": "泥土", "color": Color("#6b4423"), "glow": Color("#8b5a2b"), "price": 1, "rarity": "common", "mine_sec": 1.0, "shape": "chunk"},
	2: {"name": "石块", "color": Color("#5c5c5c"), "glow": Color("#8a8a8a"), "price": 5, "rarity": "common", "mine_sec": 1.3, "shape": "chunk"},
	3: {"name": "铁矿", "color": Color("#7a8b99"), "glow": Color("#b8c5d0"), "price": 10, "rarity": "uncommon", "mine_sec": 1.7, "shape": "metal"},
	4: {"name": "黄金", "color": Color("#e8b923"), "glow": Color("#ffe566"), "price": 30, "rarity": "rare", "mine_sec": 2.2, "shape": "metal"},
	5: {"name": "钻石", "color": Color("#7ee8ff"), "glow": Color("#c8f7ff"), "price": 100, "rarity": "epic", "mine_sec": 3.0, "shape": "crystal"},
	6: {"name": "红物质", "color": Color("#e0115f"), "glow": Color("#ff6b9d"), "price": 500, "rarity": "legendary", "mine_sec": 3.8, "shape": "crystal"},
	7: {"name": "虚空水晶", "color": Color("#9966cc"), "glow": Color("#d4a5ff"), "price": 1000, "rarity": "legendary", "mine_sec": 4.6, "shape": "crystal"},
	8: {"name": "黑洞碎片", "color": Color("#1a1a2e"), "glow": Color("#4a4a8a"), "price": 10000, "rarity": "legendary", "mine_sec": 5.5, "shape": "void"},
}


## pickaxe_level: 0=无镐(更慢) 1=泥稿(泥土约1s) 每升1级速度×2
func ore_mine_sec(type_id: int, pickaxe_level: int = 0) -> float:
	var meta: Dictionary = ore_meta(type_id)
	var base: float = float(meta.get("mine_sec", 1.0))
	var speed: float = 0.65 if pickaxe_level <= 0 else pow(2.0, float(pickaxe_level - 1))
	return maxf(0.12, base / speed)

const DEPTH_RANGES: Array[Dictionary] = [
	{"min": 9000, "max": 10000, "title": "宇宙核心", "leave": 9, "rate": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.4, 0.3, 0.3]},
	{"min": 7000, "max": 9000, "title": "虚空裂隙", "leave": 8, "rate": [0.0, 0.0, 0.3, 0.2, 0.2, 0.1, 0.1, 0.1]},
	{"min": 5000, "max": 7000, "title": "熔岩海", "leave": 7, "rate": [0.0, 0.2, 0.2, 0.2, 0.2, 0.1, 0.1]},
	{"min": 2000, "max": 5000, "title": "水晶洞窟", "leave": 6, "rate": [0.2, 0.2, 0.2, 0.2, 0.2]},
	{"min": 500, "max": 2000, "title": "富矿带", "leave": 5, "rate": [0.3, 0.3, 0.2, 0.1, 0.1]},
	{"min": 50, "max": 500, "title": "地下矿井", "leave": 4, "rate": [0.4, 0.3, 0.2, 0.1]},
	{"min": 10, "max": 50, "title": "碎石层", "leave": 3, "rate": [0.6, 0.3, 0.1]},
	{"min": 1, "max": 10, "title": "表层土壤", "leave": 2, "rate": [0.9, 0.1]},
]

const DEPTH_MILESTONES: Array[int] = [10, 50, 100, 500, 1000, 2000, 5000, 7000, 9000]

const RARITY_ORDER: Dictionary = {"common": 0, "uncommon": 1, "rare": 2, "epic": 3, "legendary": 4}


func ore_meta(type_id: int) -> Dictionary:
	return ORE_TYPES.get(type_id, ORE_TYPES[1])


func depth_layer_title(y: int) -> String:
	for row in DEPTH_RANGES:
		if y >= int(row.get("min", 0)) and y <= int(row.get("max", 0)):
			return str(row.get("title", "未知"))
	return "地表"


func next_depth_milestone(y: int) -> int:
	for m in DEPTH_MILESTONES:
		if y < m:
			return m
	return DEPTH_MILESTONES[DEPTH_MILESTONES.size() - 1]


func depth_layer_progress(y: int) -> float:
	for row in DEPTH_RANGES:
		if y >= int(row.get("min", 0)) and y <= int(row.get("max", 0)):
			var span: float = float(int(row.get("max", 0)) - int(row.get("min", 0)) + 1)
			return clampf(float(y - int(row.get("min", 0))) / span, 0.0, 1.0)
	return 0.0
