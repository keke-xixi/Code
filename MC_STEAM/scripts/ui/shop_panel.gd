extends CanvasLayer

signal closed

@onready var panel: PanelContainer = $Panel
@onready var scroll: ScrollContainer = $Panel/Margin/VBox/Scroll
@onready var list: VBoxContainer = $Panel/Margin/VBox/Scroll/List
@onready var money_label: Label = $Panel/Margin/VBox/Money
@onready var upgrade_popup: Control = $UpgradePopup

var session: GameSession
var _upgrade_sys: UpgradeSystem = UpgradeSystem.new()


func _ready() -> void:
	visible = false
	_apply_panel_style()
	panel.gui_input.connect(_on_panel_gui_input)
	scroll.gui_input.connect(_on_scroll_gui_input)
	GameEvents.money_changed.connect(_on_money_changed)


func _apply_panel_style() -> void:
	panel.add_theme_stylebox_override("panel", UiStyle.pixel_frame(UiStyle.CYAN))


func open(game_session: GameSession) -> void:
	session = game_session
	visible = true
	_rebuild()
	GameEvents.shop_toggled.emit(true)


func close_panel() -> void:
	if upgrade_popup.visible and upgrade_popup.has_method("hide_popup"):
		upgrade_popup.hide_popup()
	visible = false
	GameEvents.shop_toggled.emit(false)
	closed.emit()


func _rebuild() -> void:
	for c in list.get_children():
		c.queue_free()
	if session == null:
		return
	money_label.text = "◆ %s" % UpgradeSystem.fmt_coins(session.money)
	for cat in UpgradeSystem.CATALOG:
		list.add_child(_make_row(cat))


func _make_row(cat: Dictionary) -> VBoxContainer:
	var cat_id: String = str(cat.get("id", ""))
	var lvl: int = int(session.owned_upgrades.get(cat_id, 0))
	var display_name: String = UpgradeSystem.display_name_for(cat_id, maxi(lvl, 1))
	if lvl > 0:
		display_name = UpgradeSystem.display_name_for(cat_id, lvl)
	var stripe: Color = UiStyle.stripe_for_category(cat_id)
	var icon: String = UpgradeSystem.icon_for(cat_id)
	var blurb: String = _shop_blurb(cat_id, str(cat.get("desc", "")))
	var price: int = _upgrade_sys.next_price(cat_id, session.owned_upgrades)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 2)

	if price < 0:
		var btn_max := Button.new()
		btn_max.custom_minimum_size = Vector2(0, 34)
		btn_max.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn_max.add_theme_font_size_override("font_size", 15)
		btn_max.text = "%s  %s  Lv.%d          MAX" % [icon, display_name, lvl]
		btn_max.disabled = true
		UiStyle.apply_action_button(btn_max, UiStyle.TEXT_DIM)
		box.add_child(btn_max)
	else:
		var row_btns := HBoxContainer.new()
		row_btns.add_theme_constant_override("separation", 8)
		var btn_coin := Button.new()
		btn_coin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn_coin.custom_minimum_size = Vector2(0, 34)
		btn_coin.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn_coin.add_theme_font_size_override("font_size", 15)
		btn_coin.text = "%s  %s  Lv.%d    ◆ %s" % [
			icon, display_name, lvl, UpgradeSystem.fmt_coins(price),
		]
		UiStyle.apply_action_button(btn_coin, stripe)
		btn_coin.pressed.connect(_buy.bind(cat_id, false))
		row_btns.add_child(btn_coin)
		if cat_id == "pickaxe":
			var ore_type: int = UpgradeSystem.pickaxe_ore_for_next_level(session.owned_upgrades)
			var ore_name: String = str(GameData.ore_meta(ore_type).get("name", ""))
			var btn_ore := Button.new()
			btn_ore.custom_minimum_size = Vector2(108, 34)
			btn_ore.add_theme_font_size_override("font_size", 14)
			btn_ore.text = "%s×1" % ore_name
			UiStyle.apply_action_button(btn_ore, UiStyle.GOLD)
			btn_ore.pressed.connect(_buy.bind(cat_id, true))
			row_btns.add_child(btn_ore)
		box.add_child(row_btns)

	var sub := Label.new()
	sub.text = blurb
	sub.add_theme_font_size_override("font_size", 12)
	sub.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
	sub.autowrap_mode = TextServer.AUTOWRAP_OFF
	sub.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	box.add_child(sub)

	return box


func _shop_blurb(cat_id: String, fallback: String) -> String:
	var t: String = UpgradeSystem.short_effect(cat_id, int(session.owned_upgrades.get(cat_id, 0)) + 1)
	if t.is_empty():
		return fallback
	return t


func _buy(cat_id: String, use_ore: bool) -> void:
	var result: Dictionary = session.buy_upgrade(cat_id, use_ore)
	if bool(result.get("ok", false)):
		var cost_line: String = "-%s" % UpgradeSystem.fmt_coins(int(result.get("cost", 0)))
		if int(result.get("paid_ore", 0)) > 0:
			var oname: String = str(GameData.ore_meta(int(result.get("paid_ore", 0))).get("name", ""))
			cost_line = "-1×%s" % oname
		var info: Dictionary = UpgradeSystem.success_popup(
			str(result.get("cat_id", cat_id)),
			int(result.get("level", 0)),
			int(result.get("cost", 0)),
		)
		info["cost_line"] = cost_line
		upgrade_popup.show_info(info)
	else:
		var info2: Dictionary = UpgradeSystem.fail_popup(
			str(result.get("reason", "失败")),
			cat_id,
			session.owned_upgrades,
			session.money,
			int(result.get("ore_type", 0)),
		)
		upgrade_popup.show_info(info2)
	_rebuild()


func _on_money_changed(m: int) -> void:
	if visible:
		money_label.text = "◆ %s" % UpgradeSystem.fmt_coins(m)


func _on_scroll_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP or mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			get_viewport().set_input_as_handled()


func _on_panel_gui_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if upgrade_popup.visible:
			upgrade_popup.hide_popup()
		else:
			close_panel()
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP or mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			get_viewport().set_input_as_handled()


func _unhandled_input(event: InputEvent) -> void:
	if not visible:
		return
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if upgrade_popup.visible:
			upgrade_popup.hide_popup()
		else:
			close_panel()
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP or mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			get_viewport().set_input_as_handled()
