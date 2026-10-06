extends CanvasLayer

const BASE_HINT := "WASD · B · O · F5"
const ORE_BAG_FONT := 22
const ORE_BAG_SWATCH := 34
const GAME_POPUP_HALF_W := 170.0
const GAME_POPUP_HALF_H := 192.0

@onready var money_wrap: PanelContainer = $MoneyWrap
@onready var money_badge: HBoxContainer = $MoneyWrap/MoneyMargin/MoneyBadge
@onready var money_label: Label = $MoneyWrap/MoneyMargin/MoneyBadge/Amount
@onready var coin_fx: CoinFx = $CoinFx
@onready var combo_chip: Label = $ComboChip
@onready var toast_panel: PanelContainer = $ToastPanel
@onready var toast_banner: Label = $ToastPanel/ToastMargin/ToastLabel
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
@onready var ore_trade_open: Button = $OreBag/VBox/TitleRow/TradeOpen
@onready var ore_list: VBoxContainer = $OreBag/VBox/List
@onready var ore_trade_backdrop: ColorRect = $OreTradeBackdrop
@onready var ore_trade_panel: PanelContainer = $OreTradePanel
@onready var ore_trade_list: VBoxContainer = $OreTradePanel/Margin/VBox/TradeList
@onready var ore_trade_confirm_box: PanelContainer = $OreTradePanel/Margin/VBox/ConfirmBox
@onready var ore_trade_confirm_text: Label = $OreTradePanel/Margin/VBox/ConfirmBox/ConfirmMargin/ConfirmVBox/ConfirmText
@onready var ore_trade_confirm_ok: Button = $OreTradePanel/Margin/VBox/ConfirmBox/ConfirmMargin/ConfirmVBox/ConfirmRow/ConfirmOk
@onready var ore_trade_confirm_cancel: Button = $OreTradePanel/Margin/VBox/ConfirmBox/ConfirmMargin/ConfirmVBox/ConfirmRow/ConfirmCancel
@onready var status_fab: Button = $StatusFab
@onready var status_backdrop: ColorRect = $StatusBackdrop
@onready var status_panel: PanelContainer = $StatusPanel
@onready var status_depth_val: Label = $StatusPanel/Margin/VBox/StatGrid/DepthCell/DM/DV/DepthVal
@onready var status_milestone_val: Label = $StatusPanel/Margin/VBox/StatGrid/MilestoneCell/MM/MV/MilestoneVal
@onready var status_pickaxe: Label = $StatusPanel/Margin/VBox/GearCell/GM/GH/Pickaxe
@onready var status_pick_lv: Label = $StatusPanel/Margin/VBox/GearCell/GM/GH/PickLv
@onready var status_keys: Label = $StatusPanel/Margin/VBox/KeysCell/KM/KV/Keys

