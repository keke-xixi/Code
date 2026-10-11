extends CanvasLayer

const BASE_HINT := "WASD · B · O · F5"
const UPGRADE_READY_HINT := "WASD · B · O · F5 · 可升级"
const ORE_BAG_FONT := 22
const ORE_BAG_SWATCH := 40
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
@onready var mine_label: Label = $MineRow/Margin/VBox/MineLabel
@onready var mine_bar: ProgressBar = $MineRow/Margin/VBox/BarWrap/MineBar
@onready var mine_pct: Label = $MineRow/Margin/VBox/BarWrap/MinePct
@onready var tutorial_panel: PanelContainer = $TutorialPanel
@onready var ore_trade_open: Button = $OreBag/VBox/TitleRow/TradeOpen
@onready var ore_list: VBoxContainer = $OreBag/VBox/List
@onready var ore_trade_backdrop: ColorRect = $OreTradeBackdrop
@onready var ore_trade_panel: PanelContainer = $OreTradePanel
@onready var ore_trade_list: VBoxContainer = $OreTradePanel/Margin/VBox/TradeList
@onready var ore_trade_confirm_backdrop: ColorRect = $OreTradeConfirmBackdrop
@onready var ore_trade_confirm_panel: PanelContainer = $OreTradeConfirmPanel
@onready var ore_trade_confirm_text: Label = $OreTradeConfirmPanel/ConfirmMargin/ConfirmVBox/ConfirmText
@onready var ore_trade_confirm_ok: Button = (
	$OreTradeConfirmPanel/ConfirmMargin/ConfirmVBox/ConfirmRow/ConfirmOk
)
@onready var ore_trade_confirm_cancel: Button = (
	$OreTradeConfirmPanel/ConfirmMargin/ConfirmVBox/ConfirmRow/ConfirmCancel
)
@onready var ore_trade_confirm_spin: SpinBox = (
	$OreTradeConfirmPanel/ConfirmMargin/ConfirmVBox/ConfirmQtyRow/QtySpin
)
@onready var ore_trade_confirm_qty_minus: Button = (
	$OreTradeConfirmPanel/ConfirmMargin/ConfirmVBox/ConfirmQtyRow/QtyMinus
)
@onready var ore_trade_confirm_qty_plus: Button = (
	$OreTradeConfirmPanel/ConfirmMargin/ConfirmVBox/ConfirmQtyRow/QtyPlus
)
@onready var ore_trade_confirm_qty_max: Button = (
	$OreTradeConfirmPanel/ConfirmMargin/ConfirmVBox/ConfirmQtyRow/QtyMax
)
@onready var status_fab: Button = $StatusFab
@onready var status_backdrop: ColorRect = $StatusBackdrop
@onready var status_panel: PanelContainer = $StatusPanel
@onready var status_depth_val: Label = $StatusPanel/Margin/VBox/StatGrid/DepthCell/DM/DV/DepthVal
@onready var status_milestone_val: Label = $StatusPanel/Margin/VBox/StatGrid/MilestoneCell/MM/MV/MilestoneVal
@onready var status_pickaxe: Label = $StatusPanel/Margin/VBox/GearCell/GM/GV/GH/Pickaxe
@onready var status_pick_lv: Label = $StatusPanel/Margin/VBox/GearCell/GM/GV/GH/PickLv
@onready var status_gear_hint: Label = $StatusPanel/Margin/VBox/GearCell/GM/GV/GearHint
@onready var status_keys: Label = $StatusPanel/Margin/VBox/KeysCell/KM/KV/Keys
@onready var status_key_chips: HFlowContainer = $StatusPanel/Margin/VBox/KeysCell/KM/KV/KeyChips
@onready var status_title_sub: Label = $StatusPanel/Margin/VBox/TitleSub
@onready var status_mile_bar: ProgressBar = $StatusPanel/Margin/VBox/MileBar
@onready var status_mile_hint: Label = $StatusPanel/Margin/VBox/MileHint

