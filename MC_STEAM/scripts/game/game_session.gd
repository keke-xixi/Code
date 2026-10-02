class_name GameSession
extends RefCounted

signal state_changed

var bounds: Dictionary = {}
var ores: Dictionary = {}
var player: Vector2i = Vector2i.ZERO
var money: int = 0
var max_depth: int = 0
var total_collected: int = 0
var owned_upgrades: Dictionary = {}
var combo_stacks: int = 0
var last_collect_time: float = -1.0
var last_absorb_time: float = -1.0

var _upgrades: UpgradeSystem = UpgradeSystem.new()


func new_run() -> void:
	bounds = GameData.WORLD_DEFAULT.duplicate(true)
	player = Vector2i(int(bounds.get("spawn_x", 12)), int(bounds.get("spawn_y", 8)))
	ores = WorldGen.fill_bounds(bounds, {})
	money = 0
	max_depth = player.y
	total_collected = 0
	owned_upgrades = {}
	combo_stacks = 0
	last_collect_time = -1.0
	last_absorb_time = -1.0
	state_changed.emit()
	emit_gear()


func load_from(dict: Dictionary) -> void:
	if dict.is_empty():
		new_run()
		return
	bounds = dict.get("bounds", GameData.WORLD_DEFAULT).duplicate(true)
	player = Vector2i(
		int(dict.get("player_x", bounds.get("spawn_x", 12))),
		int(dict.get("player_y", bounds.get("spawn_y", 8)))
	)
	ores = dict.get("ores", {})
	if ores.is_empty():
		ores = WorldGen.fill_bounds(bounds, {})
	money = int(dict.get("money", 0))
	max_depth = int(dict.get("max_depth", player.y))
	total_collected = int(dict.get("total_collected", 0))
	owned_upgrades = dict.get("owned_upgrades", {})
	combo_stacks = 0
	state_changed.emit()
	emit_gear()


func to_save_dict() -> Dictionary:
	return {
		"bounds": bounds,
		"player_x": player.x,
		"player_y": player.y,
		"ores": ores,
		"money": money,
		"max_depth": max_depth,
		"total_collected": total_collected,
		"owned_upgrades": owned_upgrades,
	}


func effects() -> Dictionary:
	return _upgrades.compute(owned_upgrades)


func plan_step(dir: Vector2i) -> Dictionary:
	if dir == Vector2i.ZERO:
		return {"ok": false}
	var target := player + dir
	if absi(target.x - player.x) + absi(target.y - player.y) != 1:
		return {"ok": false}
	extend_if_needed(target)
	var cell: Dictionary = get_cell(target.x, target.y)
	var out: Dictionary = {
		"ok": true,
		"target_x": target.x,
		"target_y": target.y,
		"action": "step",
		"mine_duration": 0.0,
		"ore_type": int(cell.get("type", 1)),
	}
	if bool(cell.get("taken", false)):
		out.action = "step"
	elif not bool(cell.get("broken", false)):
		out.action = "mine"
		out.ore_type = int(cell.get("type", 1))
		out.mine_duration = _calc_mine_duration(out.ore_type)
	else:
		out.action = "pickup"
	return out


func try_move(dir: Vector2i) -> Dictionary:
	return plan_step(dir)


func try_move_to(target: Vector2i) -> Dictionary:
	var delta := target - player
	if absi(delta.x) + absi(delta.y) != 1:
		return {"ok": false}
	return plan_step(delta)


func commit_step(target: Vector2i, action: String) -> void:
	player = target
	max_depth = maxi(max_depth, player.y)
	if action == "pickup":
		_collect_at(target, false)
		_after_move_pickup(target)
	_emit_stats()
	state_changed.emit()


func complete_mine_at(pos: Vector2i) -> void:
	var cell: Dictionary = get_cell(pos.x, pos.y)
	if bool(cell.get("taken", false)) or bool(cell.get("broken", false)):
		return
	cell["broken"] = true
	var instant: bool = UserSettings.instant_mine_on_break
	var fx: Dictionary = effects()
	if instant or bool(fx.get("auto_on_break", false)) or bool(fx.get("one_hit_mine", false)):
		_collect_at(pos, false)
	_bonus_break(pos)
	_after_move_pickup(pos)
	_emit_stats()
	state_changed.emit()