var _toast_timer: float = 0.0
var _session: GameSession
var _absorb_radius: int = 0
var _absorb_cd: float = 0.0
var _depth_text: String = "深 0"
var _depth_num: int = 0
var _milestone_text: String = "10"
var _pick_name: String = "无镐"
var _pick_lv: int = 0
var _pending_trade_type_id: int = -1
var _popup_busy: bool = false


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
	GameEvents.coins_earned.connect(_on_coins_earned)
	toast_label.modulate.a = 0.0
	toast_label.visible = false
	toast_panel.visible = false
	$Margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint_label.text = BASE_HINT
	absorb_label.visible = false
	_style_bar()
	_style_mine_row()
	_style_status_ui()
	_apply_game_popup_size()
	_setup_money_badge()
	_style_trade_ui()
	tutorial_panel.visible = false
	combo_chip.visible = false
	status_panel.visible = false
	ore_trade_panel.visible = false
	ore_trade_backdrop.visible = false
	mine_row.visible = false
	status_fab.pressed.connect(_toggle_status_panel)
	status_backdrop.gui_input.connect(_on_status_backdrop_input)
	var close_btn: Button = status_panel.get_node("Margin/VBox/CloseRow/Close") as Button
	if close_btn != null:
		UiStyle.apply_action_button(close_btn, UiStyle.CYAN)
		close_btn.add_theme_font_size_override("font_size", 17)
		close_btn.pressed.connect(_close_status_panel)
	var ok_btn: Button = tutorial_panel.get_node_or_null("Margin/VBox/Ok") as Button
	if ok_btn != null:
		UiStyle.apply_action_button(ok_btn, UiStyle.CYAN)
		if not ok_btn.pressed.is_connected(_on_tutorial_ok):
			ok_btn.pressed.connect(_on_tutorial_ok)
	ore_trade_open.pressed.connect(_open_trade_panel)
	ore_trade_backdrop.gui_input.connect(_on_trade_backdrop_input)
	ore_trade_panel.get_node("Margin/VBox/CloseRow/Close").pressed.connect(_close_trade_panel)
	ore_trade_confirm_cancel.pressed.connect(_hide_trade_confirm)
	ore_trade_confirm_ok.pressed.connect(_execute_pending_trade)
	_refresh_status_panel()
	_start_status_fab_idle()
	_style_ore_bag()


func _start_status_fab_idle() -> void:
	pass


func _icon_only_hover(btn: Button) -> void:
	btn.mouse_entered.connect(func() -> void:
		btn.modulate = Color(1.15, 1.15, 1.1, 1.0)
		btn.scale = Vector2(1.08, 1.08)
	)
	btn.mouse_exited.connect(func() -> void:
		btn.modulate = Color.WHITE
		btn.scale = Vector2.ONE
	)
	btn.button_down.connect(func() -> void:
		btn.scale = Vector2(0.92, 0.92)
	)
	btn.button_up.connect(func() -> void:
		btn.scale = Vector2(1.05, 1.05)
	)


func _style_ore_bag() -> void:
	var title_row: HBoxContainer = $OreBag/VBox/TitleRow as HBoxContainer
	var title: Label = $OreBag/VBox/TitleRow/Title as Label
	if title != null:
		title.add_theme_color_override("font_color", UiStyle.COIN)
	if title_row != null and title_row.get_node_or_null("BagIcon") == null:
		var bag_icon: Control = UiIcons.bag(32.0)
		bag_icon.name = "BagIcon"
		title_row.add_child(bag_icon)
		title_row.move_child(bag_icon, 0)


func _style_status_ui() -> void:
	status_panel.add_theme_stylebox_override("panel", UiStyle.favour_popup_frame(UiStyle.CYAN))
	status_panel.get_node("Margin/VBox/StatGrid/DepthCell").add_theme_stylebox_override(
		"panel", UiStyle.game_inset_block(UiStyle.CYAN)
	)
	status_panel.get_node("Margin/VBox/StatGrid/MilestoneCell").add_theme_stylebox_override(
		"panel", UiStyle.game_inset_block(UiStyle.CYAN)
	)
	status_panel.get_node("Margin/VBox/GearCell").add_theme_stylebox_override(
		"panel", UiStyle.game_inset_block(UiStyle.GOLD)
	)
	status_panel.get_node("Margin/VBox/KeysCell").add_theme_stylebox_override(
		"panel", UiStyle.game_inset_block(Color("#5a6270"))
	)
	var title: Label = status_panel.get_node("Margin/VBox/Title") as Label
	if title != null:
		title.add_theme_color_override("font_color", UiStyle.GOLD)
		title.add_theme_font_size_override("font_size", 22)
	var st_vbox: VBoxContainer = status_panel.get_node("Margin/VBox") as VBoxContainer
	if st_vbox != null and st_vbox.get_node_or_null("TitleBar") == null and title != null:
		var bar := PanelContainer.new()
		bar.name = "TitleBar"
		bar.add_theme_stylebox_override("panel", UiStyle.favour_popup_title_bar(UiStyle.CYAN))
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		row.alignment = BoxContainer.ALIGNMENT_CENTER
		bar.add_child(row)
		row.add_child(UiIcons.status(22.0))
		title.get_parent().remove_child(title)
		row.add_child(title)
		st_vbox.add_child(bar)
		st_vbox.move_child(bar, 0)
	var close_btn: Button = status_panel.get_node("Margin/VBox/CloseRow/Close") as Button
	if close_btn != null:
		UiStyle.apply_action_button(close_btn, UiStyle.CYAN)
	status_fab.custom_minimum_size = Vector2(48, 48)
	status_fab.tooltip_text = "状态 · 深度 · 快捷键"
	UiStyle.apply_icon_only_button(status_fab)
	_set_button_glyph(status_fab, UiIcons.status(38.0))
	_icon_only_hover(status_fab)


