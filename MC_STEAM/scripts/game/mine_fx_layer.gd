extends Node2D
## 仅绘制挖矿裂纹 / 碎屑 / 闪光（每帧轻量，不重画全图）

var _world: Node2D
var _pulses: Dictionary = {}
var _debris: Array[Dictionary] = []
var _mining_pos: Vector2i = Vector2i(-99999, -99999)
var _mining_prog: float = 0.0
var _mining_col: Color = Color.WHITE

const MAX_DEBRIS: int = 64


func setup(world: Node2D) -> void:
	_world = world
	z_index = 2
	if not GameEvents.mining_progress.is_connected(_on_mining_progress):
		GameEvents.mining_progress.connect(_on_mining_progress)
	if not GameEvents.mining_finished.is_connected(_on_mining_finished):
		GameEvents.mining_finished.connect(_on_mining_finished)
	if not GameEvents.mining_pick_hit.is_connected(_on_mining_pick_hit):
		GameEvents.mining_pick_hit.connect(_on_mining_pick_hit)
	if not GameEvents.cell_mined.is_connected(_on_cell_mined):
		GameEvents.cell_mined.connect(_on_cell_mined)
	set_process(true)


func _on_mining_progress(grid_pos: Vector2i, progress: float, ore_color: Color) -> void:
	_mining_pos = grid_pos
	_mining_prog = progress
	_mining_col = ore_color


func _on_mining_finished() -> void:
	_mining_prog = 0.0


func _on_mining_pick_hit(grid_pos: Vector2i, strength: float) -> void:
	var cs: int = GameData.CELL_SIZE
	var center := Vector2(grid_pos) * cs + Vector2(cs * 0.5, cs * 0.5)
	var h: int = _hash_pos(grid_pos)
	var key := WorldGen.cell_key(grid_pos.x, grid_pos.y)
	_pulses[key] = {"t": 0.16, "max_t": 0.16, "color": Color(1, 0.92, 0.7)}
	var chip_n: int = 2 + int(strength * 3.0)
	for i in range(chip_n):
		_push_debris(
			center + Vector2(cos(float((h + i * 29) % 360) * TAU / 360.0), sin(float((h + i * 29) % 360) * TAU / 360.0)) * 4.0,
			Vector2(cos(float((h + i * 29) % 360) * TAU / 360.0), sin(float((h + i * 29) % 360) * TAU / 360.0)) * (55.0 + strength * 85.0),
			0.24 + float(i % 2) * 0.08,
			Color("#4a4038") if i % 2 == 0 else Color("#6b5c52"),
			2.5 + strength * 3.0,
			float((h + i * 11) % 360),
		)


func _on_cell_mined(grid_pos: Vector2i, ore_color: Color, ore_glow: Color, _gain: int) -> void:
	var key := WorldGen.cell_key(grid_pos.x, grid_pos.y)
	_pulses[key] = {"t": 0.5, "max_t": 0.5, "color": ore_glow}
	var cs: int = GameData.CELL_SIZE
	var center := Vector2(grid_pos) * cs + Vector2(cs * 0.5, cs * 0.5)
	var h: int = _hash_pos(grid_pos)
	var dirt_like: bool = ore_color.g < 0.35 and ore_color.r > ore_color.g * 1.4
	var rock_bits: int = 2 if dirt_like else 6
	for i in range(14):
		var ang: float = float(i) / 14.0 * TAU + float(h % 100) * 0.03
		var spd: float = 110.0 + float((h + i * 17) % 130)
		var is_rock: bool = i < rock_bits
		_push_debris(
			center + Vector2(randf_range(-6.0, 6.0), randf_range(-6.0, 6.0)),
			Vector2(cos(ang), sin(ang)) * spd + Vector2(0, -35.0),
			0.38 + float(i % 3) * 0.05,
			(Color("#5c5048") if i % 2 == 0 else Color("#3d3530")) if is_rock else (ore_color if i % 2 == 0 else ore_glow),
			3.5 + float((h + i) % 5),
			float((h + i * 19) % 360),
		)
	for j in range(4):
		var ang2: float = float(j) / 4.0 * TAU + 0.5
		_push_debris(
			center,
			Vector2(cos(ang2), sin(ang2)) * 75.0 + Vector2(0, -50.0),
			0.32,
			Color("#ffe566"),
			4.0,
			float(j * 90),
		)


func _push_debris(pos: Vector2, vel: Vector2, life: float, col: Color, size: float, spin: float) -> void:
	if _debris.size() >= MAX_DEBRIS:
		_debris.pop_front()
	_debris.append({"pos": pos, "vel": vel, "life": life, "color": col, "size": size, "spin": spin})


func _process(delta: float) -> void:
	var dirty := _mining_prog > 0.01 or not _debris.is_empty() or not _pulses.is_empty()
	for key in _pulses.keys():
		var pulse: Dictionary = _pulses[key]
		pulse["t"] = float(pulse.get("t", 0.0)) - delta
		if float(pulse["t"]) <= 0.0:
			_pulses.erase(key)
		else:
			_pulses[key] = pulse
	var next: Array[Dictionary] = []
	for piece in _debris:
		piece["life"] = float(piece.get("life", 0.0)) - delta
		if float(piece["life"]) <= 0.0:
			continue
		piece["pos"] = piece.get("pos", Vector2.ZERO) + piece.get("vel", Vector2.ZERO) * delta
		piece["vel"] = piece.get("vel", Vector2.ZERO) + Vector2(0.0, 420.0 * delta)
		piece["spin"] = float(piece.get("spin", 0.0)) + delta * 640.0
		next.append(piece)
	_debris = next
	if dirty:
		queue_redraw()


