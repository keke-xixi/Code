extends Node2D

@onready var camera: Camera2D = $Camera2D
@onready var mine_world: Node2D = $MineWorld
@onready var miner: Node2D = $Miner
@onready var hud: CanvasLayer = $HUD
@onready var shop: CanvasLayer = $Shop
@onready var settings: CanvasLayer = $Settings
@onready var menu: CanvasLayer = $MainMenu
@onready var float_root: Node2D = $FloatRoot

const FLOAT_SCENE: PackedScene = preload("res://scenes/fx/floating_text.tscn")
const AUTOSAVE_INTERVAL: float = 2.5

var session: GameSession = GameSession.new()
var _step_locked: bool = false
var _step_serial: int = 0
var _step_committed: bool = false
var _step_target: Vector2i = Vector2i.ZERO
var _step_action: String = "step"
var _shop_open: bool = false
var _zoom: float = float(GameData.ZOOM.get("default", 1.0))
var _last_facing: Vector2i = Vector2i(0, 1)
var _autosave_timer: float = 0.0
var _dirty_save: bool = false
var _save_busy: bool = false
var _shake_amp: float = 0.0
var _queued_dir: Vector2i = Vector2i.ZERO
var _fresh_run: bool = false
var _view_chunk: Vector2i = Vector2i(-99999, -99999)
var _pad_move_cd: float = 0.0
var _step_input_cd: float = 0.0
var _cancel_cd: float = 0.0
var _last_pointer_at: float = 0.0
const STEP_INPUT_GAP: float = 0.05
const POINTER_COALESCE: float = 0.045
const CANCEL_GAP: float = 0.1


func _ready() -> void:
	add_to_group("game_main")
	camera.position_smoothing_enabled = false
	mine_world.setup(session)
	GameEvents.ore_collected.connect(_on_ore_collected)
	GameEvents.mining_pick_hit.connect(_on_mining_pick_hit)
	GameEvents.shop_toggled.connect(_on_shop_toggled)
	_bind_menu()
	if SaveManager.has_save():
		menu.show_continue(true)
	else:
		menu.show_continue(false)


func _apply_move_input(dir: Vector2i) -> void:
	if dir == Vector2i.ZERO:
		return
	_last_facing = dir
	if _step_locked:
		if _is_retreat_to_pit(dir):
			_try_cancel_and_walk(dir)
			return
		if _step_action == "mine":
			return
		_queue_dir(dir)
		return
	if _step_input_cd > 0.0:
		_queued_dir = dir
		call_deferred("_flush_queued_move")
		return
	_try_move(dir)


func _poll_pad_move(delta: float) -> void:
	_pad_move_cd = maxf(0.0, _pad_move_cd - delta)
	if _pad_move_cd > 0.0 or _overlay_blocks_play():
		return
	var pads: Array[int] = Input.get_connected_joypads()
	if pads.is_empty():
		return
	var v: Vector2 = Vector2(
		Input.get_joy_axis(pads[0], JOY_AXIS_LEFT_X),
		Input.get_joy_axis(pads[0], JOY_AXIS_LEFT_Y),
	)
	if v.length() < 0.55:
		return
	var dir := Vector2i.ZERO
	if absf(v.x) > absf(v.y):
		dir.x = int(signf(v.x))
	else:
		dir.y = int(signf(v.y))
	if dir == Vector2i.ZERO:
		return
	_pad_move_cd = maxf(STEP_INPUT_GAP, 0.13)
	_apply_move_input(dir)


func _on_shop_toggled(open: bool) -> void:
	_shop_open = open


func _overlay_blocks_play() -> bool:
	return menu.visible or _shop_open or settings.visible


func _bind_menu() -> void:
	menu.get_node("Panel/Margin/VBox/NewGame").pressed.connect(_start_new)
	menu.get_node("Panel/Margin/VBox/Continue").pressed.connect(_start_continue)
	menu.get_node("Panel/Margin/VBox/Quit").pressed.connect(func(): get_tree().quit())


func _start_new() -> void:
	SaveManager.delete_save()
	session.new_run()
	_fresh_run = true
	_begin_play()


func _is_fresh_run() -> bool:
	return _fresh_run