func _apply_game_popup_size() -> void:
	for panel in [status_panel, ore_trade_panel]:
		panel.offset_left = -GAME_POPUP_HALF_W
		panel.offset_right = GAME_POPUP_HALF_W
		panel.offset_top = -GAME_POPUP_HALF_H
		panel.offset_bottom = GAME_POPUP_HALF_H


func _setup_money_badge() -> void:
	money_wrap.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	var slot: Control = money_badge.get_node_or_null("CoinSlot") as Control
	if slot == null:
		slot = CenterContainer.new()
		slot.name = "CoinSlot"
		slot.custom_minimum_size = Vector2(52, 52)
		money_badge.add_child(slot)
		money_badge.move_child(slot, 0)
	for c in slot.get_children():
		c.queue_free()
	slot.add_child(UiIcons.coin(48.0, false))
	toast_panel.add_theme_stylebox_override("panel", UiStyle.game_inset_block(UiStyle.GOLD))


func _set_button_glyph(btn: Button, icon: Control) -> void:
	btn.text = ""
	for c in btn.get_children():
		c.queue_free()
	var wrap := CenterContainer.new()
	wrap.set_anchors_preset(Control.PRESET_FULL_RECT)
	wrap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	btn.add_child(wrap)
	wrap.add_child(icon)


func _style_trade_ui() -> void:
	ore_trade_open.custom_minimum_size = Vector2(52, 52)
	UiStyle.apply_icon_only_button(ore_trade_open)
	_set_button_glyph(ore_trade_open, UiIcons.exchange(46.0))
	_icon_only_hover(ore_trade_open)
	ore_trade_panel.add_theme_stylebox_override("panel", UiStyle.favour_popup_frame(UiStyle.GOLD))
	ore_trade_confirm_box.add_theme_stylebox_override("panel", UiStyle.game_inset_block(UiStyle.GOLD))
	var trade_title: Label = ore_trade_panel.get_node("Margin/VBox/Title") as Label
	if trade_title != null:
		trade_title.add_theme_color_override("font_color", UiStyle.COIN)
		trade_title.add_theme_font_size_override("font_size", 22)
	var trade_vbox: VBoxContainer = ore_trade_panel.get_node("Margin/VBox") as VBoxContainer
	if trade_vbox != null and trade_vbox.get_node_or_null("TitleBar") == null and trade_title != null:
		var bar := PanelContainer.new()
		bar.name = "TitleBar"
		bar.add_theme_stylebox_override("panel", UiStyle.favour_popup_title_bar(UiStyle.GOLD))
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		row.alignment = BoxContainer.ALIGNMENT_CENTER
		bar.add_child(row)
		row.add_child(UiIcons.exchange(22.0))
		trade_title.get_parent().remove_child(trade_title)
		row.add_child(trade_title)
		trade_vbox.add_child(bar)
		trade_vbox.move_child(bar, 0)
	var sub_row: HBoxContainer = ore_trade_panel.get_node("Margin/VBox/TitleSubRow") as HBoxContainer
	if sub_row != null:
		var sub_arrow: Label = sub_row.get_node_or_null("SubArrow") as Label
		if sub_arrow != null:
			sub_arrow.visible = false
		if sub_row.get_node_or_null("SubArrowGfx") == null and sub_arrow != null:
			var sub_gfx := ExchangeArrow.new(26.0, 16.0)
			sub_gfx.name = "SubArrowGfx"
			sub_gfx.tint = UiStyle.TEXT_DIM.lightened(0.25)
			sub_row.add_child(sub_gfx)
			sub_row.move_child(sub_gfx, sub_arrow.get_index())
	var sub_coin: CenterContainer = ore_trade_panel.get_node(
		"Margin/VBox/TitleSubRow/SubCoinSlot"
	) as CenterContainer
	if sub_coin != null:
		for c in sub_coin.get_children():
			c.queue_free()
		sub_coin.add_child(UiIcons.coin(18.0))
	UiStyle.apply_action_button(ore_trade_confirm_cancel, UiStyle.CYAN)
	UiStyle.apply_action_button(ore_trade_confirm_ok, UiStyle.GOLD)
	UiStyle.apply_action_button(ore_trade_panel.get_node("Margin/VBox/CloseRow/Close") as Button, UiStyle.GOLD)


