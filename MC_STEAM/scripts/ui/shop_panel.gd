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

const CARD_W := 272
const CARD_H := 152
const GRID_GAP := 16

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
	_style_header()
	panel.gui_input.connect(_on_panel_gui_input)
	GameEvents.money_changed.connect(_on_money_changed)
	GameEvents.ore_stock_changed.connect(_on_ore_stock_changed)
	get_viewport().size_changed.connect(_fit_panel_size)
	module_slot.resized.connect(_center_module_grid)
	_fit_panel_size()
	_setup_money_icon()


func _setup_money_icon() -> void:
	var row: Node = money_label.get_parent()
	if row == null or row.get_node_or_null("CoinIcon") != null:
		return
	var icon := UiIcons.money_hud(26.0, false)
	icon.name = "CoinIcon"
	row.add_child(icon)
	row.move_child(icon, money_label.get_index())


func _style_header() -> void:
	var title: Label = panel.get_node_or_null("Margin/VBox/Header/HeaderRow/Title") as Label
	if title != null:
		title.add_theme_color_override("font_color", UiStyle.GOLD)
		title.add_theme_font_size_override("font_size", 22)
	if money_label != null:
		money_label.add_theme_color_override("font_color", UiStyle.COIN)
		money_label.add_theme_font_size_override("font_size", 18)


func _apply_panel_style() -> void:
	panel.add_theme_stylebox_override("panel", UiStyle.favour_popup_frame(UiStyle.GOLD))


func open(game_session: GameSession) -> void:
	session = game_session
	visible = true
	UiJuice.bring_canvas_front(self)
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
	var header_h: float = 40.0
	var vbox_sep: float = 10.0
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
	var pad_x: float = 20.0
	var pad_y: float = 16.0
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


func _effect_lines(cat_id: String, lvl: int) -> PackedStringArray:
	var cat: Dictionary = UpgradeSystem.catalog_entry(cat_id)
	var base_desc: String = str(cat.get("desc", ""))
	var lines: PackedStringArray = PackedStringArray()
	if lvl <= 0:
		lines.append(base_desc)
		var preview: String = UpgradeSystem.short_effect(cat_id, 1)
		if not preview.is_empty():
			lines.append("升级后：%s" % preview)
	else:
		var cur: String = UpgradeSystem.short_effect(cat_id, lvl)
		lines.append(cur if not cur.is_empty() else base_desc)
		var price: int = _upgrade_sys.next_price(cat_id, session.owned_upgrades)
		if price >= 0:
			var nxt: String = UpgradeSystem.short_effect(cat_id, lvl + 1)
			if not nxt.is_empty():
				lines.append("下一级：%s" % nxt)
		else:
			lines.append("已满级")
	return lines


func _make_module_card(mod: Dictionary) -> PanelContainer:
	var cat_id: String = str(mod.get("id", ""))
	var short_label: String = str(mod.get("label", ""))
	var lvl: int = int(session.owned_upgrades.get(cat_id, 0))
	var stripe: Color = UiStyle.stripe_for_category(cat_id)
	var icon: String = UpgradeSystem.icon_for(cat_id)
	var price: int = _upgrade_sys.next_price(cat_id, session.owned_upgrades)
	var can_coin: bool = session.can_afford_upgrade_coins(cat_id)
	var can_ore: bool = cat_id == "pickaxe" and session.can_afford_pickaxe_ore()
	var can_any: bool = can_coin or can_ore

	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(CARD_W, CARD_H)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	card.add_theme_stylebox_override("panel", UiStyle.shop_module_card(UiStyle.OK if can_any else stripe))
	card.tooltip_text = ("可升级 · " + short_label) if can_any else short_label

	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 8)
	card.add_child(root)

	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 10)
	root.add_child(head)

	var icon_lbl := Label.new()
	icon_lbl.text = icon
	icon_lbl.add_theme_font_size_override("font_size", 30)
	head.add_child(icon_lbl)

	var title_col := VBoxContainer.new()
	title_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_col.add_theme_constant_override("separation", 2)
	head.add_child(title_col)

	var name_row := HBoxContainer.new()
	name_row.add_theme_constant_override("separation", 8)
	title_col.add_child(name_row)

	var name_lbl := Label.new()
	name_lbl.text = short_label
	name_lbl.add_theme_font_size_override("font_size", 17)
	name_lbl.add_theme_color_override("font_color", UiStyle.TEXT)
	name_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	name_row.add_child(name_lbl)

	if can_any:
		var tip := Label.new()
		tip.text = "可升级"
		tip.add_theme_font_size_override("font_size", 12)
		tip.add_theme_color_override("font_color", UiStyle.OK)
		tip.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		name_row.add_child(tip)

	var lv_chip := Label.new()
	lv_chip.text = "Lv.%d" % lvl
	lv_chip.add_theme_font_size_override("font_size", 13)
	lv_chip.add_theme_color_override("font_color", stripe.lightened(0.25))
	title_col.add_child(lv_chip)

	var body := VBoxContainer.new()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body.add_theme_constant_override("separation", 3)
	root.add_child(body)
	var lines: PackedStringArray = _effect_lines(cat_id, lvl)
	for i in range(lines.size()):
		var line := Label.new()
		line.text = lines[i]
		line.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		line.add_theme_font_size_override("font_size", 13 if i == 0 else 12)
		line.add_theme_color_override(
			"font_color",
			UiStyle.TEXT if i == 0 else UiStyle.TEXT_DIM
		)
		body.add_child(line)

	var foot := HBoxContainer.new()
	foot.alignment = BoxContainer.ALIGNMENT_CENTER
	foot.add_theme_constant_override("separation", 8)
	root.add_child(foot)

	if price < 0:
		var max_btn := Button.new()
		max_btn.text = "已满级"
		max_btn.disabled = true
		max_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		max_btn.custom_minimum_size = Vector2(0, 40)
		UiStyle.apply_shop_card_button(max_btn, UiStyle.TEXT_DIM)
		foot.add_child(max_btn)
	else:
		var coin_btn := Button.new()
		coin_btn.text = (
			"可升级  %s" % UpgradeSystem.fmt_coins(price)
			if can_coin
			else "升级  %s" % UpgradeSystem.fmt_coins(price)
		)
		coin_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		coin_btn.custom_minimum_size = Vector2(0, 40)
		coin_btn.add_theme_font_size_override("font_size", 15)
		UiStyle.apply_shop_card_button(coin_btn, UiStyle.OK if can_coin else stripe)
		coin_btn.pressed.connect(_buy.bind(cat_id, false))
		foot.add_child(coin_btn)
		if cat_id == "pickaxe":
			foot.add_child(_make_ore_pay_button(cat_id, can_ore))

	return card


