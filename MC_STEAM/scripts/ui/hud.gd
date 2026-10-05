extends CanvasLayer

const BASE_HINT := "WASD · B · O"
const ORE_BAG_FONT := 22
const ORE_BAG_SWATCH := 20

@onready var money_label: Label = $Margin/VBox/TopBar/Money
@onready var depth_label: Label = $Margin/VBox/TopBar/Depth
@onready var layer_label: Label = $Margin/VBox/TopBar/Layer
@onready var layer_bar: ProgressBar = $Margin/VBox/TopBar/LayerBar
@onready var combo_label: Label = $Margin/VBox/TopBar/Combo
@onready var gear_label: Label = $Margin/VBox/Gear
@onready var absorb_label: Label = $Margin/VBox/Absorb
@onready var toast_label: Label = $Margin/VBox/Toast
@onready var hint_label: Label = $Margin/VBox/Hint
@onready var mine_row: Control = $MineRow
@onready var mine_label: Label = $MineRow/HBox/MineLabel
@onready var mine_bar: ProgressBar = $MineRow/HBox/MineBar
@onready var tutorial_panel: PanelContainer = $TutorialPanel
@onready var ore_list: VBoxContainer = $OreBag/VBox/List

var _toast_timer: float = 0.0
var _session: GameSession
var _absorb_radius: int = 0
var _absorb_cd: float = 0.0


func _ready() -> void:
	GameEvents.money_changed.connect(_on_money)
	GameEvents.depth_changed.connect(_on_depth)
	GameEvents.layer_changed.connect(_on_layer)
	GameEvents.combo_changed.connect(_on_combo)
	GameEvents.gear_changed.connect(_on_gear)
	GameEvents.tool_hints.connect(_on_tool_hints)
	GameEvents.toast.connect(_on_toast)
	GameEvents.mining_progress.connect(_on_mining_progress)
	GameEvents.mining_finished.connect(_on_mining_finished)
	GameEvents.ore_stock_changed.connect(_refresh_ore_bag)
	toast_label.modulate.a = 0.0
	hint_label.text = BASE_HINT
	absorb_label.visible = false
	_style_bar()
	_style_mine_row()
	tutorial_panel.visible = false
	mine_row.visible = false
	var ok_btn: Button = tutorial_panel.get_node_or_null("Margin/VBox/Ok") as Button
	if ok_btn != null:
		UiStyle.apply_action_button(ok_btn, UiStyle.CYAN)
		if not ok_btn.pressed.is_connected(_on_tutorial_ok):
			ok_btn.pressed.connect(_on_tutorial_ok)


func bind_session(game_session: GameSession) -> void:
	_session = game_session
	_refresh_absorb_label()
	_refresh_ore_bag()


func _style_bar() -> void:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#1a1520")
	sb.corner_radius_top_left = 4
	sb.corner_radius_top_right = 4
	sb.corner_radius_bottom_left = 4
	sb.corner_radius_bottom_right = 4
	layer_bar.add_theme_stylebox_override("background", sb)
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color("#f0a020")
	layer_bar.add_theme_stylebox_override("fill", fill)


func _style_mine_row() -> void:
	tutorial_panel.add_theme_stylebox_override("panel", UiStyle.pixel_frame(UiStyle.CYAN))
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color("#120e18", 0.92)
	bg.border_width_left = 2
	bg.border_width_top = 2
	bg.border_width_right = 2
	bg.border_width_bottom = 2
	bg.border_color = Color("#f0a020", 0.85)
	bg.corner_radius_top_left = 0
	bg.corner_radius_top_right = 0
	bg.corner_radius_bottom_left = 0
	bg.corner_radius_bottom_right = 0
	mine_row.add_theme_stylebox_override("panel", bg)
	var mbg := StyleBoxFlat.new()
	mbg.bg_color = Color("#0a0c10")
	mine_bar.add_theme_stylebox_override("background", mbg)
	var mfill := StyleBoxFlat.new()
	mfill.bg_color = Color("#ffe566")
	mine_bar.add_theme_stylebox_override("fill", mfill)


func _process(delta: float) -> void:
	if _toast_timer > 0.0:
		_toast_timer -= delta
		toast_label.modulate.a = clampf(_toast_timer / 1.2, 0.0, 1.0)
	if _absorb_radius > 0:
		_refresh_absorb_label()


func maybe_show_tutorial(is_fresh: bool) -> void:
	if UserSettings.tutorial_dismissed or not is_fresh:
		tutorial_panel.visible = false
		return
	tutorial_panel.visible = true


func hide_tutorial() -> void:
	tutorial_panel.visible = false


func _on_tutorial_ok() -> void:
	UserSettings.dismiss_tutorial()
	hide_tutorial()