func bind_session(game_session: GameSession) -> void:
	_session = game_session
	_refresh_absorb_label()
	_refresh_ore_bag()
	_refresh_status_panel()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if ore_trade_confirm_box.visible:
			_hide_trade_confirm()
			get_viewport().set_input_as_handled()
			return
		if ore_trade_panel.visible:
			_close_trade_panel()
			get_viewport().set_input_as_handled()
			return
		if status_panel.visible:
			_close_status_panel()
			get_viewport().set_input_as_handled()


func _toggle_status_panel() -> void:
	if _popup_busy:
		return
	if status_panel.visible:
		_close_status_panel()
	else:
		_refresh_status_panel()
		status_panel.move_to_front()
		status_backdrop.move_to_front()
		status_panel.move_to_front()
		UiJuice.modal_open(status_panel, status_backdrop)
		call_deferred("_animate_status_body")
		status_fab.release_focus()


func _animate_status_body() -> void:
	var grid: Control = status_panel.get_node_or_null("Margin/VBox/StatGrid") as Control
	if grid != null:
		UiJuice.stagger_children(grid, 0.06, 0)


func _close_status_panel() -> void:
	if _popup_busy or not status_panel.visible:
		status_panel.visible = false
		status_backdrop.visible = false
		return
	_popup_busy = true
	UiJuice.modal_close(status_panel, status_backdrop, func() -> void:
		_popup_busy = false
	)


func _on_status_backdrop_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.pressed and mb.button_index == MOUSE_BUTTON_LEFT:
			_close_status_panel()
			get_viewport().set_input_as_handled()


func is_status_open() -> bool:
	return status_panel.visible


func is_trade_open() -> bool:
	return ore_trade_panel.visible


func _open_trade_panel() -> void:
	if _popup_busy:
		return
	_hide_trade_confirm()
	_refresh_trade_list()
	ore_trade_backdrop.move_to_front()
	ore_trade_panel.move_to_front()
	UiJuice.modal_open(ore_trade_panel, ore_trade_backdrop)
	call_deferred("_animate_trade_rows")
	ore_trade_open.release_focus()


func _animate_trade_rows() -> void:
	UiJuice.stagger_children(ore_trade_list, 0.055, 0)


func _close_trade_panel() -> void:
	if _popup_busy or not ore_trade_panel.visible:
		_hide_trade_confirm()
		ore_trade_panel.visible = false
		ore_trade_backdrop.visible = false
		return
	_popup_busy = true
	UiJuice.modal_close(ore_trade_panel, ore_trade_backdrop, func() -> void:
		_popup_busy = false
		_hide_trade_confirm()
	)


func _on_trade_backdrop_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.pressed and mb.button_index == MOUSE_BUTTON_LEFT:
			_close_trade_panel()
			get_viewport().set_input_as_handled()