func _make_ore_pay_button(cat_id: String, can_ore: bool) -> Button:
	var ore_type: int = UpgradeSystem.pickaxe_ore_for_next_level(session.owned_upgrades)
	var meta: Dictionary = GameData.ore_meta(ore_type)
	var ore_name: String = str(meta.get("name", ""))
	var ore_col: Color = meta.get("color", UiStyle.GOLD)
	var ore_btn := Button.new()
	ore_btn.text = ""
	ore_btn.tooltip_text = ("可升级 · 用 1×%s" % ore_name) if can_ore else ("用 1×%s 升级" % ore_name)
	ore_btn.custom_minimum_size = Vector2(56, 40)
	UiStyle.apply_shop_card_button(ore_btn, UiStyle.OK if can_ore else ore_col)
	ore_btn.modulate = Color(1, 1, 1, 1.0) if can_ore else Color(1, 1, 1, 0.72)
	ore_btn.pressed.connect(_buy.bind(cat_id, true))
	var wrap := CenterContainer.new()
	wrap.set_anchors_preset(Control.PRESET_FULL_RECT)
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ore_btn.add_child(wrap)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 2)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	wrap.add_child(row)
	row.add_child(OreBagIcon.new(ore_type, 28.0))
	var qty := Label.new()
	qty.text = "×1"
	qty.add_theme_font_size_override("font_size", 13)
	qty.add_theme_color_override("font_color", UiStyle.OK if can_ore else UiStyle.TEXT)
	qty.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(qty)
	return ore_btn


func _buy(cat_id: String, use_ore: bool) -> void:
	var result: Dictionary = session.buy_upgrade(cat_id, use_ore)
	if bool(result.get("ok", false)):
		var paid_ore: int = int(result.get("paid_ore", 0))
		var cost_n: int = int(result.get("cost", 0))
		var cost_line: String = "-%s" % UpgradeSystem.fmt_coins(cost_n)
		if paid_ore > 0:
			cost_line = "-1×%s" % str(GameData.ore_meta(paid_ore).get("name", ""))
		var info: Dictionary = UpgradeSystem.success_popup(
			str(result.get("cat_id", cat_id)),
			int(result.get("level", 0)),
			cost_n,
		)
		info["cost_line"] = cost_line
		info["paid_ore"] = paid_ore
		info["cost"] = cost_n if paid_ore <= 0 else 0
		upgrade_popup.show_info(info)
	else:
		# 失败只给一句短提示，不再弹大窗
		var reason: String = str(result.get("reason", "失败"))
		var tip: String = "钱不够"
		if reason == "矿石不足":
			tip = "矿石不够"
		elif reason == "已满级":
			tip = "已满级"
		elif reason != "金币不足" and not reason.is_empty():
			tip = reason
		GameEvents.toast.emit(tip, "warn")
	_rebuild()
	_fit_panel_size()


func _on_money_changed(m: int) -> void:
	if not visible:
		return
	money_label.text = UpgradeSystem.fmt_coins(m)
	_rebuild()
	_fit_panel_size()


func _on_ore_stock_changed() -> void:
	if not visible or session == null:
		return
	_rebuild()
	_fit_panel_size()


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
