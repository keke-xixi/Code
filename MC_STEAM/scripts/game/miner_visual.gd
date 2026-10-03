extends Node2D
## 深核矿工 - 移动 + 镐子挥击掘进

var grid_pos: Vector2i = Vector2i.ZERO
var _mine_k: float = 0.0
var _mine_progress: float = 0.0
var _pick_swing: float = 0.0
var _facing: Vector2i = Vector2i(0, 1)
var _seq: Tween
var _expected_hits: int = 4
var _last_hit_idx: int = -1
var _impact_k: float = 0.0
var _last_prog_emit_ms: int = 0

const INK := Color("#1a2332")
const SUIT := Color("#3d5a80")
const SUIT_L := Color("#5c7a9e")
const HELMET := Color("#f0a020")
const VISOR := Color("#7ee8ff")
const HANDLE := Color("#6b4f3a")
const PICK_HEAD := Color("#8a9098")
const PICK_EDGE := Color("#c8cdd4")


func _ready() -> void:
	scale = Vector2(0.72, 0.72)
	set_process(false)


func move_and_mine(
	target_grid: Vector2i,
	facing: Vector2i,
	move_duration: float,
	mine_duration: float,
	ore_type: int,
	on_done: Callable,
) -> void:
	if facing != Vector2i.ZERO:
		_facing = facing
	grid_pos = target_grid
	_kill_seq()
	_expected_hits = maxi(4, int(mine_duration * 3.2)) if mine_duration > 0.02 else 1
	_last_hit_idx = -1
	_last_prog_emit_ms = 0
	var cs: int = GameData.CELL_SIZE
	var target: Vector2 = Vector2(target_grid) * cs + Vector2(cs * 0.5, cs * 0.5)
	var meta: Dictionary = GameData.ore_meta(ore_type)
	var ore_col: Color = meta.get("color", Color.GRAY)

	_mine_progress = 0.0
	_set_mine_k(0.0)
	set_process(true)

	var need_move: bool = position.distance_to(target) > 0.5
	var has_mine: bool = mine_duration > 0.02

	_seq = create_tween()
	if need_move and has_mine:
		_seq.set_parallel(true)
		_seq.tween_property(self, "position", target, move_duration).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		_seq.tween_method(
			func(p: float) -> void:
				_set_mine_progress(p, ore_col),
			0.0,
			1.0,
			mine_duration,
		).set_trans(Tween.TRANS_LINEAR)
		_seq.set_parallel(false)
	elif need_move:
		var pit_d: float = move_duration
		_seq.tween_property(self, "position", target, pit_d).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	elif has_mine:
		_seq.tween_interval(0.01)
		_seq.tween_method(
			func(p: float) -> void:
				_set_mine_progress(p, ore_col),
			0.0,
			1.0,
			mine_duration,
		).set_trans(Tween.TRANS_LINEAR)
	else:
		_seq.tween_method(_set_mine_k, 0.0, 1.0, 0.05)
		_seq.tween_callback(func() -> void:
			GameEvents.mining_pick_hit.emit(grid_pos, 0.75)
		)
		_seq.tween_method(_set_mine_k, 1.0, 0.0, 0.06)

	_seq.tween_callback(func() -> void:
		_set_mine_progress(0.0, ore_col)
		GameEvents.mining_finished.emit()
		set_process(false)
		if on_done.is_valid():
			on_done.call()
	)


func set_grid_position(g: Vector2i, instant: bool = false) -> void:
	grid_pos = g
	var cs: int = GameData.CELL_SIZE
	var target: Vector2 = Vector2(g) * cs + Vector2(cs * 0.5, cs * 0.5)
	_kill_seq()
	set_process(false)
	_set_mine_k(0.0)
	_mine_progress = 0.0
	_pick_swing = 0.0
	_last_hit_idx = -1
	if instant:
		position = target
		return
	var tw: Tween = create_tween()
	tw.tween_property(self, "position", target, 0.09).set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)


func _process(_delta: float) -> void:
	if _mine_progress > 0.0 or _impact_k > 0.02:
		queue_redraw()


func _set_mine_k(v: float) -> void:
	_mine_k = v
	queue_redraw()


func _set_mine_progress(p: float, ore_col: Color) -> void:
	_mine_progress = p
	_impact_k *= 0.65
	var hit_idx: int = int(p * float(_expected_hits))
	if hit_idx > _last_hit_idx and p > 0.01:
		_last_hit_idx = hit_idx
		_impact_k = 1.0
		var strength: float = clampf(0.45 + p * 0.55, 0.0, 1.0)
		GameEvents.mining_pick_hit.emit(grid_pos, strength)
	var phase: float = fmod(p * float(_expected_hits), 1.0)
	_pick_swing = 1.0 - absf(phase * 2.0 - 1.0)
	_mine_k = 0.25 + _pick_swing * 0.75
	var now_ms: int = Time.get_ticks_msec()
	if now_ms - _last_prog_emit_ms >= 33 or p <= 0.02 or p >= 0.98:
		GameEvents.mining_progress.emit(grid_pos, p, ore_col)
		_last_prog_emit_ms = now_ms
	queue_redraw()