func _start_continue() -> void:
	_fresh_run = false
	session.load_from(SaveManager.load_session())
	_begin_play()


func _begin_play() -> void:
	menu.visible = false
	_queued_dir = Vector2i.ZERO
	_step_target = session.player
	_view_chunk = Vector2i(-99999, -99999)
	miner.set_grid_position(session.player, true)
	_zoom = float(GameData.ZOOM.get("default", 1.0))
	camera.zoom = Vector2.ONE * _zoom
	_update_camera(true)
	mine_world.mark_view_dirty()
	_emit_all_ui()
	_mark_dirty_save(true)
	if hud.has_method("bind_session"):
		hud.call("bind_session", session)
	if hud.has_method("maybe_show_tutorial"):
		hud.call("maybe_show_tutorial", _is_fresh_run())


func _process(delta: float) -> void:
	if menu.visible:
		return
	_update_camera(false, delta)
	_apply_camera_shake(delta)
	_autosave_timer += delta
	if _dirty_save and _autosave_timer >= AUTOSAVE_INTERVAL:
		_autosave_timer = 0.0
		_flush_save()
	_step_input_cd = maxf(0.0, _step_input_cd - delta)
	_cancel_cd = maxf(0.0, _cancel_cd - delta)
	_poll_pad_move(delta)


func _unhandled_input(event: InputEvent) -> void:
	if menu.visible:
		return
	if event.is_action_pressed("toggle_settings"):
		if _shop_open:
			return
		settings.toggle()
		return
	if event.is_action_pressed("toggle_shop"):
		if settings.visible:
			return
		if _shop_open:
			shop.close_panel()
		else:
			shop.open(session)
		return
	if _shop_open or settings.visible:
		return
	if event.is_action_pressed("save_game"):
		_flush_save()
		GameEvents.toast.emit("已存档", "ok")
		return
	if event.is_action_pressed("absorb"):
		var now: float = Time.get_ticks_msec() / 1000.0
		var res: Dictionary = session.absorb_residuals(now)
		var ok: bool = bool(res.get("ok", false))
		GameEvents.toast.emit(str(res.get("msg", "")), "ok" if ok else "warn")
		mine_world.mark_view_dirty()
		_mark_dirty_save(false)
		return
	var dir := Vector2i.ZERO
	if event.is_action_pressed("move_up"):
		dir = Vector2i(0, -1)
	elif event.is_action_pressed("move_down"):
		dir = Vector2i(0, 1)
	elif event.is_action_pressed("move_left"):
		dir = Vector2i(-1, 0)
	elif event.is_action_pressed("move_right"):
		dir = Vector2i(1, 0)
	if dir != Vector2i.ZERO:
		_apply_move_input(dir)
		return
	if _step_locked:
		return


func request_move_to(target: Vector2i) -> void:
	if menu.visible or _shop_open or settings.visible:
		return
	var now: float = Time.get_ticks_msec() / 1000.0
	if _step_locked:
		if _is_stay_on_current_pit(target):
			_try_cancel_stay()
			return
		if _is_retreat_target(target):
			_try_cancel_and_walk(target - session.player)
			return
		if _step_action == "mine":
			return
		var from: Vector2i = _step_target
		var delta: Vector2i = target - from
		if absi(delta.x) + absi(delta.y) == 1:
			if now - _last_pointer_at < POINTER_COALESCE:
				_queue_dir(delta)
				return
			_last_pointer_at = now
			_queue_dir(delta)
		return
	var delta: Vector2i = target - session.player
	if delta != Vector2i.ZERO:
		_last_facing = delta
	var step: Dictionary = session.try_move_to(target)
	if not bool(step.get("ok", false)):
		return
	_after_step(step)


func _is_retreat_to_pit(dir: Vector2i) -> bool:
	if absi(dir.x) + absi(dir.y) != 1:
		return false
	var dest: Vector2i = session.player + dir
	return _is_taken_cell(dest)


func _is_stay_on_current_pit(target: Vector2i) -> bool:
	return target == session.player and _is_taken_cell(target)


func _is_retreat_target(target: Vector2i) -> bool:
	if absi(target.x - session.player.x) + absi(target.y - session.player.y) != 1:
		return false
	return _is_taken_cell(target)