var _toast_timer: float = 0.0
var _session: GameSession
var _absorb_radius: int = 0
var _absorb_cd: float = 0.0
var _depth_text: String = "深 0"
var _depth_num: int = 0
var _max_depth_seen: int = 0
var _milestone_text: String = "10"
var _milestone_target: int = 10
var _pick_name: String = "无镐"
var _pick_lv: int = 0
var _dirt_mine_sec: float = 1.0
var _layer_title: String = "地表"
var _layer_progress: float = 0.0
var _pending_trade_type_id: int = -1
var _pending_trade_max_count: int = 0
var _popup_busy: bool = false
var _trade_confirm_busy: bool = false
var _status_keys_built: bool = false
var _trade_row_by_type: Dictionary = {}
var _trade_rows_prewarmed: bool = false
var _upgrade_ready_notified: bool = false


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
	ore_trade_confirm_panel.visible = false
	ore_trade_confirm_backdrop.visible = false
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
	ore_trade_confirm_backdrop.gui_input.connect(_on_trade_confirm_backdrop_input)
	ore_trade_confirm_spin.value_changed.connect(_on_trade_confirm_qty_changed)
	ore_trade_confirm_qty_minus.pressed.connect(_bump_trade_confirm_qty.bind(-1))
	ore_trade_confirm_qty_plus.pressed.connect(_bump_trade_confirm_qty.bind(1))
	ore_trade_confirm_qty_max.pressed.connect(_set_trade_confirm_qty_max)
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
		var bag_icon: Control = UiIcons.bag(36.0)
		bag_icon.name = "BagIcon"
		title_row.add_child(bag_icon)
		title_row.move_child(bag_icon, 0)


func _style_status_ui() -> void:
	status_panel.add_theme_stylebox_override("panel", UiStyle.favour_popup_frame(UiStyle.CYAN))
	# 区块用轻卡片，去掉左侧色条 / 硬分隔线
	status_panel.get_node("Margin/VBox/StatGrid/DepthCell").add_theme_stylebox_override(
		"panel", UiStyle.soft_card(UiStyle.GOLD)
	)
	status_panel.get_node("Margin/VBox/StatGrid/MilestoneCell").add_theme_stylebox_override(
		"panel", UiStyle.soft_card(UiStyle.CYAN)
	)
	status_panel.get_node("Margin/VBox/GearCell").add_theme_stylebox_override(
		"panel", UiStyle.soft_card(UiStyle.GOLD)
	)
	# 操作区：不套线框，靠芯片本身分组
	status_panel.get_node("Margin/VBox/KeysCell").add_theme_stylebox_override(
		"panel", StyleBoxEmpty.new()
	)
	var title: Label = status_panel.get_node("Margin/VBox/Title") as Label
	if title != null:
		title.add_theme_color_override("font_color", UiStyle.GOLD)
		title.add_theme_font_size_override("font_size", 22)
	var st_vbox: VBoxContainer = status_panel.get_node("Margin/VBox") as VBoxContainer
	if st_vbox != null:
		st_vbox.add_theme_constant_override("separation", 10)
	if st_vbox != null and title != null:
		var bar: PanelContainer = st_vbox.get_node_or_null("TitleBar") as PanelContainer
		if bar == null:
			bar = PanelContainer.new()
			bar.name = "TitleBar"
			bar.add_theme_stylebox_override("panel", UiStyle.favour_popup_title_soft())
			var row := HBoxContainer.new()
			row.name = "Row"
			row.add_theme_constant_override("separation", 8)
			row.alignment = BoxContainer.ALIGNMENT_CENTER
			bar.add_child(row)
			row.add_child(UiIcons.status_mark(26.0))
			title.get_parent().remove_child(title)
			row.add_child(title)
			st_vbox.add_child(bar)
			st_vbox.move_child(bar, 0)
		else:
			bar.add_theme_stylebox_override("panel", UiStyle.favour_popup_title_soft())
			var row2: HBoxContainer = bar.get_node_or_null("Row") as HBoxContainer
			if row2 != null:
				for c in row2.get_children():
					if c != title:
						c.queue_free()
				row2.add_child(UiIcons.status_mark(26.0))
				row2.move_child(row2.get_child(row2.get_child_count() - 1), 0)
	if status_title_sub != null:
		status_title_sub.add_theme_color_override("font_color", UiStyle.CYAN)
	_style_status_mile_bar()
	_build_status_key_chips()
	var close_btn: Button = status_panel.get_node("Margin/VBox/CloseRow/Close") as Button
	if close_btn != null:
		UiStyle.apply_action_button(close_btn, UiStyle.CYAN)
	status_fab.custom_minimum_size = Vector2(56, 56)
	status_fab.tooltip_text = "状态 · 深度 · 操作"
	UiStyle.apply_icon_only_button(status_fab)
	_set_button_glyph(status_fab, UiIcons.status(52.0))
	_icon_only_hover(status_fab)


