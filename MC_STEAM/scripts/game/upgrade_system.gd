class_name UpgradeSystem
extends RefCounted

## 精简版 MC 商店：每类最多 5 级，数值面向 PC 节奏

const CATALOG: Array[Dictionary] = [
	{
		"id": "pickaxe",
		"name": "泥稿",
		"desc": "每级挖掘×2",
		"prices": [400, 2000, 9000, 35000, 120000],
	},
	{
		"id": "auto_bag",
		"name": "自动矿袋",
		"desc": "凿开入账",
		"prices": [800, 3500, 12000, 45000, 150000],
		"auto_on_break": true,
	},
	{
		"id": "pickup",
		"name": "磁力拾取",
		"desc": "移动捡暴露矿",
		"prices": [1200, 6000, 22000, 80000, 250000],
		"pickup_radius": [1, 2, 3, 4, 6],
	},
	{
		"id": "blast",
		"name": "共振破岩",
		"desc": "连带碎邻格",
		"prices": [2500, 10000, 40000, 120000, 350000],
		"bonus_break_radius": [1, 1, 2, 2, 3],
	},
	{
		"id": "detector",
		"name": "稀有探测",
		"desc": "高亮稀有矿",
		"prices": [1500, 8000, 30000, 90000, 200000],
		"detector_radius": [2, 3, 4, 5, 8],
		"show_rarity_from": ["rare", "rare", "uncommon", "uncommon", "common"],
	},
	{
		"id": "absorb",
		"name": "残矿吸纳",
		"desc": "E 吸残矿",
		"prices": [5000, 20000, 75000, 200000, 500000],
		"absorb_radius": [3, 5, 8, 12, 999],
		"absorb_cooldown": [8.0, 6.0, 4.0, 2.5, 1.0],
	},
	{
		"id": "fortune",
		"name": "深潜财富",
		"desc": "兑换金币加成",
		"prices": [3000, 15000, 60000, 180000, 400000],
		"gold_multiplier": [1.1, 1.2, 1.35, 1.5, 1.75],
		"depth_gold_pct": [0.0, 0.02, 0.04, 0.06, 0.1],
	},
]

const DEFAULT_EFFECTS: Dictionary = {
	"auto_on_break": false,
	"one_hit_mine": false,
	"pickup_radius": 0,
	"bonus_break_radius": 0,
	"detector_radius": 0,
	"show_rarity_from": "legendary",
	"absorb_radius": 0,
	"absorb_cooldown": 0.0,
	"gold_multiplier": 1.0,
	"depth_gold_pct": 0.0,
	"move_duration": 0.10,
	"mine_duration": 0.12,
}


static func rarity_meets(ore_rarity: String, min_rarity: String) -> bool:
	var order: Dictionary = GameData.RARITY_ORDER
	return int(order.get(ore_rarity, 0)) >= int(order.get(min_rarity, 0))


static func pickaxe_display_name(level: int) -> String:
	if level <= 0:
		return "无镐"
	var names: Array[String] = ["泥稿", "石稿", "铁稿", "金稿", "星稿"]
	return names[mini(level - 1, names.size() - 1)]


## 下一级镐子升级对应的矿石 type_id（1=泥土 … 5=钻石）
static func pickaxe_ore_for_next_level(owned: Dictionary) -> int:
	var next_lv: int = int(owned.get("pickaxe", 0)) + 1
	return clampi(next_lv, 1, 5)


static func catalog_entry(cat_id: String) -> Dictionary:
	for cat in CATALOG:
		if str(cat.get("id", "")) == cat_id:
			return cat
	return {}


static func display_name_for(cat_id: String, level: int) -> String:
	if cat_id == "pickaxe":
		return pickaxe_display_name(level)
	var cat: Dictionary = catalog_entry(cat_id)
	return str(cat.get("name", cat_id))


static func success_popup(cat_id: String, new_level: int, cost: int) -> Dictionary:
	var name: String = display_name_for(cat_id, new_level)
	return {
		"kind": "ok",
		"icon": icon_for(cat_id),
		"title": "升级成功",
		"badge": "%s  Lv.%d" % [name, new_level],
		"tagline": short_effect(cat_id, new_level),
		"cost_line": "-%s" % fmt_coins(cost),
		"cost": cost,
	}


static func fail_popup(reason: String, cat_id: String, owned: Dictionary, money: int, ore_type: int = 0) -> Dictionary:
	var level: int = int(owned.get(cat_id, 0))
	var name: String = display_name_for(cat_id, maxi(level, 1))
	var price: int = UpgradeSystem.new().next_price(cat_id, owned)
	var tagline: String = reason
	if reason == "金币不足" and price > 0:
		tagline = "还差 %s" % fmt_coins(price - money)
	elif reason == "已满级":
		tagline = "已经满级啦"
	elif reason == "矿石不足" and ore_type > 0:
		tagline = "需要 1×%s" % GameData.ore_meta(ore_type).get("name", "")
	return {
		"kind": "warn",
		"icon": "!",
		"title": "还不能买",
		"badge": name,
		"tagline": tagline,
		"cost_line": "" if price < 0 else "要 %s" % fmt_coins(price),
		"cost": price if price > 0 and ore_type <= 0 else 0,
		"paid_ore": ore_type if ore_type > 0 else 0,
	}


