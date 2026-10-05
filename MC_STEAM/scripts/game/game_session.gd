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
var ore_stock: Dictionary = {}
var combo_stacks: int = 0
var last_collect_time: float = -1.0
var last_absorb_time: float = -1.0

var _upgrades: UpgradeSystem = UpgradeSystem.new()
var _last_layer_title: String = ""
var _dirty_keys: Array[String] = []
var _full_map_dirty: bool = false
var _state_flush_pending: bool = false


func new_run() -> void:
	bounds = GameData.WORLD_DEFAULT.duplicate(true)
	player = Vector2i(int(bounds.get("spawn_x", 12)), int(bounds.get("spawn_y", 8)))
	ores = WorldGen.fill_bounds(bounds, {})
	money = 0
	max_depth = player.y
	total_collected = 0
	owned_upgrades = {}
	ore_stock = {}
	combo_stacks = 0
	last_collect_time = -1.0
	last_absorb_time = -1.0
	_last_layer_title = ""
	_request_state_flush(true)
	emit_gear()
	GameEvents.ore_stock_changed.emit()


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
	_load_ore_stock(dict.get("ore_stock", {}))
	combo_stacks = 0
	_last_layer_title = GameData.depth_layer_title(player.y)
	_request_state_flush(true)
	emit_gear()
	GameEvents.ore_stock_changed.emit()


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
		"ore_stock": ore_stock.duplicate(),
	}


func ore_count(type_id: int) -> int:
	return int(ore_stock.get(type_id, 0))


func _load_ore_stock(raw: Variant) -> void:
	ore_stock = {}
	if raw is Dictionary:
		for k in raw.keys():
			ore_stock[int(k)] = int(raw[k])


func _add_ore_stock(type_id: int, amount: int) -> void:
	if amount <= 0:
		return
	ore_stock[type_id] = ore_count(type_id) + amount
	GameEvents.ore_stock_changed.emit()


func _spend_ore_stock(type_id: int, amount: int) -> bool:
	var have: int = ore_count(type_id)
	if have < amount:
		return false
	var left: int = have - amount
	if left <= 0:
		ore_stock.erase(type_id)
	else:
		ore_stock[type_id] = left
	GameEvents.ore_stock_changed.emit()
	return true


func ore_unit_sell_price(type_id: int, depth_y: int = -1) -> int:
	var meta: Dictionary = GameData.ore_meta(type_id)
	var fx: Dictionary = effects()
	var y: int = depth_y if depth_y >= 0 else player.y
	var depth_bonus: float = 1.0 + float(fx.get("depth_gold_pct", 0.0)) * float(y)
	return maxi(1, int(round(float(meta.get("price", 0)) * float(fx.get("gold_multiplier", 1.0)) * depth_bonus)))