func _on_tool_hints(absorb_radius: int, absorb_cooldown: float) -> void:
	_absorb_radius = absorb_radius
	_absorb_cd = absorb_cooldown
	_refresh_absorb_label()


func _refresh_absorb_label() -> void:
	if _absorb_radius <= 0:
		absorb_label.visible = false
		hint_label.text = BASE_HINT
		return
	absorb_label.visible = true
	var range_txt: String = "全图" if _absorb_radius >= 999 else "%d格" % _absorb_radius
	var wait: float = 0.0
	if _session != null and _absorb_cd > 0.0 and _session.last_absorb_time > 0.0:
		var now: float = Time.get_ticks_msec() / 1000.0
		wait = _absorb_cd - (now - _session.last_absorb_time)
	if wait > 0.05:
		absorb_label.text = "🌀 E  %.1fs" % wait
		absorb_label.modulate = Color(0.55, 0.62, 0.72, 1.0)
	else:
		absorb_label.text = "🌀 E  %s" % range_txt
		absorb_label.modulate = Color(0.75, 0.92, 1.0, 1.0)
	hint_label.text = BASE_HINT


func _on_mining_progress(_grid_pos: Vector2i, progress: float, _ore_color: Color) -> void:
	mine_row.visible = true
	mine_bar.value = clampf(progress * 100.0, 0.0, 100.0)
	mine_label.text = "挖掘中 %d%%" % int(round(progress * 100.0))


func _on_mining_finished() -> void:
	mine_row.visible = false
	mine_bar.value = 0.0
	mine_label.text = ""


func _on_money(amount: int) -> void:
	money_label.text = "◆ %s" % _fmt(amount)


func _on_depth(depth: int, max_d: int) -> void:
	var next_m: int = GameData.next_depth_milestone(depth)
	if next_m > depth:
		depth_label.text = "深 %d · 下段 %d" % [depth, next_m]
	else:
		depth_label.text = "深 %d / %d" % [depth, max_d]


func _on_layer(title: String, progress: float) -> void:
	layer_label.text = title
	layer_bar.value = progress * 100.0


func _on_combo(stacks: int, bonus: float) -> void:
	if stacks <= 1:
		combo_label.text = ""
	else:
		combo_label.text = "连 x%d 兑换+%d%%" % [stacks, int(round(bonus * 100.0))]


func _refresh_ore_bag() -> void:
	for c in ore_list.get_children():
		c.queue_free()
	if _session == null:
		return
	var type_ids: Array = GameData.ORE_TYPES.keys()
	type_ids.sort()
	var any: bool = false
	for tid_v in type_ids:
		var type_id: int = int(tid_v)
		var count: int = _session.ore_count(type_id)
		if count <= 0:
			continue
		any = true
		var meta: Dictionary = GameData.ore_meta(type_id)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 12)
		var swatch := ColorRect.new()
		swatch.custom_minimum_size = Vector2(ORE_BAG_SWATCH, ORE_BAG_SWATCH)
		swatch.color = meta.get("color", Color.GRAY)
		row.add_child(swatch)
		var name_lbl := Label.new()
		name_lbl.text = str(meta.get("name", ""))
		name_lbl.add_theme_font_size_override("font_size", ORE_BAG_FONT)
		name_lbl.custom_minimum_size = Vector2(76, 0)
		row.add_child(name_lbl)
		var cnt_lbl := Label.new()
		cnt_lbl.text = "×%d" % count
		cnt_lbl.add_theme_font_size_override("font_size", ORE_BAG_FONT)
		row.add_child(cnt_lbl)
		ore_list.add_child(row)
	if not any:
		var empty := Label.new()
		empty.text = "（暂无）"
		empty.add_theme_font_size_override("font_size", 18)
		empty.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
		ore_list.add_child(empty)


func _on_gear(pickaxe_name: String, dirt_sec: float, pickaxe_level: int) -> void:
	var dia: float = GameData.ore_mine_sec(5, pickaxe_level)
	gear_label.text = "⛏ %s · 土 %.1fs · 钻 %.1fs" % [pickaxe_name, dirt_sec, dia]


func _on_toast(message: String, kind: String) -> void:
	if message.is_empty():
		return
	toast_label.text = message
	toast_label.add_theme_color_override("font_color", Color("#ffe566") if kind == "ok" else Color("#ffaa88"))
	_toast_timer = 1.2


func _fmt(n: int) -> String:
	var s := str(n)
	var out := ""
	var count := 0
	for i in range(s.length() - 1, -1, -1):
		out = s[i] + out
		count += 1
		if count == 3 and i > 0:
			out = "," + out
			count = 0
	return out