func _refresh_trade_list() -> void:
	for c in ore_trade_list.get_children():
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
		var unit: int = _session.ore_unit_sell_price(type_id)
		var ore_color: Color = meta.get("color", Color.GRAY)
		var card := PanelContainer.new()
		card.add_theme_stylebox_override("panel", UiStyle.game_inset_block(Color("#1a2030")))
		var card_m := MarginContainer.new()
		card_m.add_theme_constant_override("margin_left", 10)
		card_m.add_theme_constant_override("margin_right", 10)
		card_m.add_theme_constant_override("margin_top", 8)
		card_m.add_theme_constant_override("margin_bottom", 8)
		card.add_child(card_m)
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		card_m.add_child(row)
		row.add_child(OreBagIcon.new(type_id, 36.0))
		var name_lbl := Label.new()
		name_lbl.text = str(meta.get("name", ""))
		name_lbl.add_theme_font_size_override("font_size", 16)
		name_lbl.custom_minimum_size = Vector2(52, 0)
		row.add_child(name_lbl)
		var cnt_lbl := Label.new()
		cnt_lbl.text = "×%d" % count
		cnt_lbl.add_theme_font_size_override("font_size", 16)
		row.add_child(cnt_lbl)
		var arrow := ExchangeArrow.new(30.0, 20.0)
		arrow.tint = ore_color.lightened(0.35)
		row.add_child(arrow)
		var price_box := HBoxContainer.new()
		price_box.add_theme_constant_override("separation", 5)
		price_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		price_box.alignment = BoxContainer.ALIGNMENT_END
		price_box.add_child(UiIcons.coin(17.0))
		var price_lbl := Label.new()
		price_lbl.text = _fmt(unit * count)
		price_lbl.add_theme_font_size_override("font_size", 16)
		price_lbl.add_theme_color_override("font_color", UiStyle.COIN)
		price_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		price_box.add_child(price_lbl)
		row.add_child(price_box)
		var sell_btn := Button.new()
		sell_btn.custom_minimum_size = Vector2(36, 36)
		sell_btn.focus_mode = Control.FOCUS_NONE
		sell_btn.tooltip_text = "兑换全部"
		sell_btn.pressed.connect(_request_trade_confirm.bind(type_id))
		UiStyle.apply_icon_only_button(sell_btn)
		_set_button_glyph(sell_btn, UiIcons.exchange(28.0))
		_icon_only_hover(sell_btn)
		row.add_child(sell_btn)
		ore_trade_list.add_child(card)
	if not any:
		var empty := Label.new()
		empty.text = "背包里没有可兑换的矿石"
		empty.add_theme_font_size_override("font_size", 16)
		empty.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
		ore_trade_list.add_child(empty)


func _request_trade_confirm(type_id: int) -> void:
	if _session == null:
		return
	var count: int = _session.ore_count(type_id)
	if count <= 0:
		return
	var meta: Dictionary = GameData.ore_meta(type_id)
	var unit: int = _session.ore_unit_sell_price(type_id)
	var est: int = unit * count
	_pending_trade_type_id = type_id
	ore_trade_confirm_text.text = (
		"%s ×%d  →  约 %s 金币\n（单价 %s，连击可加成）"
		% [str(meta.get("name", "")), count, _fmt(est), _fmt(unit)]
	)
	ore_trade_confirm_box.visible = true


func _hide_trade_confirm() -> void:
	_pending_trade_type_id = -1
	ore_trade_confirm_box.visible = false


func _execute_pending_trade() -> void:
	if _session == null or _pending_trade_type_id < 0:
		_hide_trade_confirm()
		return
	var type_id: int = _pending_trade_type_id
	var have: int = _session.ore_count(type_id)
	if have <= 0:
		_hide_trade_confirm()
		_refresh_trade_list()
		return
	var res: Dictionary = _session.sell_ore(type_id, have)
	_hide_trade_confirm()
	if bool(res.get("ok", false)):
		_on_toast("%s ×%d → +%s 金币" % [res.get("name", ""), res.get("sold", 0), _fmt(int(res.get("coins", 0)))], "ok")
	else:
		_on_toast(str(res.get("reason", "兑换失败")), "warn")
	_refresh_trade_list()