func _style_status_mile_bar() -> void:
	if status_mile_bar == null:
		return
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color("#121820", 0.95)
	bg.corner_radius_top_left = 4
	bg.corner_radius_top_right = 4
	bg.corner_radius_bottom_left = 4
	bg.corner_radius_bottom_right = 4
	var fill := StyleBoxFlat.new()
	fill.bg_color = UiStyle.CYAN
	fill.corner_radius_top_left = 4
	fill.corner_radius_top_right = 4
	fill.corner_radius_bottom_left = 4
	fill.corner_radius_bottom_right = 4
	status_mile_bar.add_theme_stylebox_override("background", bg)
	status_mile_bar.add_theme_stylebox_override("fill", fill)


func _build_status_key_chips() -> void:
	if status_key_chips == null or _status_keys_built:
		return
	_status_keys_built = true
	if status_keys != null:
		status_keys.visible = false
	for c in status_key_chips.get_children():
		c.queue_free()
	var items: Array = [
		["WASD", "移动"],
		["鼠标", "点邻格"],
		["B", "工坊"],
		["O", "设置"],
		["F5", "存档"],
	]
	if _absorb_radius > 0:
		items.append(["E", "吸纳"])
	for it in items:
		status_key_chips.add_child(_make_status_key_chip(str(it[0]), str(it[1])))


func _rebuild_status_key_chips() -> void:
	_status_keys_built = false
	_build_status_key_chips()


func _make_status_key_chip(key: String, desc: String) -> PanelContainer:
	var chip := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#151c28", 0.96)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(UiStyle.CYAN, 0.28)
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	sb.content_margin_left = 8
	sb.content_margin_right = 8
	sb.content_margin_top = 5
	sb.content_margin_bottom = 5
	chip.add_theme_stylebox_override("panel", sb)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 6)
	chip.add_child(row)
	var k := Label.new()
	k.text = key
	k.add_theme_font_size_override("font_size", 13)
	k.add_theme_color_override("font_color", UiStyle.COIN)
	row.add_child(k)
	var d := Label.new()
	d.text = desc
	d.add_theme_font_size_override("font_size", 12)
	d.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
	row.add_child(d)
	return chip


func _apply_game_popup_size() -> void:
	# 状态：宽度固定、高度随内容（避免底部空洞）
	status_panel.set_anchors_preset(Control.PRESET_CENTER)
	status_panel.offset_left = -188.0
	status_panel.offset_right = 188.0
	status_panel.offset_top = 0.0
	status_panel.offset_bottom = 0.0
	status_panel.custom_minimum_size = Vector2(376, 0)
	status_panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	ore_trade_panel.offset_left = -GAME_POPUP_HALF_W
	ore_trade_panel.offset_right = GAME_POPUP_HALF_W
	ore_trade_panel.offset_top = -GAME_POPUP_HALF_H
	ore_trade_panel.offset_bottom = GAME_POPUP_HALF_H


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
	slot.add_child(UiIcons.money_hud(48.0, false))
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
	_set_button_glyph(ore_trade_open, UiIcons.exchange(40.0))
	_icon_only_hover(ore_trade_open)
	ore_trade_panel.add_theme_stylebox_override("panel", UiStyle.favour_popup_frame(UiStyle.GOLD))
	ore_trade_confirm_panel.add_theme_stylebox_override("panel", UiStyle.favour_popup_frame(UiStyle.GOLD))
	# 加宽加高，装下 8 行宽松矿石卡
	ore_trade_panel.custom_minimum_size = Vector2(400, 620)
	ore_trade_panel.offset_left = -200.0
	ore_trade_panel.offset_right = 200.0
	ore_trade_panel.offset_top = -310.0
	ore_trade_panel.offset_bottom = 310.0
	_unwrap_trade_scroll()
	var trade_margin: MarginContainer = ore_trade_panel.get_node("Margin") as MarginContainer
	if trade_margin != null:
		trade_margin.add_theme_constant_override("margin_left", 18)
		trade_margin.add_theme_constant_override("margin_right", 18)
		trade_margin.add_theme_constant_override("margin_top", 16)
		trade_margin.add_theme_constant_override("margin_bottom", 16)
	var trade_title: Label = ore_trade_panel.get_node("Margin/VBox/Title") as Label
	if trade_title != null:
		trade_title.add_theme_color_override("font_color", UiStyle.COIN)
		trade_title.add_theme_font_size_override("font_size", 22)
	var trade_vbox: VBoxContainer = ore_trade_panel.get_node("Margin/VBox") as VBoxContainer
	if trade_vbox != null:
		trade_vbox.add_theme_constant_override("separation", 12)
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
	else:
		# 若已有 TitleBar（上一版钱袋图标），改回兑换图标
		var bar_exist: PanelContainer = trade_vbox.get_node_or_null("TitleBar") as PanelContainer if trade_vbox != null else null
		if bar_exist != null:
			bar_exist.add_theme_stylebox_override("panel", UiStyle.favour_popup_title_bar(UiStyle.GOLD))
			var bar_row: HBoxContainer = bar_exist.get_child(0) as HBoxContainer
			if bar_row != null and bar_row.get_child_count() >= 1:
				var first: Node = bar_row.get_child(0)
				if first != null and first.name != "ExchangeIcon":
					bar_row.remove_child(first)
					first.queue_free()
					var ex: Control = UiIcons.exchange(22.0)
					ex.name = "ExchangeIcon"
					bar_row.add_child(ex)
					bar_row.move_child(ex, 0)
	var sub_row: HBoxContainer = ore_trade_panel.get_node("Margin/VBox/TitleSubRow") as HBoxContainer
	if sub_row != null:
		var sub_arrow: Label = sub_row.get_node_or_null("SubArrow") as Label
		if sub_arrow != null:
			sub_arrow.visible = false
		if sub_row.get_node_or_null("SubArrowGfx") == null and sub_arrow != null:
			var sub_gfx := ExchangeArrow.new(26.0, 16.0, ExchangeArrow.Style.CHEVRON)
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
	ore_trade_list.add_theme_constant_override("separation", 10)
	_invalidate_trade_rows()
	UiStyle.apply_action_button(ore_trade_confirm_cancel, UiStyle.CYAN)
	UiStyle.apply_action_button(ore_trade_confirm_ok, UiStyle.GOLD)
	UiStyle.apply_action_button(ore_trade_confirm_qty_minus, UiStyle.CYAN)
	UiStyle.apply_action_button(ore_trade_confirm_qty_plus, UiStyle.CYAN)
	UiStyle.apply_action_button(ore_trade_confirm_qty_max, UiStyle.GOLD)
	ore_trade_confirm_spin.add_theme_font_size_override("font_size", 15)
	UiStyle.apply_action_button(ore_trade_panel.get_node("Margin/VBox/CloseRow/Close") as Button, UiStyle.GOLD)


