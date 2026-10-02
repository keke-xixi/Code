extends Node2D

const FX_LAYER := preload("res://scripts/game/mine_fx_layer.gd")

var session: GameSession

const ROCK_TOP := Color("#2a2420")
const ROCK_BOTTOM := Color("#12100e")
const ROCK_EDGE := Color("#3d3530")
const PIT_COLOR := Color("#08090c")
const PIT_INNER := Color("#151820")

var _fx: Node2D
var _redraw_pending: bool = false


func setup(game_session: GameSession) -> void:
	session = game_session
	if session == null:
		return
	if not session.state_changed.is_connected(_schedule_redraw):
		session.state_changed.connect(_schedule_redraw)
	if not GameEvents.settings_changed.is_connected(_schedule_redraw):
		GameEvents.settings_changed.connect(_schedule_redraw)
	if _fx == null:
		_fx = FX_LAYER.new()
		_fx.name = "MineFx"
		add_child(_fx)
		_fx.setup(self)
	set_process(false)


func _schedule_redraw() -> void:
	if _redraw_pending:
		return
	_redraw_pending = true
	call_deferred("_flush_redraw")


func _flush_redraw() -> void:
	_redraw_pending = false
	queue_redraw()


func _draw() -> void:
	if session == null:
		return
	var cs: int = GameData.CELL_SIZE
	var fx: Dictionary = session.effects()
	var show_from: String = str(fx.get("show_rarity_from", "legendary"))
	var det_r: int = int(fx.get("detector_radius", 0))
	var player: Vector2i = session.player

	var view: Rect2i = _view_grid_rect(cs)
	var x_end: int = view.position.x + view.size.x
	var y_end: int = view.position.y + view.size.y
	for y in range(view.position.y, y_end):
		for x in range(view.position.x, x_end):
			var key := WorldGen.cell_key(x, y)
			if not session.ores.has(key):
				continue
			var cell: Dictionary = session.ores[key]
			var pos := Vector2i(x, y)
			var rect := Rect2(Vector2(pos) * cs, Vector2(cs, cs))
			var inner := rect.grow(-3)

			if bool(cell.get("taken", false)):
				_draw_mined_pit(inner)
				continue

			var meta: Dictionary = GameData.ore_meta(int(cell.get("type", 1)))
			var ore_rarity: String = str(meta.get("rarity", "common"))

			if not bool(cell.get("broken", false)):
				_draw_rock_cell(inner, pos, meta, ore_rarity, show_from, det_r, player)
			else:
				_draw_exposed_ore(inner, meta)


func _draw_mined_pit(inner: Rect2) -> void:
	draw_rect(inner, PIT_COLOR, true)
	draw_rect(inner.grow(-4), PIT_INNER, true)
	draw_line(inner.position + Vector2(4, 4), inner.position + inner.size - Vector2(6, 6), Color(0, 0, 0, 0.35), 1.0)


func _view_grid_rect(cs: int) -> Rect2i:
	var cam: Camera2D = get_viewport().get_camera_2d()
	if cam == null:
		return Rect2i(-9999, -9999, 19998, 19998)
	var zoom: float = maxf(cam.zoom.x, 0.01)
	var half: Vector2 = get_viewport().get_visible_rect().size / zoom * 0.55
	var center: Vector2 = cam.global_position
	var x0: int = int(floor((center.x - half.x) / cs)) - 2
	var y0: int = int(floor((center.y - half.y) / cs)) - 2
	var x1: int = int(ceil((center.x + half.x) / cs)) + 2
	var y1: int = int(ceil((center.y + half.y) / cs)) + 2
	return Rect2i(x0, y0, x1 - x0, y1 - y0)


