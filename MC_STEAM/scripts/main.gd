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
var _shop_open: bool = false
var _settings_open: bool = false
var _zoom: float = float(GameData.ZOOM.get("default", 1.0))
var _last_facing: Vector2i = Vector2i(0, 1)
var _autosave_timer: float = 0.0
var _dirty_save: bool = false
var _save_busy: bool = false
var _shake_amp: float = 0.0
var _queued_dir: Vector2i = Vector2i.ZERO
var _fresh_run: bool = false


func _ready() -> void:
	add_to_group("game_main")
	camera.position_smoothing_enabled = false
	mine_world.setup(session)
	GameEvents.ore_collected.connect(_on_ore_collected)
	GameEvents.mining_pick_hit.connect(_on_mining_pick_hit)
	_bind_menu()
	if SaveManager.has_save():
		menu.show_continue(true)
	else:
		menu.show_continue(false)


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
	miner.set_grid_position(session.player, true)
	_zoom = float(GameData.ZOOM.get("default", 1.0))
	camera.zoom = Vector2.ONE * _zoom
	_update_camera(true)
	_emit_all_ui()
	_mark_dirty_save(true)
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


func _unhandled_input(event: InputEvent) -> void:
	if menu.visible:
		return
	_settings_open = settings.visible
	if event.is_action_pressed("toggle_settings"):
		settings.toggle()
		_settings_open = settings.visible
		return
	if _shop_open or _settings_open:
		return
	if event.is_action_pressed("toggle_shop"):
		_shop_open = true
		shop.open(session)
		shop.closed.connect(func(): _shop_open = false, CONNECT_ONE_SHOT)
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
		mine_world.queue_redraw()
		_mark_dirty_save(false)
		return
	var dir := Vector2i.ZERO
	if event.is_pressed() and not event.is_echo():
		if event.is_action("move_up"):
			dir = Vector2i(0, -1)
		elif event.is_action("move_down"):
			dir = Vector2i(0, 1)
		elif event.is_action("move_left"):
			dir = Vector2i(-1, 0)
		elif event.is_action("move_right"):
			dir = Vector2i(1, 0)
	if dir != Vector2i.ZERO:
		_last_facing = dir
		if _step_locked:
			_queued_dir = dir
			return
		_try_move(dir)
		return
	if _step_locked:
		return


func request_move_to(target: Vector2i) -> void:
	if menu.visible or _shop_open or _settings_open or _step_locked:
		return
	var delta: Vector2i = target - session.player
	if delta != Vector2i.ZERO:
		_last_facing = delta
	var step: Dictionary = session.try_move_to(target)
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
	var fx: Dictionary = session.effects()
	var move_d: float = clampf(float(fx.get("move_duration", 0.10)), 0.06, 0.12)
	var mine_d: float = float(step.get("mine_duration", 0.0))
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
		mine_world.queue_redraw()
		_step_committed = true
	if _step_locked:
		_step_locked = false
		call_deferred("_flush_queued_move")


func _flush_queued_move() -> void:
	if _step_locked or _queued_dir == Vector2i.ZERO:
		return
	if menu.visible or _shop_open or settings.visible:
		_queued_dir = Vector2i.ZERO
		return
	var dir := _queued_dir
	_queued_dir = Vector2i.ZERO
	_last_facing = dir
	_try_move(dir)


func _on_mining_pick_hit(_grid_pos: Vector2i, strength: float) -> void:
	if not UserSettings.screen_shake:
		return
	_shake_amp = maxf(_shake_amp, lerpf(0.7, 2.0, strength))


func _on_ore_collected(ore_name: String, gain: int, world_pos: Vector2) -> void:
	var floater: Node = FLOAT_SCENE.instantiate()
	float_root.add_child(floater)
	floater.spawn("%s  +%d" % [ore_name, gain], world_pos)
	if gain >= 100:
		_camera_shake(3.5)
	elif gain >= 30:
		_camera_shake(1.8)


func _update_camera(instant: bool, delta: float = 0.016) -> void:
	var cs: int = GameData.CELL_SIZE
	var target: Vector2
	if _step_locked:
		target = miner.global_position
	else:
		target = Vector2(session.player) * cs + Vector2(cs * 0.5, cs * 0.5)
	if instant or _step_locked:
		camera.position = target
	else:
		var t: float = clampf(delta * 16.0, 0.0, 1.0)
		camera.position = camera.position.lerp(target, t)


func _apply_camera_shake(delta: float) -> void:
	if _shake_amp > 0.04:
		camera.offset = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * _shake_amp
		_shake_amp = lerpf(_shake_amp, 0.0, clampf(delta * 20.0, 0.0, 1.0))
	elif camera.offset != Vector2.ZERO:
		camera.offset = Vector2.ZERO
		_shake_amp = 0.0


func _emit_all_ui() -> void:
	GameEvents.money_changed.emit(session.money)
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
	if menu.visible or _shop_open or settings.visible:
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