func _invalidate_trade_rows() -> void:
	for tid in _trade_row_by_type.keys():
		var old: Node = _trade_row_by_type[tid] as Node
		if old != null and is_instance_valid(old):
			old.queue_free()
	_trade_row_by_type.clear()
	for c in ore_trade_list.get_children():
		if str(c.name).begins_with("Trade_"):
			c.queue_free()
	_trade_rows_prewarmed = false


func _unwrap_trade_scroll() -> void:
	var parent: Node = ore_trade_list.get_parent()
	if parent == null or not (parent is ScrollContainer):
		return
	var grand: Node = parent.get_parent()
	if grand == null:
		return
	var idx: int = parent.get_index()
	parent.remove_child(ore_trade_list)
	grand.remove_child(parent)
	parent.queue_free()
	grand.add_child(ore_trade_list)
	grand.move_child(ore_trade_list, idx)
	ore_trade_list.size_flags_vertical = Control.SIZE_EXPAND_FILL


func bind_session(game_session: GameSession) -> void:
	_session = game_session
	_upgrade_ready_notified = false
	_refresh_absorb_label()
	_refresh_ore_bag()
	_refresh_status_panel()
	_refresh_upgrade_ready_hint()
	call_deferred("_prewarm_trade_rows")


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if ore_trade_confirm_panel.visible:
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


func dismiss_modals() -> void:
	_force_hide_modal(status_panel, status_backdrop)
	_force_hide_modal(ore_trade_panel, ore_trade_backdrop)
	_force_hide_modal(ore_trade_confirm_panel, ore_trade_confirm_backdrop)
	_pending_trade_type_id = -1
	_pending_trade_max_count = 0
	_popup_busy = false
	_trade_confirm_busy = false


func _force_hide_modal(panel: Control, backdrop: ColorRect) -> void:
	if panel == null:
		return
	panel.visible = false
	panel.modulate.a = 1.0
	panel.scale = Vector2.ONE
	panel.rotation = 0.0
	if backdrop != null:
		backdrop.visible = false
		backdrop.modulate.a = 1.0


func _close_peer_overlays() -> void:
	# 商店/设置是独立 CanvasLayer，默认 layer 高于 HUD，需先关掉或抬层
	var root: Node = get_parent()
	if root == null:
		return
	var shop_n: Node = root.get_node_or_null("Shop")
	if shop_n != null and shop_n.visible and shop_n.has_method("close_panel"):
		shop_n.call("close_panel")
	var settings_n: Node = root.get_node_or_null("Settings")
	if settings_n != null and settings_n.visible and settings_n.has_method("close_panel"):
		settings_n.call("close_panel")