func _refresh_status_panel() -> void:
	status_depth_val.text = str(_depth_num)
	status_milestone_val.text = _milestone_text
	status_pickaxe.text = "⛏ %s" % _pick_name
	status_pick_lv.text = "Lv.%d" % _pick_lv
	var keys: String = BASE_HINT
	if _absorb_radius > 0:
		keys += " · E"
	status_keys.text = keys


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
		var a: float = clampf(_toast_timer / 1.35, 0.0, 1.0)
		toast_panel.modulate.a = a
		if a <= 0.0:
			toast_panel.visible = false
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
		_refresh_status_panel()
		return
	absorb_label.visible = false
	hint_label.text = BASE_HINT
	_refresh_status_panel()


func _on_mining_progress(_grid_pos: Vector2i, progress: float, _ore_color: Color) -> void:
	mine_row.visible = true
	mine_bar.value = clampf(progress * 100.0, 0.0, 100.0)
	mine_label.text = "挖掘中 %d%%" % int(round(progress * 100.0))


func _on_mining_finished() -> void:
	mine_row.visible = false
	mine_bar.value = 0.0
	mine_label.text = ""


func _on_money(amount: int) -> void:
	money_label.text = _fmt(amount)
	UiJuice.punch(money_wrap as Control, 1.1)


func _on_coins_earned(amount: int) -> void:
	var from: Vector2
	if ore_trade_panel.visible:
		from = ore_trade_panel.get_global_rect().get_center()
	else:
		from = get_viewport().get_visible_rect().get_center() + Vector2(0, 40)
	coin_fx.fly_to_badge(from, money_wrap, amount)


func _on_depth(depth: int, max_d: int) -> void:
	_depth_num = depth
	var next_m: int = GameData.next_depth_milestone(depth)
	if next_m > depth:
		_depth_text = "深 %d · 下段 %d" % [depth, next_m]
		_milestone_text = str(next_m)
	else:
		_depth_text = "深 %d / %d" % [depth, max_d]
		_milestone_text = "满"
	depth_label.text = _depth_text
	_refresh_status_panel()


func _on_layer(title: String, progress: float) -> void:
	layer_label.text = title
	layer_bar.value = progress * 100.0


func _on_combo(stacks: int, bonus: float) -> void:
	if stacks <= 1:
		combo_label.text = ""
	else:
		combo_label.text = "连击 x%d · 兑换 +%d%%" % [stacks, int(round(bonus * 100.0))]
	combo_chip.visible = false


func _refresh_ore_bag() -> void:
	for c in ore_list.get_children():
		c.queue_free()
	if ore_trade_panel.visible:
		_refresh_trade_list()
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
		row.add_child(OreBagIcon.new(type_id, float(ORE_BAG_SWATCH)))
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
	_pick_name = pickaxe_name
	_pick_lv = pickaxe_level
	var dia: float = GameData.ore_mine_sec(5, pickaxe_level)
	gear_label.text = "⛏ %s · 土 %.1fs · 钻 %.1fs" % [pickaxe_name, dirt_sec, dia]
	_refresh_status_panel()


func _on_toast(message: String, kind: String) -> void:
	if message.is_empty():
		return
	toast_banner.text = message
	var col: Color = Color("#ffe566") if kind == "ok" else Color("#ffaa88")
	toast_banner.add_theme_color_override("font_color", col)
	toast_panel.visible = true
	toast_panel.modulate.a = 0.0
	toast_panel.scale = Vector2(0.92, 0.92)
	UiJuice.pop_show(toast_panel)
	_toast_timer = 1.35


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