func _queue_dir(dir: Vector2i) -> void:
	if dir == Vector2i.ZERO:
		return
	_queued_dir = dir
	_last_facing = dir


func _try_cancel_stay() -> void:
	if _cancel_cd > 0.0 or not _step_locked:
		return
	_cancel_cd = CANCEL_GAP
	_cancel_locked_step_stay()


func _try_cancel_and_walk(dir: Vector2i) -> void:
	if _cancel_cd > 0.0 or not _step_locked:
		return
	_cancel_cd = CANCEL_GAP
	_cancel_locked_step_and_walk(dir)


func _is_taken_cell(grid: Vector2i) -> bool:
	var cell: Dictionary = session.get_cell(grid.x, grid.y)
	return bool(cell.get("taken", false))


func _cancel_locked_step_stay() -> void:
	_step_serial += 1
	_step_locked = false
	_step_committed = true
	_queued_dir = Vector2i.ZERO
	_step_input_cd = 0.0
	if miner.has_method("abort_step"):
		miner.call("abort_step", session.player)


func _cancel_locked_step_and_walk(dir: Vector2i) -> void:
	_step_serial += 1
	_step_locked = false
	_step_committed = true
	_queued_dir = Vector2i.ZERO
	_step_input_cd = 0.0
	if miner.has_method("abort_step"):
		miner.call("abort_step", session.player)
	var step: Dictionary = session.try_move(dir)
	if not bool(step.get("ok", false)):
		return
	_after_step(step)


func _try_move(dir: Vector2i) -> void:
	var step: Dictionary = session.try_move(dir)
	if not bool(step.get("ok", false)):
		return
	_after_step(step)


func _after_step(step: Dictionary) -> void:
	_step_locked = true
	_step_committed = false
	_step_serial += 1
	var serial: int = _step_serial
	_mark_dirty_save(false)
	var target := Vector2i(int(step.get("target_x", 0)), int(step.get("target_y", 0)))
	_step_target = target
	_step_action = str(step.get("action", "step"))
	if _step_action == "mine":
		_queued_dir = Vector2i.ZERO
	var fx: Dictionary = session.effects()
	var mine_d: float = float(step.get("mine_duration", 0.0))
	var move_d: float = clampf(float(fx.get("move_duration", 0.10)), 0.06, 0.12)
	if mine_d <= 0.02:
		move_d = clampf(move_d * 0.5, 0.04, 0.07)
	var ore_type: int = int(step.get("ore_type", 1))
	var action: String = str(step.get("action", "step"))
	var safety_t: float = move_d + mine_d + 0.8
	get_tree().create_timer(safety_t).timeout.connect(
		func() -> void:
			_finish_step(serial, target, action, true),
		CONNECT_ONE_SHOT,
	)
	if miner.has_method("move_and_mine"):
		miner.call(
			"move_and_mine",
			target,
			_last_facing,
			move_d,
			mine_d,
			ore_type,
			func() -> void:
				_finish_step(serial, target, action, false)
		)
	else:
		_finish_step(serial, target, action, false)


func _finish_step(serial: int, target: Vector2i, action: String, _from_safety: bool) -> void:
	if serial != _step_serial:
		return
	if not _step_committed:
		session.commit_step(target, action)
		if action == "mine":
			session.complete_mine_at(target)
		mine_world.mark_view_dirty()
		_step_committed = true
	if _step_locked:
		_step_locked = false
		_step_input_cd = STEP_INPUT_GAP
		if action == "mine":
			_queued_dir = Vector2i.ZERO
		call_deferred("_flush_queued_move")


func _flush_queued_move() -> void:
	if _step_locked or _queued_dir == Vector2i.ZERO:
		return
	if _overlay_blocks_play():
		_queued_dir = Vector2i.ZERO
		return
	if _step_input_cd > 0.0:
		get_tree().create_timer(_step_input_cd).timeout.connect(
			func() -> void: _flush_queued_move(),
			CONNECT_ONE_SHOT,
		)
		return
	var dir := _queued_dir
	_queued_dir = Vector2i.ZERO
	if _is_retreat_to_pit(dir):
		_try_cancel_and_walk(dir)
		return
	var step: Dictionary = session.try_move(dir)
	if not bool(step.get("ok", false)):
		_queued_dir = dir
		get_tree().create_timer(STEP_INPUT_GAP).timeout.connect(
			func() -> void: _flush_queued_move(),
			CONNECT_ONE_SHOT,
		)
		return
	_after_step(step)


