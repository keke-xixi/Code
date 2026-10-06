extends CanvasLayer

signal closed

## 商店仅展示四个核心模块（其余升级保留在数据层，后续别处用）
## 2×2 顺序：左上→右上→左下→右下
const SHOP_MODULES: Array[Dictionary] = [
	{"id": "pickaxe", "label": "稿子升级"},
	{"id": "pickup", "label": "范围升级"},
	{"id": "auto_bag", "label": "拾取升级"},
	{"id": "detector", "label": "探测升级"},
]

const CARD_W := 300
const CARD_H := 188
const GRID_GAP := 22

@onready var panel: PanelContainer = $Panel
@onready var module_slot: Control = $Panel/Margin/VBox/ModuleSlot
@onready var money_label: Label = $Panel/Margin/VBox/Header/HeaderRow/Money
@onready var upgrade_popup: Control = $UpgradePopup

var session: GameSession
var _upgrade_sys: UpgradeSystem = UpgradeSystem.new()


func _ready() -> void:
	visible = false
	panel.clip_contents = false
	_apply_panel_style()
	panel.gui_input.connect(_on_panel_gui_input)
	GameEvents.money_changed.connect(_on_money_changed)
	get_viewport().size_changed.connect(_fit_panel_size)
	module_slot.resized.connect(_center_module_grid)
	_fit_panel_size()
	_setup_money_icon()


func _setup_money_icon() -> void:
	var row: Node = money_label.get_parent()
	if row == null or row.get_node_or_null("CoinIcon") != null:
		return
	var icon := UiIcons.coin(22.0, false)
	icon.name = "CoinIcon"
	row.add_child(icon)
	row.move_child(icon, 0)


func _apply_panel_style() -> void:
	panel.add_theme_stylebox_override("panel", _shop_shell_style())


func _shop_shell_style() -> StyleBoxFlat:
	var sb := UiStyle.shop_card_panel()
	sb.bg_color = Color("#0e1218", 0.96)
	sb.border_color = Color("#ffffff", 0.22)
	var m: int = 6
	sb.content_margin_left = m
	sb.content_margin_right = m
	sb.content_margin_top = m
	sb.content_margin_bottom = m
	return sb


func open(game_session: GameSession) -> void:
	session = game_session
	visible = true
	_rebuild()
	_fit_panel_size()
	panel.modulate.a = 0.0
	panel.scale = Vector2(0.94, 0.94)
	UiJuice.pop_show(panel)
	GameEvents.shop_toggled.emit(true)


func close_panel() -> void:
	if upgrade_popup.visible and upgrade_popup.has_method("hide_popup"):
		upgrade_popup.hide_popup()
	visible = false
	GameEvents.shop_toggled.emit(false)
	closed.emit()


func _fit_panel_size() -> void:
	var vp: Vector2 = get_viewport().get_visible_rect().size
	var grid := _grid_content_size()
	var margin_box: MarginContainer = panel.get_node("Margin") as MarginContainer
	var ml: float = float(margin_box.get_theme_constant("margin_left"))
	var mr: float = float(margin_box.get_theme_constant("margin_right"))
	var mt: float = float(margin_box.get_theme_constant("margin_top"))
	var mb: float = float(margin_box.get_theme_constant("margin_bottom"))
	var shell: StyleBoxFlat = panel.get_theme_stylebox("panel") as StyleBoxFlat
	var shell_x: float = 0.0
	var shell_y: float = 0.0
	if shell != null:
		shell_x = shell.content_margin_left + shell.content_margin_right
		shell_y = shell.content_margin_top + shell.content_margin_bottom
	var header_h: float = 36.0
	var vbox_sep: float = 14.0
	var w: float = grid.x + ml + mr + shell_x
	var h: float = grid.y + header_h + vbox_sep + mt + mb + shell_y
	w = minf(w, vp.x * 0.92)
	h = minf(h, vp.y * 0.88)
	panel.offset_left = -w * 0.5
	panel.offset_right = w * 0.5
	panel.offset_top = -h * 0.5
	panel.offset_bottom = h * 0.5
	module_slot.custom_minimum_size = Vector2(0, grid.y)
	call_deferred("_center_module_grid")


func _grid_content_size() -> Vector2:
	var card_sb: StyleBoxFlat = UiStyle.shop_card_panel()
	var pad_x: float = card_sb.content_margin_left + card_sb.content_margin_right
	var pad_y: float = card_sb.content_margin_top + card_sb.content_margin_bottom
	var cell_w: float = CARD_W + pad_x
	var cell_h: float = CARD_H + pad_y
	return Vector2(cell_w * 2.0 + GRID_GAP, cell_h * 2.0 + GRID_GAP)