func sell_ore(type_id: int, count: int = 1) -> Dictionary:
	if count <= 0:
		return {"ok": false, "reason": "数量无效"}
	var have: int = ore_count(type_id)
	if have <= 0:
		return {"ok": false, "reason": "没有这种矿石"}
	var n: int = mini(count, have)
	var unit: int = ore_unit_sell_price(type_id)
	var bonus: float = _tick_combo_multiplier()
	var coins: int = int(round(float(unit * n) * bonus))
	if not _spend_ore_stock(type_id, n):
		return {"ok": false, "reason": "扣除失败"}
	money += coins
	GameEvents.money_changed.emit(money)
	_request_state_flush(true)
	var meta: Dictionary = GameData.ore_meta(type_id)
	return {
		"ok": true,
		"sold": n,
		"coins": coins,
		"name": str(meta.get("name", "")),
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
	var prev: Vector2i = player
	player = target
	max_depth = maxi(max_depth, player.y)
	if action == "pickup":
		_collect_at(target, false)
		_after_move_pickup(target)
	_emit_stats()
	_dirty_cell(target.x, target.y)
	_dirty_detector_ring(prev)
	_dirty_detector_ring(target)
	_request_state_flush()


func complete_mine_at(pos: Vector2i) -> void:
	var cell: Dictionary = get_cell(pos.x, pos.y)
	if bool(cell.get("taken", false)) or bool(cell.get("broken", false)):
		return
	cell["broken"] = true
	var instant: bool = UserSettings.instant_mine_on_break
	var fx: Dictionary = effects()
	if instant or bool(fx.get("auto_on_break", false)) or bool(fx.get("one_hit_mine", false)):
		_collect_at(pos, false)
	_dirty_cell(pos.x, pos.y)
	_bonus_break(pos)
	_after_move_pickup(pos)
	_emit_stats()
	_request_state_flush()


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
		return {"ok": false, "msg": "E %.1fs" % wait}
	var total: int = 0
	var count: int = 0
	var touched: Array[String] = []
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
			touched.append(str(key))
	last_absorb_time = now
	if count == 0:
		return {"ok": false, "msg": "范围内没有残矿"}
	for k in touched:
		_dirty_keys.append(k)
	_emit_stats()
	_request_state_flush(touched.size() > 24)
	return {"ok": true, "msg": "吸收 %d 处 +%d 矿石" % [count, total], "gain": total}


func buy_upgrade(cat_id: String, use_ore: bool = false) -> Dictionary:
	if use_ore:
		if cat_id != "pickaxe":
			return {"ok": false, "reason": "只能用金币购买"}
		var price_check: int = _upgrades.next_price(cat_id, owned_upgrades)
		if price_check < 0:
			return {"ok": false, "reason": "已满级"}
		var ore_type: int = UpgradeSystem.pickaxe_ore_for_next_level(owned_upgrades)
		if ore_count(ore_type) < 1:
			return {"ok": false, "reason": "矿石不足", "ore_type": ore_type}
		if not _spend_ore_stock(ore_type, 1):
			return {"ok": false, "reason": "矿石不足", "ore_type": ore_type}
		owned_upgrades[cat_id] = int(owned_upgrades.get(cat_id, 0)) + 1
		var ore_level: int = int(owned_upgrades.get(cat_id, 0))
		_request_state_flush(true)
		emit_gear()
		return {
			"ok": true,
			"cost": 0,
			"level": ore_level,
			"cat_id": cat_id,
			"paid_ore": ore_type,
		}
	var result: Dictionary = _upgrades.purchase(cat_id, owned_upgrades, money)
	if not bool(result.get("ok", false)):
		return result
	money -= int(result.get("cost", 0))
	var new_level: int = int(owned_upgrades.get(cat_id, 0))
	GameEvents.money_changed.emit(money)
	_request_state_flush(true)
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
		_request_state_flush(true)


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
			_dirty_cell(x, y)
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
	_dirty_cell(pos.x, pos.y)
	var type_id: int = int(cell.get("type", 1))
	var meta: Dictionary = GameData.ore_meta(type_id)
	_tick_combo_multiplier()
	var qty: int = 1
	_add_ore_stock(type_id, qty)
	total_collected += 1
	var ore_color: Color = meta.get("color", Color.GRAY)
	var ore_glow: Color = meta.get("glow", Color.WHITE)
	if not silent_fx:
		GameEvents.cell_mined.emit(pos, ore_color, ore_glow, qty)
	if not silent_fx:
		var world := Vector2(pos) * GameData.CELL_SIZE + Vector2(GameData.CELL_SIZE * 0.5, GameData.CELL_SIZE * 0.5)
		GameEvents.ore_collected.emit(str(meta.get("name", "")), qty, world)
	return qty


func _tick_combo_multiplier() -> float:
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
	return 1.0 + bonus


func _manhattan(a: Vector2i, b: Vector2i) -> int:
	return absi(a.x - b.x) + absi(a.y - b.y)


func _emit_stats() -> void:
	var layer_title: String = GameData.depth_layer_title(player.y)
	if not _last_layer_title.is_empty() and layer_title != _last_layer_title:
		GameEvents.toast.emit("▼ %s" % layer_title, "ok")
	_last_layer_title = layer_title
	GameEvents.depth_changed.emit(player.y, max_depth)
	GameEvents.layer_changed.emit(layer_title, GameData.depth_layer_progress(player.y))
	GameEvents.run_stats.emit(total_collected)


func emit_gear() -> void:
	var lv: int = int(owned_upgrades.get("pickaxe", 0))
	var pick_name: String = UpgradeSystem.pickaxe_display_name(lv) if lv > 0 else "无镐"
	var dirt_sec: float = GameData.ore_mine_sec(1, lv)
	GameEvents.gear_changed.emit(pick_name, dirt_sec, lv)
	_emit_tool_hints()


func _emit_tool_hints() -> void:
	var fx: Dictionary = effects()
	GameEvents.tool_hints.emit(
		int(fx.get("absorb_radius", 0)),
		float(fx.get("absorb_cooldown", 0.0)),
	)


func _dirty_cell(x: int, y: int) -> void:
	_dirty_keys.append(WorldGen.cell_key(x, y))


func _dirty_detector_ring(center: Vector2i) -> void:
	var det_r: int = int(effects().get("detector_radius", 0))
	if det_r <= 0:
		return
	for x in range(center.x - det_r, center.x + det_r + 1):
		for y in range(center.y - det_r, center.y + det_r + 1):
			if _manhattan(center, Vector2i(x, y)) <= det_r:
				_dirty_cell(x, y)


func _request_state_flush(full: bool = false) -> void:
	if full:
		_full_map_dirty = true
	if _state_flush_pending:
		return
	_state_flush_pending = true
	call_deferred("_flush_state_changed")


func _flush_state_changed() -> void:
	_state_flush_pending = false
	state_changed.emit()


func take_map_dirty() -> Dictionary:
	var uniq: Array[String] = []
	var seen: Dictionary = {}
	for k in _dirty_keys:
		if seen.has(k):
			continue
		seen[k] = true
		uniq.append(k)
	var pack: Dictionary = {
		"full": _full_map_dirty,
		"keys": uniq,
	}
	_full_map_dirty = false
	_dirty_keys.clear()
	return pack