func _toggle_status_panel() -> void:
	if _popup_busy:
		return
	if status_panel.visible:
		_close_status_panel()
	else:
		_close_peer_overlays()
		_force_hide_modal(ore_trade_panel, ore_trade_backdrop)
		_force_hide_modal(ore_trade_confirm_panel, ore_trade_confirm_backdrop)
		_refresh_status_panel()
		UiJuice.bring_canvas_front(self)
		status_backdrop.move_to_front()
		status_panel.move_to_front()
		UiJuice.modal_open(status_panel, status_backdrop, false, true)
		status_fab.release_focus()


func _close_status_panel() -> void:
	if _popup_busy or not status_panel.visible:
		_force_hide_modal(status_panel, status_backdrop)
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


## 仅当鼠标在可交互 HUD 上时拦截地图拖拽/点格（全屏 IGNORE 层不挡）
func pointer_blocks_world_input() -> bool:
	if ore_trade_backdrop.visible or status_backdrop.visible or ore_trade_confirm_backdrop.visible:
		return true
	var c: Control = get_viewport().gui_get_hovered_control()
	if c == null:
		return false
	var n: Node = c
	while n != null and n != self:
		if n is Control:
			var ctrl := n as Control
			if not ctrl.visible:
				n = n.get_parent()
				continue
			if ctrl.mouse_filter == Control.MOUSE_FILTER_IGNORE:
				n = n.get_parent()
				continue
			if ctrl == ore_trade_panel and not ore_trade_panel.visible:
				n = n.get_parent()
				continue
			if ctrl == status_panel and not status_panel.visible:
				n = n.get_parent()
				continue
			if ctrl == ore_trade_confirm_panel and not ore_trade_confirm_panel.visible:
				n = n.get_parent()
				continue
			return true
		n = n.get_parent()
	return false


func _open_trade_panel() -> void:
	if _popup_busy:
		return
	if ore_trade_panel.visible:
		_close_trade_panel()
		return
	_close_peer_overlays()
	_force_hide_modal(status_panel, status_backdrop)
	_force_hide_modal(ore_trade_confirm_panel, ore_trade_confirm_backdrop)
	_pending_trade_type_id = -1
	UiJuice.bring_canvas_front(self)
	ore_trade_backdrop.move_to_front()
	ore_trade_panel.move_to_front()
	# 先出壳再刷数，避免首帧卡在建表上
	UiJuice.modal_show_instant(ore_trade_panel, ore_trade_backdrop)
	ore_trade_open.release_focus()
	if _trade_rows_prewarmed:
		_sync_trade_list()
	else:
		call_deferred("_sync_trade_list_after_open")


func _sync_trade_list_after_open() -> void:
	if not ore_trade_panel.visible:
		return
	_prewarm_trade_rows()
	_sync_trade_list()


func _close_trade_panel() -> void:
	if _popup_busy or not ore_trade_panel.visible:
		_force_hide_modal(ore_trade_confirm_panel, ore_trade_confirm_backdrop)
		_force_hide_modal(ore_trade_panel, ore_trade_backdrop)
		_pending_trade_type_id = -1
		return
	_popup_busy = true
	_force_hide_modal(ore_trade_confirm_panel, ore_trade_confirm_backdrop)
	UiJuice.modal_close(ore_trade_panel, ore_trade_backdrop, func() -> void:
		_popup_busy = false
		_pending_trade_type_id = -1
	)


func _on_trade_backdrop_input(event: InputEvent) -> void:
	if ore_trade_confirm_panel.visible:
		return
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.pressed and mb.button_index == MOUSE_BUTTON_LEFT:
			_close_trade_panel()
			get_viewport().set_input_as_handled()


func _on_trade_confirm_backdrop_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.pressed and mb.button_index == MOUSE_BUTTON_LEFT:
			_hide_trade_confirm()
			get_viewport().set_input_as_handled()


func _refresh_trade_list() -> void:
	_sync_trade_list()


func _prewarm_trade_rows() -> void:
	if _trade_rows_prewarmed:
		return
	var type_ids: Array = GameData.ORE_TYPES.keys()
	type_ids.sort()
	for tid_v in type_ids:
		var type_id: int = int(tid_v)
		if _trade_row_by_type.has(type_id):
			continue
		var card: PanelContainer = _make_trade_row(type_id)
		card.visible = false
		_trade_row_by_type[type_id] = card
		ore_trade_list.add_child(card)
	_trade_rows_prewarmed = true


