extends CanvasLayer

signal closed

## 商店仅展示四个核心模块（其余升级保留在数据层，后续别处用）
const SHOP_MODULES: Array[Dictionary] = [
	{"id": "pickaxe"},
	{"id": "auto_bag"},
	{"id": "pickup"},
	{"id": "detector"},
]

@onready var panel: PanelContainer = $Panel
@onready var grid: GridContainer = $Panel/Margin/VBox/Grid
@onready var money_label: Label = $Panel/Margin/VBox/Header/Money
@onready var upgrade_popup: Control = $UpgradePopup

var session: GameSession
var _upgrade_sys: UpgradeSystem = UpgradeSystem.new()


func _ready() -> void:
	visible = false
	_apply_panel_style()
	panel.gui_input.connect(_on_panel_gui_input)
	GameEvents.money_changed.connect(_on_money_changed)


func _apply_panel_style() -> void:
	panel.add_theme_stylebox_override("panel", _shop_shell_style())


func _shop_shell_style() -> StyleBoxFlat:
	var sb := UiStyle.shop_card_panel()
	sb.bg_color = Color("#0e1218", 0.96)
	sb.border_color = Color("#ffffff", 0.22)
	sb.content_margin_left = 4
	sb.content_margin_right = 4
	sb.content_margin_top = 4
	sb.content_margin_bottom = 4
	return sb


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
	for c in grid.get_children():
		c.queue_free()
	if session == null:
		return
	money_label.text = "◆ %s" % UpgradeSystem.fmt_coins(session.money)
	for mod in SHOP_MODULES:
		var cat: Dictionary = UpgradeSystem.catalog_entry(str(mod.get("id", "")))
		if cat.is_empty():
			continue
		grid.add_child(_make_module_card(mod, cat))


func _make_module_card(mod: Dictionary, _cat: Dictionary) -> PanelContainer:
	var cat_id: String = str(mod.get("id", ""))
	var lvl: int = int(session.owned_upgrades.get(cat_id, 0))
	var stripe: Color = UiStyle.stripe_for_category(cat_id)
	var icon: String = UpgradeSystem.icon_for(cat_id)
	var price: int = _upgrade_sys.next_price(cat_id, session.owned_upgrades)

	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(380, 168)
	card.add_theme_stylebox_override("panel", UiStyle.shop_card_panel())
	card.tooltip_text = _card_tooltip(cat_id)

	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 6)
	card.add_child(root)

	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 12)
	root.add_child(head)

	var icon_lbl := Label.new()
	icon_lbl.text = icon
	icon_lbl.add_theme_font_size_override("font_size", 36)
	head.add_child(icon_lbl)

	var lv_lbl := Label.new()
	lv_lbl.text = "Lv.%d" % lvl
	lv_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	lv_lbl.add_theme_font_size_override("font_size", 16)
	lv_lbl.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
	head.add_child(lv_lbl)

	var slot := PanelContainer.new()
	slot.custom_minimum_size = Vector2(0, 88)
	slot.size_flags_vertical = Control.SIZE_EXPAND_FILL
	slot.add_theme_stylebox_override("panel", UiStyle.shop_card_slot())
	root.add_child(slot)

	var center := CenterContainer.new()
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	center.size_flags_vertical = Control.SIZE_EXPAND_FILL
	slot.add_child(center)
	var action_box := HBoxContainer.new()
	action_box.add_theme_constant_override("separation", 10)
	center.add_child(action_box)

	if price < 0:
		var max_btn := Button.new()
		max_btn.text = "MAX"
		max_btn.disabled = true
		max_btn.custom_minimum_size = Vector2(100, 48)
		UiStyle.apply_shop_card_button(max_btn, UiStyle.TEXT_DIM)
		action_box.add_child(max_btn)
	else:
		var coin_btn := Button.new()
		coin_btn.text = "◆%s" % UpgradeSystem.fmt_coins(price)
		coin_btn.custom_minimum_size = Vector2(120, 48)
		UiStyle.apply_shop_card_button(coin_btn, stripe)
		coin_btn.pressed.connect(_buy.bind(cat_id, false))
		action_box.add_child(coin_btn)
		if cat_id == "pickaxe":
			var ore_type: int = UpgradeSystem.pickaxe_ore_for_next_level(session.owned_upgrades)
			var ore_name: String = str(GameData.ore_meta(ore_type).get("name", ""))
			var ore_btn := Button.new()
			ore_btn.text = "×1"
			ore_btn.tooltip_text = ore_name
			ore_btn.custom_minimum_size = Vector2(56, 48)
			UiStyle.apply_shop_card_button(ore_btn, GameData.ore_meta(ore_type).get("color", UiStyle.GOLD))
			ore_btn.pressed.connect(_buy.bind(cat_id, true))
			action_box.add_child(ore_btn)

	return card


func _card_tooltip(cat_id: String) -> String:
	match cat_id:
		"pickaxe":
			return "稿子"
		"auto_bag":
			return "自动挖矿"
		"pickup":
			return "挖矿范围"
		"detector":
			return "探测"
		_:
			return ""


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