func _calc_mine_duration(ore_type: int) -> float:
	var pick_lv: int = int(owned_upgrades.get("pickaxe", 0))
	return GameData.ore_mine_sec(ore_type, pick_lv)


func absorb_residuals(now: float) -> Dictionary:
	var fx: Dictionary = effects()
	var absorb_radius: int = int(fx.get("absorb_radius", 0))
	var absorb_cooldown: float = float(fx.get("absorb_cooldown", 0.0))
	if absorb_radius <= 0:
		return {"ok": false, "msg": "请先在商店购买残矿吸纳"}
	if last_absorb_time > 0.0 and now - last_absorb_time < absorb_cooldown:
		var wait: float = absorb_cooldown - (now - last_absorb_time)
		return {"ok": false, "msg": "冷却 %.1f 秒" % wait}
	var total: int = 0
	var count: int = 0
	for key in ores.keys():
		var cell: Dictionary = ores[key]
		if bool(cell.get("taken", false)) or not bool(cell.get("broken", false)):
			continue
		var pos: Vector2i = WorldGen.parse_key(str(key))
		if absorb_radius < 999 and _manhattan(player, pos) > absorb_radius:
			continue
		var gain: int = _collect_at(pos, true)
		if gain > 0:
			count += 1
			total += gain
	last_absorb_time = now
	if count == 0:
		return {"ok": false, "msg": "范围内没有残矿"}
	_emit_stats()
	state_changed.emit()
	return {"ok": true, "msg": "吸收 %d 处 +%d 金币" % [count, total], "gain": total}


func buy_upgrade(cat_id: String) -> Dictionary:
	var result: Dictionary = _upgrades.purchase(cat_id, owned_upgrades, money)
	if not bool(result.get("ok", false)):
		return result
	money -= int(result.get("cost", 0))
	var new_level: int = int(owned_upgrades.get(cat_id, 0))
	GameEvents.money_changed.emit(money)
	state_changed.emit()
	emit_gear()
	return {"ok": true, "cost": int(result.get("cost", 0)), "level": new_level, "cat_id": cat_id}


func get_cell(x: int, y: int) -> Dictionary:
	var key := WorldGen.cell_key(x, y)
	if not ores.has(key):
		ores[key] = WorldGen.create_cell(WorldGen.generate_ore_type(y))
	return ores[key]


func extend_if_needed(pos: Vector2i) -> void:
	var extended := false
	if pos.x < int(bounds.get("left", 0)):
		bounds["left"] = int(bounds.get("left", 0)) - GameData.EXTEND_AMOUNT
		extended = true
	elif pos.x >= int(bounds.get("right", 0)):
		bounds["right"] = int(bounds.get("right", 0)) + GameData.EXTEND_AMOUNT
		extended = true
	if pos.y < int(bounds.get("top", 0)):
		bounds["top"] = int(bounds.get("top", 0)) - GameData.EXTEND_AMOUNT
		extended = true
	elif pos.y >= int(bounds.get("bottom", 0)):
		bounds["bottom"] = int(bounds.get("bottom", 0)) + GameData.EXTEND_AMOUNT
		extended = true
	if extended:
		ores = WorldGen.fill_bounds(bounds, ores)


func _process_cell(pos: Vector2i) -> void:
	var cell: Dictionary = get_cell(pos.x, pos.y)
	if bool(cell.get("taken", false)):
		return
	var instant: bool = UserSettings.instant_mine_on_break
	var fx: Dictionary = effects()
	if not bool(cell.get("broken", false)):
		cell["broken"] = true
		if instant or bool(fx.get("auto_on_break", false)) or bool(fx.get("one_hit_mine", false)):
			_collect_at(pos, false)
		_bonus_break(pos)
		return
	if not bool(cell.get("taken", false)):
		_collect_at(pos, false)