func abort_step(stay_grid: Vector2i) -> void:
	_kill_seq()
	set_process(false)
	grid_pos = stay_grid
	var cs: int = GameData.CELL_SIZE
	position = Vector2(stay_grid) * cs + Vector2(cs * 0.5, cs * 0.5)
	_mine_progress = 0.0
	_set_mine_k(0.0)
	_pick_swing = 0.0
	_last_hit_idx = -1
	GameEvents.mining_finished.emit()


func _kill_seq() -> void:
	if _seq != null and _seq.is_valid():
		_seq.kill()
	_seq = null


func _draw() -> void:
	var dig: float = _mine_k
	var dir: Vector2 = _facing_vec()
	var lean: Vector2 = dir * (4.0 * dig + 9.0 * _impact_k) + Vector2(0, -3.0 * _pick_swing)

	draw_set_transform(lean, 0.0, Vector2.ONE)
	draw_circle(Vector2(0, 14), 10, Color(0, 0, 0, 0.2))

	draw_line(Vector2(-5, 10), Vector2(-6, 18), INK, 4.0)
	draw_line(Vector2(5, 10), Vector2(6, 18), INK, 4.0)

	draw_rect(Rect2(-9, -2, 18, 16), INK)
	draw_rect(Rect2(-8, -1, 16, 14), SUIT)
	draw_rect(Rect2(-6, 2, 12, 8), SUIT_L)

	draw_circle(Vector2(0, -10), 11, INK)
	draw_circle(Vector2(0, -10), 10, HELMET)
	draw_arc(Vector2(0, -11), 8, 0.0, PI, 10, VISOR, true)
	draw_rect(Rect2(-10, -14, 20, 4), HELMET, true)

	_draw_pick_arm(dir, dig)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _draw_pick_arm(dir: Vector2, dig: float) -> void:
	var face_ang: float = atan2(dir.y, dir.x)
	var shoulder: Vector2 = Vector2(-6 * dir.y, 6 * dir.x)
	var swing_back: float = lerpf(-1.25, 0.72, _pick_swing)
	var arm_ang: float = face_ang + swing_back
	var handle_len: float = 20.0
	var grip: Vector2 = shoulder
	var tip: Vector2 = grip + Vector2(cos(arm_ang), sin(arm_ang)) * handle_len

	draw_line(grip, tip, INK, 5.0)
	draw_line(grip, tip, HANDLE, 3.5)

	var head_ang: float = arm_ang + PI * 0.5
	var head_w: float = 11.0 + dig * 2.0
	var head_c: Vector2 = tip + Vector2(cos(arm_ang), sin(arm_ang)) * 4.0
	var p1: Vector2 = head_c + Vector2(cos(head_ang), sin(head_ang)) * head_w * 0.5
	var p2: Vector2 = head_c - Vector2(cos(head_ang), sin(head_ang)) * head_w * 0.5
	var p3: Vector2 = head_c + Vector2(cos(arm_ang), sin(arm_ang)) * 7.0
	var pts := PackedVector2Array([p1, p2, p3])
	draw_colored_polygon(pts, PICK_HEAD)
	draw_polyline(pts, PICK_EDGE, 1.5, true)

	if _pick_swing > 0.45:
		var spark: Vector2 = p3 + Vector2(cos(arm_ang), sin(arm_ang)) * 3.0
		var sa: float = (_pick_swing - 0.45) / 0.55
		draw_circle(spark, 3.0 + sa * 6.0, Color(1, 0.9, 0.55, 0.45 * sa))
		for i in range(5):
			var a: float = face_ang + float(i - 2) * 0.28
			draw_line(spark, spark + Vector2(cos(a), sin(a)) * (8.0 + sa * 12.0), Color(1, 0.85, 0.4, 0.55 * sa), 2.0)
	if _impact_k > 0.05:
		draw_circle(p3, 5.0 + _impact_k * 8.0, Color(1, 1, 1, 0.12 * _impact_k))


func _facing_vec() -> Vector2:
	if _facing == Vector2i(0, -1):
		return Vector2(0, -1)
	if _facing == Vector2i(-1, 0):
		return Vector2(-1, 0)
	if _facing == Vector2i(1, 0):
		return Vector2(1, 0)
	return Vector2(0, 1)