func _on_mining_pick_hit(_grid_pos: Vector2i, strength: float) -> void:
	if not UserSettings.screen_shake:
		return
	_shake_amp = maxf(_shake_amp, lerpf(0.7, 2.0, strength))


func _on_ore_collected(ore_name: String, gain: int, world_pos: Vector2) -> void:
	var floater: Node = FLOAT_SCENE.instantiate()
	float_root.add_child(floater)
	floater.spawn("%s  +%d" % [ore_name, gain], world_pos)
	var unit_price: int = 1
	for tid in GameData.ORE_TYPES.keys():
		var meta: Dictionary = GameData.ore_meta(int(tid))
		if str(meta.get("name", "")) == ore_name:
			unit_price = int(meta.get("price", 1))
			break
	if unit_price >= 100:
		_camera_shake(3.5)
	elif unit_price >= 30:
		_camera_shake(1.8)


func _update_camera(instant: bool, delta: float = 0.016) -> void:
	var cs: int = GameData.CELL_SIZE
	var target: Vector2
	if _step_locked:
		target = miner.global_position
	else:
		target = Vector2(session.player) * cs + Vector2(cs * 0.5, cs * 0.5)
	var snap: bool = instant or _step_locked or camera.position.distance_squared_to(target) < 36.0
	if snap:
		camera.position = target
	else:
		var t: float = clampf(delta * 14.0, 0.0, 1.0)
		camera.position = camera.position.lerp(target, t)
	var chunk := Vector2i(int(floor(camera.position.x / float(cs * 2))), int(floor(camera.position.y / float(cs * 2))))
	if chunk != _view_chunk:
		_view_chunk = chunk
		mine_world.mark_view_dirty()


func _apply_camera_shake(delta: float) -> void:
	if _shake_amp > 0.04:
		camera.offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * _shake_amp
		_shake_amp = lerpf(_shake_amp, 0.0, clampf(delta * 20.0, 0.0, 1.0))
	elif camera.offset != Vector2.ZERO:
		camera.offset = Vector2.ZERO
		_shake_amp = 0.0


func _emit_all_ui() -> void:
	GameEvents.money_changed.emit(session.money)
	GameEvents.ore_stock_changed.emit()
	session.emit_gear()
	GameEvents.depth_changed.emit(session.player.y, session.max_depth)
	GameEvents.layer_changed.emit(
		GameData.depth_layer_title(session.player.y),
		GameData.depth_layer_progress(session.player.y)
	)
	GameEvents.run_stats.emit(session.total_collected)


func _mark_dirty_save(flush_now: bool) -> void:
	_dirty_save = true
	if flush_now:
		_flush_save()


func _flush_save() -> void:
	if _save_busy:
		return
	_save_busy = true
	call_deferred("_flush_save_worker")


func _flush_save_worker() -> void:
	SaveManager.save_session(session.to_save_dict())
	_dirty_save = false
	_autosave_timer = 0.0
	_save_busy = false


func _camera_shake(amount: float) -> void:
	if not UserSettings.screen_shake:
		return
	_shake_amp = maxf(_shake_amp, amount)


func _input(event: InputEvent) -> void:
	if _overlay_blocks_play():
		if event is InputEventMouseButton:
			var mb := event as InputEventMouseButton
			if mb.button_index == MOUSE_BUTTON_WHEEL_UP or mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
				get_viewport().set_input_as_handled()
		return
	var zmin: float = float(GameData.ZOOM.get("min", 0.45))
	var zmax: float = float(GameData.ZOOM.get("max", 2.2))
	var zstep: float = float(GameData.ZOOM.get("step", 0.1))
	if event.is_action_pressed("zoom_in"):
		_zoom = clampf(_zoom + zstep, zmin, zmax)
		camera.zoom = Vector2.ONE * _zoom
	elif event.is_action_pressed("zoom_out"):
		_zoom = clampf(_zoom - zstep, zmin, zmax)
		camera.zoom = Vector2.ONE * _zoom
