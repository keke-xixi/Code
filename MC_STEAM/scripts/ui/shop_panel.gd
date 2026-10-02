extends CanvasLayer

signal closed

@onready var shop_dim: ColorRect = $ShopDim
@onready var panel: PanelContainer = $Panel
@onready var scroll: ScrollContainer = $Panel/Margin/VBox/ScrollFrame/ScrollPad/Scroll
@onready var list: VBoxContainer = $Panel/Margin/VBox/ScrollFrame/ScrollPad/Scroll/List
@onready var money_label: Label = $Panel/Margin/VBox/HeaderRow/MoneyPill/Money
@onready var upgrade_popup: Control = $UpgradePopup

var session: GameSession
var _upgrade_sys: UpgradeSystem = UpgradeSystem.new()


func _ready() -> void:
	visible = false
	shop_dim.visible = false
	_apply_panel_style()
	panel.gui_input.connect(_on_panel_gui_input)
	scroll.gui_input.connect(_on_scroll_gui_input)
	GameEvents.money_changed.connect(_on_money_changed)


func _apply_panel_style() -> void:
	panel.add_theme_stylebox_override("panel", UiStyle.pixel_frame(UiStyle.GOLD))
	var scroll_frame: PanelContainer = $Panel/Margin/VBox/ScrollFrame
	scroll_frame.add_theme_stylebox_override("panel", UiStyle.inner_glow_panel())
	var money_pill: PanelContainer = $Panel/Margin/VBox/HeaderRow/MoneyPill
	money_pill.add_theme_stylebox_override("panel", UiStyle.coin_pill())
	shop_dim.color = Color(0.02, 0.04, 0.08, 0.78)
	shop_dim.mouse_filter = Control.MOUSE_FILTER_STOP


func open(game_session: GameSession) -> void:
	session = game_session
	visible = true
	shop_dim.visible = true
	_rebuild()
	GameEvents.shop_toggled.emit(true)


func close_panel() -> void:
	if upgrade_popup.visible and upgrade_popup.has_method("hide_popup"):
		upgrade_popup.hide_popup()
	visible = false
	shop_dim.visible = false
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


func _make_row(cat: Dictionary) -> PanelContainer:
	var cat_id: String = str(cat.get("id", ""))
	var lvl: int = int(session.owned_upgrades.get(cat_id, 0))
	var display_name: String = UpgradeSystem.display_name_for(cat_id, maxi(lvl, 1))
	if lvl > 0:
		display_name = UpgradeSystem.display_name_for(cat_id, lvl)
	var stripe: Color = UiStyle.stripe_for_category(cat_id)

	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", UiStyle.card_panel(stripe))

	var row := HBoxContainer.new()
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 14)

	var icon := Label.new()
	icon.text = UpgradeSystem.icon_for(cat_id)
	icon.add_theme_font_size_override("font_size", 28)
	icon.custom_minimum_size = Vector2(36, 36)
	icon.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(icon)

	var info := VBoxContainer.new()
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var title := Label.new()
	title.text = "%s   Lv.%d" % [display_name, lvl]
	title.add_theme_font_size_override("font_size", 19)
	title.add_theme_color_override("font_color", UiStyle.TEXT)
	var desc := Label.new()
	desc.text = _shop_blurb(cat_id, str(cat.get("desc", "")))
	desc.add_theme_font_size_override("font_size", 14)
	desc.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.add_child(title)
	info.add_child(desc)
	row.add_child(info)

	var btn := Button.new()
	btn.custom_minimum_size = Vector2(108, 52)
	var price: int = _upgrade_sys.next_price(cat_id, session.owned_upgrades)
	if price < 0:
		btn.text = "MAX"
		btn.disabled = true
		UiStyle.apply_action_button(btn, UiStyle.TEXT_DIM)
	else:
		btn.text = "升级\n%s" % UpgradeSystem.fmt_coins(price)
		UiStyle.apply_action_button(btn, stripe)
		btn.pressed.connect(_buy.bind(cat_id))
	row.add_child(btn)

	card.add_child(row)
	return card


func _shop_blurb(cat_id: String, fallback: String) -> String:
	var t: String = UpgradeSystem.short_effect(cat_id, int(session.owned_upgrades.get(cat_id, 0)) + 1)
	if t.is_empty():
		return fallback
	return t


func _buy(cat_id: String) -> void:
	var result: Dictionary = session.buy_upgrade(cat_id)
	if bool(result.get("ok", false)):
		var info: Dictionary = UpgradeSystem.success_popup(
			str(result.get("cat_id", cat_id)),
			int(result.get("level", 0)),
			int(result.get("cost", 0)),
		)
		upgrade_popup.show_info(info)
	else:
		var info2: Dictionary = UpgradeSystem.fail_popup(
			str(result.get("reason", "失败")),
			cat_id,
			session.owned_upgrades,
			session.money,
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