func _bonus_break(center: Vector2i) -> void:
	var r: int = int(effects().get("bonus_break_radius", 0))
	if r <= 0:
		return
	var fx: Dictionary = effects()
	for x in range(center.x - r, center.x + r + 1):
		for y in range(center.y - r, center.y + r + 1):
			if x == center.x and y == center.y:
				continue
			if _manhattan(center, Vector2i(x, y)) > r:
				continue
			var cell: Dictionary = get_cell(x, y)
			if bool(cell.get("broken", false)):
				continue
			cell["broken"] = true
			var instant: bool = UserSettings.instant_mine_on_break
			if instant or bool(fx.get("auto_on_break", false)) or bool(fx.get("one_hit_mine", false)):
				_collect_at(Vector2i(x, y), true)


func _after_move_pickup(pos: Vector2i) -> void:
	var r: int = int(effects().get("pickup_radius", 0))
	if r <= 0:
		return
	for x in range(pos.x - r, pos.x + r + 1):
		for y in range(pos.y - r, pos.y + r + 1):
			if _manhattan(pos, Vector2i(x, y)) > r:
				continue
			var cell: Dictionary = get_cell(x, y)
			if bool(cell.get("broken", false)) and not bool(cell.get("taken", false)):
				_collect_at(Vector2i(x, y), true)


func _collect_at(pos: Vector2i, silent_fx: bool) -> int:
	var cell: Dictionary = get_cell(pos.x, pos.y)
	if bool(cell.get("taken", false)):
		return 0
	if not bool(cell.get("broken", false)):
		return 0
	cell["taken"] = true
	var meta: Dictionary = GameData.ore_meta(int(cell.get("type", 1)))
	var fx: Dictionary = effects()
	var depth_bonus: float = 1.0 + float(fx.get("depth_gold_pct", 0.0)) * float(pos.y)
	var gain: int = int(round(float(meta.get("price", 0)) * float(fx.get("gold_multiplier", 1.0)) * depth_bonus))
	gain = _apply_combo(gain)
	money += gain
	total_collected += 1
	var ore_color: Color = meta.get("color", Color.GRAY)
	var ore_glow: Color = meta.get("glow", Color.WHITE)
	if not silent_fx:
		GameEvents.cell_mined.emit(pos, ore_color, ore_glow, gain)
	if not silent_fx:
		var world := Vector2(pos) * GameData.CELL_SIZE + Vector2(GameData.CELL_SIZE * 0.5, GameData.CELL_SIZE * 0.5)
		GameEvents.ore_collected.emit(str(meta.get("name", "")), gain, world)
	GameEvents.money_changed.emit(money)
	return gain


func _apply_combo(base_gain: int) -> int:
	var now: float = Time.get_ticks_msec() / 1000.0
	var window: float = float(GameData.COMBO.get("window_sec", 2.5))
	if last_collect_time > 0.0 and now - last_collect_time <= window:
		combo_stacks += 1
	else:
		combo_stacks = 1
	last_collect_time = now
	var bonus: float = minf(
		float(GameData.COMBO.get("max_bonus", 0.55)),
		float(combo_stacks - 1) * float(GameData.COMBO.get("bonus_per_stack", 0.08))
	)
	GameEvents.combo_changed.emit(combo_stacks, bonus)
	return int(round(float(base_gain) * (1.0 + bonus)))


func _manhattan(a: Vector2i, b: Vector2i) -> int:
	return absi(a.x - b.x) + absi(a.y - b.y)


func _emit_stats() -> void:
	GameEvents.depth_changed.emit(player.y, max_depth)
	GameEvents.layer_changed.emit(GameData.depth_layer_title(player.y), GameData.depth_layer_progress(player.y))
	GameEvents.run_stats.emit(total_collected)


func emit_gear() -> void:
	var lv: int = int(owned_upgrades.get("pickaxe", 0))
	var pick_name: String = UpgradeSystem.pickaxe_display_name(lv) if lv > 0 else "无镐"
	var dirt_sec: float = GameData.ore_mine_sec(1, lv)
	GameEvents.gear_changed.emit(pick_name, dirt_sec)