func _sync_trade_list() -> void:
	if _session == null:
		return
	_prewarm_trade_rows()
	var empty_lbl: Label = ore_trade_list.get_node_or_null("EmptyHint") as Label
	var type_ids: Array = GameData.ORE_TYPES.keys()
	type_ids.sort()
	var visible_ids: Dictionary = {}
	var any: bool = false
	for tid_v in type_ids:
		var type_id: int = int(tid_v)
		var count: int = _session.ore_count(type_id)
		var card: PanelContainer = _trade_row_by_type.get(type_id) as PanelContainer
		if count <= 0:
			if card != null:
				card.visible = false
			continue
		any = true
		visible_ids[type_id] = true
		if card == null:
			card = _make_trade_row(type_id)
			_trade_row_by_type[type_id] = card
			ore_trade_list.add_child(card)
		card.visible = true
		_update_trade_row(card, type_id, count)
	for tid in _trade_row_by_type.keys():
		if not visible_ids.has(tid):
			(_trade_row_by_type[tid] as Control).visible = false
	if empty_lbl == null:
		empty_lbl = Label.new()
		empty_lbl.name = "EmptyHint"
		empty_lbl.text = "背包里没有可兑换的矿石"
		empty_lbl.add_theme_font_size_override("font_size", 16)
		empty_lbl.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
		ore_trade_list.add_child(empty_lbl)
	empty_lbl.visible = not any


func _make_trade_row(type_id: int) -> PanelContainer:
	var meta: Dictionary = GameData.ore_meta(type_id)
	var ore_color: Color = meta.get("color", Color.GRAY)
	var card := PanelContainer.new()
	card.name = "Trade_%d" % type_id
	card.set_meta("type_id", type_id)
	card.custom_minimum_size = Vector2(0, 52)
	card.add_theme_stylebox_override("panel", UiStyle.shop_module_card(ore_color))
	var card_m := MarginContainer.new()
	card_m.name = "Margin"
	card_m.add_theme_constant_override("margin_left", 12)
	card_m.add_theme_constant_override("margin_right", 12)
	card_m.add_theme_constant_override("margin_top", 10)
	card_m.add_theme_constant_override("margin_bottom", 10)
	card.add_child(card_m)
	var row := HBoxContainer.new()
	row.name = "Row"
	row.add_theme_constant_override("separation", 10)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	card_m.add_child(row)
	row.add_child(OreBagIcon.new(type_id, 36.0))
	var name_lbl := Label.new()
	name_lbl.name = "Name"
	name_lbl.text = str(meta.get("name", ""))
	name_lbl.add_theme_font_size_override("font_size", 16)
	name_lbl.add_theme_color_override("font_color", UiStyle.TEXT)
	name_lbl.custom_minimum_size = Vector2(64, 0)
	name_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(name_lbl)
	var cnt_lbl := Label.new()
	cnt_lbl.name = "Count"
	cnt_lbl.add_theme_font_size_override("font_size", 16)
	cnt_lbl.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
	cnt_lbl.custom_minimum_size = Vector2(40, 0)
	cnt_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(cnt_lbl)
	var arrow := ExchangeArrow.new(28.0, 18.0, ExchangeArrow.Style.CHEVRON)
	arrow.tint = ore_color.lightened(0.35)
	row.add_child(arrow)
	var price_box := HBoxContainer.new()
	price_box.name = "PriceBox"
	price_box.add_theme_constant_override("separation", 6)
	price_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	price_box.alignment = BoxContainer.ALIGNMENT_END
	price_box.add_child(UiIcons.money_hud(18.0, false))
	var price_lbl := Label.new()
	price_lbl.name = "Price"
	price_lbl.add_theme_font_size_override("font_size", 16)
	price_lbl.add_theme_color_override("font_color", UiStyle.COIN)
	price_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	price_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	price_lbl.custom_minimum_size = Vector2(72, 0)
	price_box.add_child(price_lbl)
	row.add_child(price_box)
	var sell_btn := Button.new()
	sell_btn.custom_minimum_size = Vector2(36, 36)
	sell_btn.focus_mode = Control.FOCUS_NONE
	sell_btn.tooltip_text = "选择数量兑换"
	sell_btn.pressed.connect(_request_trade_confirm.bind(type_id))
	UiStyle.apply_icon_only_button(sell_btn)
	_set_button_glyph(sell_btn, ExchangeArrow.new(26.0, 26.0, ExchangeArrow.Style.CHECK))
	_icon_only_hover(sell_btn)
	row.add_child(sell_btn)
	return card


func _update_trade_row(card: PanelContainer, type_id: int, count: int) -> void:
	var unit: int = _session.ore_unit_sell_price(type_id)
	var cnt: Label = card.get_node_or_null("Margin/Row/Count") as Label
	var price: Label = card.get_node_or_null("Margin/Row/PriceBox/Price") as Label
	if cnt != null:
		cnt.text = "×%d" % count
	if price != null:
		price.text = _fmt(unit * count)