func _draw_rock_cell(
	inner: Rect2,
	pos: Vector2i,
	meta: Dictionary,
	ore_rarity: String,
	show_from: String,
	det_r: int,
	player: Vector2i,
) -> void:
	draw_rect(inner, ROCK_BOTTOM, true)
	draw_rect(Rect2(inner.position, Vector2(inner.size.x, inner.size.y * 0.45)), ROCK_TOP, true)
	draw_rect(inner, ROCK_EDGE, false, 1.0)

	var h: int = _hash_pos(pos)
	var c: Vector2 = inner.get_center()
	for i in range(3):
		var ang: float = float((h + i * 53) % 360) * TAU / 360.0
		var dist: float = inner.size.x * (0.08 + float((h + i * 11) % 20) * 0.012)
		var speck: Vector2 = c + Vector2(cos(ang), sin(ang)) * dist
		var speck_col: Color = Color(0.18, 0.15, 0.13, 0.55) if i % 2 == 0 else Color(0.28, 0.24, 0.2, 0.4)
		draw_circle(speck, 2.0 + float(i % 3), speck_col)

	for i in range(2):
		var a0: float = float((h + i * 41) % 360) * TAU / 360.0
		var a1: float = a0 + 0.45 + float(i) * 0.18
		var r0: float = inner.size.x * 0.1
		var r1: float = inner.size.x * 0.4
		draw_line(
			c + Vector2(cos(a0), sin(a0)) * r0,
			c + Vector2(cos(a1), sin(a1)) * r1,
			Color(0, 0, 0, 0.4),
			1.0,
		)

	if UserSettings.show_ore_preview:
		_draw_ore_gem(inner, meta, 0.55)

	if det_r > 0 and _manhattan(player, pos) <= det_r:
		if UpgradeSystem.rarity_meets(ore_rarity, show_from):
			var hint: Color = Color(1.0, 0.82, 0.35, 0.55)
			draw_rect(inner.grow(-2), hint, false, 2.0)
			draw_circle(c, 3.5, Color(1.0, 0.9, 0.5, 0.35))


func _draw_exposed_ore(inner: Rect2, meta: Dictionary) -> void:
	draw_rect(inner.grow(-1), Color("#1c1816"), true)
	draw_rect(inner.grow(-2), Color("#252018"), true)
	_draw_ore_gem(inner, meta, 1.0)


func _draw_ore_gem(inner: Rect2, meta: Dictionary, alpha: float) -> void:
	var ore_color: Color = meta.get("color", Color.GRAY)
	var ore_glow: Color = meta.get("glow", Color.WHITE)
	ore_color.a = alpha
	ore_glow.a = alpha
	var shape: String = str(meta.get("shape", "chunk"))
	var c: Vector2 = inner.get_center()
	var r: float = inner.size.x * 0.22
	match shape:
		"crystal":
			var pts: PackedVector2Array = PackedVector2Array()
			for i in range(4):
				var a: float = float(i) * TAU / 4.0 + PI / 4.0
				pts.append(c + Vector2(cos(a), sin(a)) * r * 1.15)
			draw_colored_polygon(pts, ore_color)
			draw_polyline(pts, ore_glow, 2.0, true)
			draw_circle(c, r * 0.25, Color(1, 1, 1, 0.45 * alpha))
		"metal":
			var pts2: PackedVector2Array = PackedVector2Array()
			for i in range(6):
				var a2: float = float(i) * TAU / 6.0
				pts2.append(c + Vector2(cos(a2), sin(a2)) * r)
			draw_colored_polygon(pts2, ore_color)
			draw_polyline(pts2, ore_glow, 2.0, true)
			draw_line(c + Vector2(-r, -r * 0.2), c + Vector2(r * 0.6, r * 0.3), Color(1, 1, 1, 0.35 * alpha), 2.0)
		"void":
			draw_circle(c, r * 1.1, ore_glow)
			draw_circle(c, r * 0.75, ore_color)
			draw_arc(c, r * 0.5, 0.0, TAU, 16, Color(0.6, 0.4, 1.0, 0.6 * alpha), 2.0)
		_:
			draw_circle(c, r, ore_color)
			draw_circle(c, r * 0.65, ore_color.lightened(0.12))
			var ring: Color = ore_glow
			ring.a *= 0.35
			draw_circle(c, r * 1.05, ring)


func _hash_pos(pos: Vector2i) -> int:
	return absi(pos.x * 73856093 ^ pos.y * 19349663)


func _unhandled_input(event: InputEvent) -> void:
	if session == null:
		return
	if not (event is InputEventMouseButton):
		return
	var mouse: InputEventMouseButton = event as InputEventMouseButton
	if not mouse.pressed or mouse.button_index != MOUSE_BUTTON_LEFT:
		return
	var local: Vector2 = get_global_transform().affine_inverse() * mouse.global_position
	var cs: int = GameData.CELL_SIZE
	var target := Vector2i(int(floor(local.x / cs)), int(floor(local.y / cs)))
	get_viewport().set_input_as_handled()
	var main: Node = get_tree().get_first_node_in_group("game_main")
	if main != null and main.has_method("request_move_to"):
		main.call("request_move_to", target)


func _manhattan(a: Vector2i, b: Vector2i) -> int:
	return absi(a.x - b.x) + absi(a.y - b.y)