func _rebuild() -> void:
	for c in module_slot.get_children():
		c.queue_free()
	if session == null:
		return
	money_label.text = UpgradeSystem.fmt_coins(session.money)
	var grid_size: Vector2 = _grid_content_size()
	var cards_grid := GridContainer.new()
	cards_grid.columns = 2
	cards_grid.add_theme_constant_override("h_separation", GRID_GAP)
	cards_grid.add_theme_constant_override("v_separation", GRID_GAP)
	cards_grid.custom_minimum_size = grid_size
	module_slot.add_child(cards_grid)
	for mod in SHOP_MODULES:
		var cat: Dictionary = UpgradeSystem.catalog_entry(str(mod.get("id", "")))
		if cat.is_empty():
			continue
		cards_grid.add_child(_make_module_card(mod))
	call_deferred("_center_module_grid")


func _center_module_grid() -> void:
	if module_slot.get_child_count() < 1:
		return
	var grid: Control = module_slot.get_child(0) as Control
	if grid == null:
		return
	var gsize: Vector2 = grid.get_combined_minimum_size()
	grid.size = gsize
	grid.position = (module_slot.size - gsize) * 0.5


func _make_module_card(mod: Dictionary) -> PanelContainer:
	var cat_id: String = str(mod.get("id", ""))
	var short_label: String = str(mod.get("label", ""))
	var lvl: int = int(session.owned_upgrades.get(cat_id, 0))
	var stripe: Color = UiStyle.stripe_for_category(cat_id)
	var icon: String = UpgradeSystem.icon_for(cat_id)
	var price: int = _upgrade_sys.next_price(cat_id, session.owned_upgrades)

	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(CARD_W, CARD_H)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	card.add_theme_stylebox_override("panel", UiStyle.shop_card_panel())
	card.tooltip_text = short_label

	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 8)
	card.add_child(root)

	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 12)
	root.add_child(head)

	var icon_lbl := Label.new()
	icon_lbl.text = icon
	icon_lbl.add_theme_font_size_override("font_size", 38)
	head.add_child(icon_lbl)

	var name_lbl := Label.new()
	name_lbl.text = short_label
	name_lbl.add_theme_font_size_override("font_size", 18)
	name_lbl.add_theme_color_override("font_color", Color(UiStyle.TEXT, 0.9))
	head.add_child(name_lbl)

	var head_spacer := Control.new()
	head_spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(head_spacer)

	var lv_lbl := Label.new()
	lv_lbl.text = "Lv.%d" % lvl
	lv_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	lv_lbl.add_theme_font_size_override("font_size", 17)
	lv_lbl.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
	head.add_child(lv_lbl)

	var slot := PanelContainer.new()
	slot.custom_minimum_size = Vector2(0, 64)
	slot.size_flags_vertical = Control.SIZE_EXPAND_FILL
	slot.add_theme_stylebox_override("panel", UiStyle.shop_card_slot())
	root.add_child(slot)

	var foot := HBoxContainer.new()
	foot.alignment = BoxContainer.ALIGNMENT_CENTER
	foot.add_theme_constant_override("separation", 12)
	root.add_child(foot)

	if price < 0:
		var max_btn := Button.new()
		max_btn.text = "MAX"
		max_btn.disabled = true
		max_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		max_btn.custom_minimum_size = Vector2(0, 48)
		UiStyle.apply_shop_card_button(max_btn, UiStyle.TEXT_DIM)
		foot.add_child(max_btn)
	else:
		var coin_btn := Button.new()
		coin_btn.text = "+%s" % UpgradeSystem.fmt_coins(price)
		coin_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		coin_btn.custom_minimum_size = Vector2(0, 48)
		coin_btn.add_theme_font_size_override("font_size", 17)
		UiStyle.apply_shop_card_button(coin_btn, stripe)
		coin_btn.pressed.connect(_buy.bind(cat_id, false))
		foot.add_child(coin_btn)
		if cat_id == "pickaxe":
			var ore_type: int = UpgradeSystem.pickaxe_ore_for_next_level(session.owned_upgrades)
			var ore_name: String = str(GameData.ore_meta(ore_type).get("name", ""))
			var ore_btn := Button.new()
			ore_btn.text = "×1"
			ore_btn.tooltip_text = ore_name
			ore_btn.custom_minimum_size = Vector2(64, 48)
			ore_btn.add_theme_font_size_override("font_size", 17)
			UiStyle.apply_shop_card_button(ore_btn, GameData.ore_meta(ore_type).get("color", UiStyle.GOLD))
			ore_btn.pressed.connect(_buy.bind(cat_id, true))
			foot.add_child(ore_btn)

	return card


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
	_fit_panel_size()


func _on_money_changed(m: int) -> void:
	if visible:
		money_label.text = UpgradeSystem.fmt_coins(m)


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