func _draw() -> void:
	var cs: int = GameData.CELL_SIZE
	for piece in _debris:
		var life: float = float(piece.get("life", 0.0))
		var col: Color = piece.get("color", Color.WHITE)
		col.a = clampf(life * 2.2, 0.0, 1.0)
		var sz: float = float(piece.get("size", 3.0))
		var pos: Vector2 = piece.get("pos", Vector2.ZERO)
		var ang: float = deg_to_rad(float(piece.get("spin", 0.0)))
		var half := Vector2(sz, sz * 0.65)
		var pts := PackedVector2Array([
			pos + Vector2(-half.x, -half.y).rotated(ang),
			pos + Vector2(half.x, -half.y * 0.3).rotated(ang),
			pos + Vector2(half.x * 0.6, half.y).rotated(ang),
			pos + Vector2(-half.x * 0.7, half.y * 0.8).rotated(ang),
		])
		draw_colored_polygon(pts, col)

	if _mining_prog > 0.01:
		var rect := Rect2(Vector2(_mining_pos) * cs, Vector2(cs, cs)).grow(-3)
		_draw_mining_cracks(rect, _mining_pos, _mining_prog, _mining_col)

	for key in _pulses.keys():
		var pulse: Dictionary = _pulses[key]
		var pos: Vector2i = WorldGen.parse_key(str(key))
		var inner := Rect2(Vector2(pos) * cs, Vector2(cs, cs)).grow(-3)
		var t: float = float(pulse.get("t", 0.0))
		var max_t: float = float(pulse.get("max_t", 0.28))
		var k: float = clampf(t / max_t, 0.0, 1.0)
		var flash: Color = pulse.get("color", Color.WHITE)
		draw_rect(inner.grow(2.0 * (1.0 - k)), Color(flash, 0.5 * k), true)


func _hash_pos(pos: Vector2i) -> int:
	return absi(pos.x * 73856093 ^ pos.y * 19349663)


func _draw_mining_cracks(inner: Rect2, pos: Vector2i, progress: float, col: Color) -> void:
	var h: int = _hash_pos(pos)
	var shake: Vector2 = Vector2.ZERO
	if progress > 0.08:
		var sh: float = (progress - 0.08) * 5.5
		shake = Vector2(
			sin(float(Time.get_ticks_msec()) * 0.04 + float(h)) * sh,
			cos(float(Time.get_ticks_msec()) * 0.035 + float(h * 2)) * sh,
		)
	var inner_s: Rect2 = inner
	inner_s.position += shake
	var c: Vector2 = inner_s.get_center()
	var reach: float = inner_s.size.x * 0.48 * progress
	var crack_n: int = 6 + int(progress * 10.0)
	for i in range(crack_n):
		var a: float = float(i) * TAU / float(crack_n) + float(h % 90) * 0.017 + progress * 0.3
		var r1: float = reach * lerpf(0.35, 1.0, float((h + i * 13) % 100) / 100.0)
		var mid: Vector2 = c + Vector2(cos(a), sin(a)) * r1 * 0.55
		mid += Vector2(cos(a + 0.7), sin(a + 0.7)) * inner_s.size.x * 0.08
		var end: Vector2 = c + Vector2(cos(a + 0.15), sin(a + 0.15)) * r1
		var w: float = lerpf(1.2, 3.6, progress)
		draw_line(c, mid, Color(1, 1, 1, 0.28 + progress * 0.45), w)
		draw_line(mid, end, Color(0.9, 0.85, 0.75, 0.22 + progress * 0.5), w * 0.9)
		if progress > 0.35:
			var fork: Vector2 = mid + Vector2(cos(a + 0.9), sin(a + 0.9)) * inner_s.size.x * 0.12 * progress
			draw_line(mid, fork, Color(1, 0.95, 0.85, 0.35 * progress), w * 0.65)
	for i in range(int(progress * 8.0)):
		var ca: float = float((h + i * 47) % 360) * TAU / 360.0
		var cr: float = inner_s.size.x * (0.12 + float(i % 3) * 0.06)
		var chip: Vector2 = c + Vector2(cos(ca), sin(ca)) * cr
		var sz: float = 3.0 + float(i % 2)
		draw_rect(Rect2(chip - Vector2(sz, sz) * 0.5, Vector2(sz, sz)), Color("#3d3530", 0.5 + progress * 0.4), true)
	draw_rect(inner_s.grow(-2), Color(col, 0.08 + progress * 0.18), false, lerpf(1.0, 3.0, progress))
	draw_rect(inner, Color(0, 0, 0, 0.12 * progress), true)
	if progress > 0.45:
		var flash: float = (progress - 0.45) / 0.55
		draw_rect(inner_s.grow(-3), Color(1, 0.95, 0.85, 0.1 * flash), true)
		draw_rect(inner_s.grow(-1), Color(col, 0.15 * flash), false, 2.0 + flash * 2.0)
	if progress > 0.72:
		var shatter: float = (progress - 0.72) / 0.28
		for i in range(9):
			var sa: float = float(i) * TAU / 6.0 + shatter
			var p0: Vector2 = c + Vector2(cos(sa), sin(sa)) * inner_s.size.x * 0.15
			var p1: Vector2 = c + Vector2(cos(sa + 0.4), sin(sa + 0.4)) * inner_s.size.x * (0.2 + shatter * 0.25)
			var p2: Vector2 = c + Vector2(cos(sa - 0.25), sin(sa - 0.25)) * inner_s.size.x * 0.12
			draw_colored_polygon(PackedVector2Array([p0, p1, p2]), Color(0.15, 0.13, 0.11, 0.35 * shatter))