static func short_effect(cat_id: String, level: int) -> String:
	if level < 1:
		return ""
	match cat_id:
		"pickaxe":
			return "挖土约 %.1fs · 更快一镐" % GameData.ore_mine_sec(1, level)
		"auto_bag":
			return "凿开就进账"
		"pickup":
			var radii: Array = catalog_entry(cat_id).get("pickup_radius", [])
			return "自动捡周围 %d 格" % int(radii[mini(level - 1, radii.size() - 1)])
		"blast":
			var br: Array = catalog_entry(cat_id).get("bonus_break_radius", [])
			return "连带震碎 %d 格" % int(br[mini(level - 1, br.size() - 1)])
		"detector":
			var dr: Array = catalog_entry(cat_id).get("detector_radius", [])
			return "附近 %d 格看稀有矿" % int(dr[mini(level - 1, dr.size() - 1)])
		"absorb":
			var ar: Array = catalog_entry(cat_id).get("absorb_radius", [])
			return "E 吸 %d 格残矿" % int(ar[mini(level - 1, ar.size() - 1)])
		"fortune":
			var gm: Array = catalog_entry(cat_id).get("gold_multiplier", [])
			return "兑换金币 ×%.1f" % float(gm[mini(level - 1, gm.size() - 1)])
		_:
			return str(catalog_entry(cat_id).get("desc", ""))


static func _rarity_label(key: String) -> String:
	match key:
		"common":
			return "普通"
		"uncommon":
			return "罕见"
		"rare":
			return "稀有"
		"epic":
			return "史诗"
		"legendary":
			return "传说"
		_:
			return key


static func icon_for(cat_id: String) -> String:
	match cat_id:
		"pickaxe":
			return "⛏"
		"auto_bag":
			return "🎒"
		"pickup":
			return "🧲"
		"blast":
			return "💥"
		"detector":
			return "📡"
		"absorb":
			return "🌀"
		"fortune":
			return "💰"
		_:
			return "✦"


static func fmt_coins(n: int) -> String:
	var s := str(absi(n))
	var out := ""
	var count := 0
	for i in range(s.length() - 1, -1, -1):
		out = s[i] + out
		count += 1
		if count == 3 and i > 0:
			out = "," + out
			count = 0
	if n < 0:
		out = "-" + out
	return out


func compute(owned: Dictionary) -> Dictionary:
	var fx: Dictionary = DEFAULT_EFFECTS.duplicate(true)
	for cat in CATALOG:
		var cat_id: String = str(cat.get("id", ""))
		var level: int = int(owned.get(cat_id, 0))
		if level < 1:
			continue
		var prices: Array = cat.get("prices", [])
		var idx: int = mini(level - 1, prices.size() - 1)
		if cat.has("auto_on_break"):
			fx["auto_on_break"] = true
		if cat.has("pickup_radius"):
			var radii: Array = cat.get("pickup_radius", [])
			fx["pickup_radius"] = maxi(int(fx.get("pickup_radius", 0)), int(radii[idx]))
		if cat.has("bonus_break_radius"):
			var br: Array = cat.get("bonus_break_radius", [])
			fx["bonus_break_radius"] = maxi(int(fx.get("bonus_break_radius", 0)), int(br[idx]))
		if cat.has("detector_radius"):
			var dr: Array = cat.get("detector_radius", [])
			var sr: Array = cat.get("show_rarity_from", [])
			fx["detector_radius"] = maxi(int(fx.get("detector_radius", 0)), int(dr[idx]))
			fx["show_rarity_from"] = str(sr[idx])
		if cat.has("absorb_radius"):
			var ar: Array = cat.get("absorb_radius", [])
			var cds: Array = cat.get("absorb_cooldown", [])
			fx["absorb_radius"] = maxi(int(fx.get("absorb_radius", 0)), int(ar[idx]))
			var cd: float = float(cds[idx])
			var prev_cd: float = float(fx.get("absorb_cooldown", 0.0))
			fx["absorb_cooldown"] = cd if prev_cd <= 0.0 else minf(prev_cd, cd)
		if cat.has("gold_multiplier"):
			var gm: Array = cat.get("gold_multiplier", [])
			var dg: Array = cat.get("depth_gold_pct", [])
			fx["gold_multiplier"] = maxf(float(fx.get("gold_multiplier", 1.0)), float(gm[idx]))
			fx["depth_gold_pct"] = maxf(float(fx.get("depth_gold_pct", 0.0)), float(dg[idx]))
		var move_d: float = float(fx.get("move_duration", 0.14))
		fx["move_duration"] = maxf(0.06, move_d - 0.012 * float(idx))
	return fx


func next_price(cat_id: String, owned: Dictionary) -> int:
	for cat in CATALOG:
		if str(cat.get("id", "")) != cat_id:
			continue
		var prices: Array = cat.get("prices", [])
		var level: int = int(owned.get(cat_id, 0))
		if level >= prices.size():
			return -1
		return int(prices[level])
	return -1


func purchase(cat_id: String, owned: Dictionary, money: int) -> Dictionary:
	var price: int = next_price(cat_id, owned)
	if price < 0:
		return {"ok": false, "reason": "已满级"}
	if money < price:
		return {"ok": false, "reason": "金币不足"}
	owned[cat_id] = int(owned.get(cat_id, 0)) + 1
	return {"ok": true, "cost": price, "owned": owned}