func _request_trade_confirm(type_id: int) -> void:
	if _session == null:
		return
	var count: int = _session.ore_count(type_id)
	if count <= 0:
		return
	_pending_trade_type_id = type_id
	_pending_trade_max_count = count
	ore_trade_confirm_spin.min_value = 1
	ore_trade_confirm_spin.max_value = float(count)
	ore_trade_confirm_spin.value = float(count)
	_refresh_trade_confirm_preview()
	if _trade_confirm_busy or ore_trade_confirm_panel.visible:
		return
	UiJuice.bring_canvas_front(self)
	ore_trade_confirm_backdrop.move_to_front()
	ore_trade_confirm_panel.move_to_front()
	UiJuice.modal_open(ore_trade_confirm_panel, ore_trade_confirm_backdrop, false, true)


func _on_trade_confirm_qty_changed(_value: float) -> void:
	_refresh_trade_confirm_preview()


func _bump_trade_confirm_qty(delta: int) -> void:
	var n: int = int(ore_trade_confirm_spin.value) + delta
	n = clampi(n, 1, maxi(1, _pending_trade_max_count))
	ore_trade_confirm_spin.value = float(n)


func _set_trade_confirm_qty_max() -> void:
	if _pending_trade_max_count > 0:
		ore_trade_confirm_spin.value = float(_pending_trade_max_count)


func _refresh_trade_confirm_preview() -> void:
	if _session == null or _pending_trade_type_id < 0:
		return
	var meta: Dictionary = GameData.ore_meta(_pending_trade_type_id)
	var unit: int = _session.ore_unit_sell_price(_pending_trade_type_id)
	var n: int = clampi(int(ore_trade_confirm_spin.value), 1, maxi(1, _pending_trade_max_count))
	var est: int = unit * n
	ore_trade_confirm_text.text = "%s ×%d  →  约 %s 金币" % [str(meta.get("name", "")), n, _fmt(est)]


func _hide_trade_confirm() -> void:
	if not ore_trade_confirm_panel.visible and _pending_trade_type_id < 0:
		return
	if _trade_confirm_busy:
		return
	_trade_confirm_busy = true
	UiJuice.modal_close(ore_trade_confirm_panel, ore_trade_confirm_backdrop, func() -> void:
		_trade_confirm_busy = false
		_pending_trade_type_id = -1
		_pending_trade_max_count = 0
	)


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
	var want: int = clampi(int(ore_trade_confirm_spin.value), 1, have)
	var res: Dictionary = _session.sell_ore(type_id, want)
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
	if status_title_sub != null:
		status_title_sub.text = "矿层 · %s" % _layer_title
	if status_gear_hint != null:
		status_gear_hint.text = "挖土约 %.1f 秒 · B 开工坊升级" % _dirt_mine_sec
	_refresh_status_mile()
	if status_keys != null:
		var keys: String = BASE_HINT
		if _absorb_radius > 0:
			keys += " · E"
		status_keys.text = keys


func _refresh_status_mile() -> void:
	if status_mile_bar == null:
		return
	var next_m: int = _milestone_target
	if next_m <= _depth_num or _milestone_text == "满":
		status_mile_bar.value = 100.0
		if status_mile_hint != null:
			status_mile_hint.text = "已达当前深度里程碑"
		return
	# 以上一里程碑为起点
	var prev: int = 0
	for m in GameData.DEPTH_MILESTONES:
		if int(m) >= next_m:
			break
		prev = int(m)
	var span: float = float(maxi(1, next_m - prev))
	var prog: float = clampf(float(_depth_num - prev) / span, 0.0, 1.0)
	status_mile_bar.value = prog * 100.0
	if status_mile_hint != null:
		status_mile_hint.text = "距下段还有 %d 层" % maxi(0, next_m - _depth_num)


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
	bg.bg_color = Color("#0a0e14", 0.9)
	bg.border_width_left = 1
	bg.border_width_top = 1
	bg.border_width_right = 1
	bg.border_width_bottom = 1
	bg.border_color = Color(UiStyle.GOLD, 0.45)
	bg.corner_radius_top_left = 14
	bg.corner_radius_top_right = 14
	bg.corner_radius_bottom_left = 14
	bg.corner_radius_bottom_right = 14
	bg.shadow_color = Color(0, 0, 0, 0.35)
	bg.shadow_size = 8
	bg.shadow_offset = Vector2(0, 3)
	mine_row.add_theme_stylebox_override("panel", bg)
	_apply_mine_bar_colors(UiStyle.COIN)
	if mine_label != null:
		mine_label.add_theme_color_override("font_color", UiStyle.COIN)
		mine_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER


func _apply_mine_bar_colors(fill_col: Color) -> void:
	if mine_bar == null:
		return
	var mbg := StyleBoxFlat.new()
	mbg.bg_color = Color("#0c1018", 0.95)
	mbg.corner_radius_top_left = 8
	mbg.corner_radius_top_right = 8
	mbg.corner_radius_bottom_left = 8
	mbg.corner_radius_bottom_right = 8
	mine_bar.add_theme_stylebox_override("background", mbg)
	var mfill := StyleBoxFlat.new()
	mfill.bg_color = fill_col
	mfill.corner_radius_top_left = 8
	mfill.corner_radius_top_right = 8
	mfill.corner_radius_bottom_left = 8
	mfill.corner_radius_bottom_right = 8
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
	var absorb_changed: bool = absorb_radius != _absorb_radius
	_absorb_radius = absorb_radius
	_absorb_cd = absorb_cooldown
	if absorb_changed:
		_rebuild_status_key_chips()
	_refresh_absorb_label()


func _refresh_absorb_label() -> void:
	absorb_label.visible = false
	_sync_hint_label()
	_refresh_status_panel()


func _shop_is_open() -> bool:
	var root: Node = get_parent()
	if root == null:
		return false
	var shop_n: Node = root.get_node_or_null("Shop")
	return shop_n != null and bool(shop_n.visible)


func _sync_hint_label(upgrade_ready: bool = false) -> void:
	if upgrade_ready:
		hint_label.text = UPGRADE_READY_HINT
		hint_label.add_theme_color_override("font_color", UiStyle.OK)
	else:
		hint_label.text = BASE_HINT
		hint_label.remove_theme_color_override("font_color")


func _refresh_upgrade_ready_hint() -> void:
	if _session == null:
		_sync_hint_label(false)
		return
	var ready: bool = _session.any_shop_upgrade_affordable()
	_sync_hint_label(ready)
	if ready and not _upgrade_ready_notified and not _shop_is_open():
		_upgrade_ready_notified = true
		GameEvents.toast.emit("有升级可买 · 按 B 打开工坊", "ok")
	elif not ready:
		_upgrade_ready_notified = false


func _on_mining_progress(_grid_pos: Vector2i, progress: float, ore_color: Color) -> void:
	mine_row.visible = true
	var pct: int = int(round(clampf(progress, 0.0, 1.0) * 100.0))
	mine_bar.value = float(pct)
	mine_label.text = "挖掘中"
	if mine_pct != null:
		mine_pct.text = "%d%%" % pct
	var fill: Color = ore_color if ore_color.a > 0.05 else UiStyle.COIN
	# 过深的矿色提亮，保证进度条可读
	if fill.get_luminance() < 0.35:
		fill = fill.lightened(0.35)
	_apply_mine_bar_colors(fill)


func _on_mining_finished() -> void:
	mine_row.visible = false
	mine_bar.value = 0.0
	mine_label.text = "挖掘中"
	if mine_pct != null:
		mine_pct.text = "0%"


func _on_money(amount: int) -> void:
	money_label.text = _fmt(amount)
	UiJuice.punch(money_wrap as Control, 1.1)
	_refresh_upgrade_ready_hint()


func _on_coins_earned(amount: int) -> void:
	var from: Vector2
	if ore_trade_panel.visible:
		from = ore_trade_panel.get_global_rect().get_center()
	else:
		from = get_viewport().get_visible_rect().get_center() + Vector2(0, 40)
	coin_fx.fly_to_badge(from, money_wrap, amount)


func _on_depth(depth: int, max_d: int) -> void:
	_depth_num = depth
	_max_depth_seen = maxi(_max_depth_seen, max_d)
	var next_m: int = GameData.next_depth_milestone(depth)
	_milestone_target = next_m
	if next_m > depth:
		_depth_text = "深 %d · 下段 %d" % [depth, next_m]
		_milestone_text = str(next_m)
	else:
		_depth_text = "深 %d / %d" % [depth, max_d]
		_milestone_text = "满"
	depth_label.text = _depth_text
	_refresh_status_panel()


func _on_layer(title: String, progress: float) -> void:
	_layer_title = title
	_layer_progress = progress
	layer_label.text = title
	layer_bar.value = progress * 100.0
	_refresh_status_panel()


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
	_refresh_upgrade_ready_hint()
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
	_dirt_mine_sec = dirt_sec
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
