extends CanvasLayer

signal request_main_menu

const BASE_HINT := "WASD · B · O · F5"
const UPGRADE_READY_HINT := "WASD · B · O · F5 · 可升级"
const ORE_BAG_FONT := 20
const ORE_BAG_SWATCH := 36
const GAME_POPUP_HALF_W := 170.0
const GAME_POPUP_HALF_H := 192.0
const TRADE_PANEL_W := 680.0
const TRADE_GRID_COLS := 4
const TRADE_CARD_ICON := 56.0

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
@onready var ore_trade_list: Container = $OreTradePanel/Margin/VBox/TradeList
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
@onready var home_fab: Button = $HomeFab
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
var _bootstrapping: bool = false
var _fitting_popup_shell: bool = false


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
	_install_panel_corner_close(status_panel, _close_status_panel)
	_install_panel_corner_close(ore_trade_panel, _close_trade_panel)
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
	var ok_btn: Button = tutorial_panel.get_node_or_null("Margin/VBox/Ok") as Button
	if ok_btn != null:
		UiStyle.apply_action_button(ok_btn, UiStyle.CYAN)
		if not ok_btn.pressed.is_connected(_on_tutorial_ok):
			ok_btn.pressed.connect(_on_tutorial_ok)
	ore_trade_open.pressed.connect(_open_trade_panel)
	ore_trade_backdrop.gui_input.connect(_on_trade_backdrop_input)
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
	_setup_home_fab()


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
		title.add_theme_color_override("font_color", Color("#e8f4ff"))
		title.add_theme_color_override("font_outline_color", Color("#061018", 0.7))
		title.add_theme_constant_override("outline_size", 2)
	if title_row != null and title_row.get_node_or_null("BagIcon") == null:
		var bag_icon: Control = UiIcons.bag(36.0)
		bag_icon.name = "BagIcon"
		title_row.add_child(bag_icon)
		title_row.move_child(bag_icon, 0)
	var bag_vbox: VBoxContainer = $OreBag/VBox as VBoxContainer
	if bag_vbox != null:
		bag_vbox.add_theme_constant_override("separation", 12)
	if ore_list != null:
		ore_list.add_theme_constant_override("separation", 6)


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
	var st_vbox: VBoxContainer = status_panel.get_node("Margin/VBox") as VBoxContainer
	if st_vbox != null:
		st_vbox.add_theme_constant_override("separation", 10)
	# 去掉弹窗顶部「状态」标题行，直接从矿层信息开始
	var title: Label = status_panel.get_node_or_null("Margin/VBox/Title") as Label
	if title != null:
		title.visible = false
	var title_bar: Control = status_panel.get_node_or_null("Margin/VBox/TitleBar") as Control
	if title_bar != null:
		title_bar.visible = false
	if status_title_sub != null:
		status_title_sub.add_theme_color_override("font_color", UiStyle.CYAN)
	_style_status_mile_bar()
	_build_status_key_chips()
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
	status_panel.custom_minimum_size = Vector2(376, 0)
	status_panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_fit_popup_shell(status_panel)
	_fit_trade_panel_size()


func _setup_money_badge() -> void:
	money_wrap.add_theme_stylebox_override("panel", UiStyle.glass_chip(UiStyle.COIN))
	var slot: Control = money_badge.get_node_or_null("CoinSlot") as Control
	if slot == null:
		slot = CenterContainer.new()
		slot.name = "CoinSlot"
		slot.custom_minimum_size = Vector2(44, 44)
		money_badge.add_child(slot)
		money_badge.move_child(slot, 0)
	for c in slot.get_children():
		c.queue_free()
	slot.add_child(UiIcons.money_hud(40.0, false))
	var amount: Label = money_badge.get_node_or_null("Amount") as Label
	if amount != null:
		amount.add_theme_color_override("font_color", Color("#ffe9a0"))
		amount.add_theme_color_override("font_outline_color", Color("#061018", 0.75))
		amount.add_theme_constant_override("outline_size", 3)
	toast_panel.add_theme_stylebox_override("panel", UiStyle.glass_panel(UiStyle.CYAN))


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
	ore_trade_panel.add_theme_stylebox_override("panel", UiStyle.trade_vault_frame())
	ore_trade_confirm_panel.add_theme_stylebox_override("panel", UiStyle.trade_vault_frame())
	ore_trade_panel.custom_minimum_size = Vector2(TRADE_PANEL_W, 0)
	ore_trade_panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	ore_trade_panel.set_anchors_preset(Control.PRESET_CENTER)
	if not ore_trade_panel.gui_input.is_connected(_on_trade_panel_gui_input):
		ore_trade_panel.gui_input.connect(_on_trade_panel_gui_input)
	_ensure_trade_grid()
	var trade_margin: MarginContainer = ore_trade_panel.get_node("Margin") as MarginContainer
	if trade_margin != null:
		trade_margin.add_theme_constant_override("margin_left", 18)
		trade_margin.add_theme_constant_override("margin_right", 18)
		trade_margin.add_theme_constant_override("margin_top", 28)
		trade_margin.add_theme_constant_override("margin_bottom", 16)
	var trade_vbox: VBoxContainer = ore_trade_panel.get_node("Margin/VBox") as VBoxContainer
	if trade_vbox != null:
		trade_vbox.add_theme_constant_override("separation", 12)
	_style_trade_header(trade_vbox)
	_invalidate_trade_rows()
	_fit_trade_panel_size()
	UiStyle.apply_action_button(ore_trade_confirm_cancel, UiStyle.CYAN)
	UiStyle.apply_action_button(ore_trade_confirm_ok, UiStyle.GOLD)
	UiStyle.apply_qty_step_button(ore_trade_confirm_qty_minus, UiStyle.CYAN)
	UiStyle.apply_qty_step_button(ore_trade_confirm_qty_plus, UiStyle.CYAN)
	UiStyle.apply_action_button(ore_trade_confirm_qty_max, UiStyle.GOLD)
	_style_trade_confirm_spin()


func _style_trade_header(trade_vbox: VBoxContainer) -> void:
	if trade_vbox == null:
		return
	var old_bar: PanelContainer = trade_vbox.get_node_or_null("TitleBar") as PanelContainer
	var title_row: HBoxContainer = trade_vbox.get_node_or_null("TitleRow") as HBoxContainer
	var trade_title: Label = trade_vbox.get_node_or_null("Title") as Label
	if trade_title == null and title_row != null:
		trade_title = title_row.get_node_or_null("Title") as Label
	if trade_title == null and old_bar != null:
		trade_title = old_bar.find_child("Title", true, false) as Label
	if old_bar != null:
		if trade_title != null and trade_title.get_parent() != null:
			trade_title.get_parent().remove_child(trade_title)
			trade_vbox.add_child(trade_title)
			trade_vbox.move_child(trade_title, 0)
		old_bar.queue_free()
	var old_chip: PanelContainer = trade_vbox.get_node_or_null("SubChip") as PanelContainer
	var sub_row: HBoxContainer = trade_vbox.get_node_or_null("TitleSubRow") as HBoxContainer
	if sub_row == null and old_chip != null:
		sub_row = old_chip.find_child("TitleSubRow", true, false) as HBoxContainer
	if old_chip != null:
		if sub_row != null and sub_row.get_parent() != trade_vbox:
			var chip_idx: int = old_chip.get_index()
			sub_row.get_parent().remove_child(sub_row)
			trade_vbox.add_child(sub_row)
			trade_vbox.move_child(sub_row, chip_idx)
		old_chip.queue_free()
	# 标题行包进轻底带，和列表拉开层次
	var ribbon: PanelContainer = trade_vbox.get_node_or_null("TitleRibbon") as PanelContainer
	if ribbon == null:
		ribbon = PanelContainer.new()
		ribbon.name = "TitleRibbon"
		trade_vbox.add_child(ribbon)
		trade_vbox.move_child(ribbon, 0)
	ribbon.add_theme_stylebox_override("panel", UiStyle.trade_title_ribbon())
	var ribbon_box: VBoxContainer = ribbon.get_node_or_null("RibbonBox") as VBoxContainer
	if ribbon_box == null:
		ribbon_box = VBoxContainer.new()
		ribbon_box.name = "RibbonBox"
		ribbon_box.add_theme_constant_override("separation", 6)
		ribbon.add_child(ribbon_box)
	if title_row == null:
		title_row = HBoxContainer.new()
		title_row.name = "TitleRow"
		title_row.alignment = BoxContainer.ALIGNMENT_CENTER
		title_row.add_theme_constant_override("separation", 10)
	if title_row.get_parent() != ribbon_box:
		if title_row.get_parent() != null:
			title_row.get_parent().remove_child(title_row)
		ribbon_box.add_child(title_row)
		ribbon_box.move_child(title_row, 0)
	if trade_title != null and trade_title.get_parent() != title_row:
		trade_title.get_parent().remove_child(trade_title)
		title_row.add_child(trade_title)
	var title_icon: Control = title_row.get_node_or_null("TitleIcon") as Control
	if title_icon == null:
		# favour 金币袋呼吸动画
		title_icon = UiIcons.money_hud(26.0, true)
		title_icon.name = "TitleIcon"
		title_row.add_child(title_icon)
		title_row.move_child(title_icon, 0)
	if trade_title != null:
		trade_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		trade_title.add_theme_color_override("font_color", Color("#ffe9a0"))
		trade_title.add_theme_font_size_override("font_size", 22)
		trade_title.add_theme_color_override("font_outline_color", Color("#2a1808", 0.9))
		trade_title.add_theme_constant_override("outline_size", 3)
	if sub_row != null:
		if sub_row.get_parent() != ribbon_box:
			if sub_row.get_parent() != null:
				sub_row.get_parent().remove_child(sub_row)
			ribbon_box.add_child(sub_row)
		sub_row.alignment = BoxContainer.ALIGNMENT_CENTER
		sub_row.add_theme_constant_override("separation", 6)
		var sub_arrow: Label = sub_row.get_node_or_null("SubArrow") as Label
		if sub_arrow != null:
			sub_arrow.visible = false
		var sub_gfx: ExchangeArrow = sub_row.get_node_or_null("SubArrowGfx") as ExchangeArrow
		if sub_gfx == null and sub_arrow != null:
			sub_gfx = ExchangeArrow.new(16.0, 10.0, ExchangeArrow.Style.CHEVRON)
			sub_gfx.name = "SubArrowGfx"
			sub_row.add_child(sub_gfx)
			sub_row.move_child(sub_gfx, sub_arrow.get_index())
		if sub_gfx != null:
			sub_gfx.tint = UiStyle.TEXT_DIM
			sub_gfx.queue_redraw()
		for lab_name in ["SubLeft", "SubGold"]:
			var lab: Label = sub_row.get_node_or_null(lab_name) as Label
			if lab != null:
				lab.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
				lab.add_theme_font_size_override("font_size", 12)
		var sub_coin: CenterContainer = sub_row.get_node_or_null("SubCoinSlot") as CenterContainer
		if sub_coin != null:
			for c in sub_coin.get_children():
				c.queue_free()
			sub_coin.add_child(UiIcons.coin(13.0))


func _setup_home_fab() -> void:
	if home_fab == null:
		return
	home_fab.custom_minimum_size = Vector2(48, 48)
	home_fab.tooltip_text = "返回主菜单"
	UiStyle.apply_icon_only_button(home_fab)
	_set_button_glyph(home_fab, UiIcons.home(40.0))
	_icon_only_hover(home_fab)
	if not home_fab.pressed.is_connected(_on_home_fab_pressed):
		home_fab.pressed.connect(_on_home_fab_pressed)


func _on_home_fab_pressed() -> void:
	home_fab.release_focus()
	request_main_menu.emit()


func _hide_panel_bottom_close(panel: PanelContainer) -> void:
	# 直接移除，避免 hidden 行仍占最小高度（第一次打开会偏高）
	var row: Control = panel.get_node_or_null("Margin/VBox/CloseRow") as Control
	if row != null:
		row.get_parent().remove_child(row)
		row.queue_free()


func _popup_shell_of(panel: PanelContainer) -> Control:
	if panel == null:
		return null
	var p: Node = panel.get_parent()
	if p is Control and (p as Control).has_meta("_popup_shell"):
		return p as Control
	return null


func _popup_center_of(panel: PanelContainer) -> CenterContainer:
	var shell: Control = _popup_shell_of(panel)
	if shell == null:
		return null
	var p: Node = shell.get_parent()
	if p is CenterContainer and (p as Control).has_meta("_popup_center"):
		return p as CenterContainer
	return null


func _sync_popup_host_visible(panel: PanelContainer) -> void:
	var center: CenterContainer = _popup_center_of(panel)
	if center != null:
		center.visible = panel.visible
		return
	var shell: Control = _popup_shell_of(panel)
	if shell != null:
		shell.visible = panel.visible


func _ensure_popup_shell(panel: PanelContainer) -> Control:
	# 已是「Center + Shell」结构则复用
	var existing: Control = _popup_shell_of(panel)
	if existing != null and _popup_center_of(panel) != null:
		return existing
	# 旧版只有 Shell（居中锚点）→ 拆掉重建，否则 × 坐标会偏
	if existing != null:
		var old_host: Node = existing.get_parent()
		var old_idx: int = existing.get_index()
		var keep_z: int = int(existing.get_meta("_popup_z", maxi(panel.z_index, 40)))
		panel.reparent(old_host)
		old_host.move_child(panel, old_idx)
		existing.queue_free()
		panel.set_meta("_popup_z_keep", keep_z)
	var host: Node = panel.get_parent()
	var idx: int = panel.get_index()
	var keep_z2: int = int(panel.get_meta("_popup_z_keep", maxi(panel.z_index, 40)))
	var center := CenterContainer.new()
	center.name = "%sCenter" % panel.name
	center.set_meta("_popup_center", true)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.visible = panel.visible
	center.z_index = keep_z2
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	center.grow_horizontal = Control.GROW_DIRECTION_BOTH
	center.grow_vertical = Control.GROW_DIRECTION_BOTH
	var shell := Control.new()
	shell.name = "%sShell" % panel.name
	shell.set_meta("_popup_shell", true)
	shell.set_meta("_popup_z", keep_z2)
	shell.mouse_filter = Control.MOUSE_FILTER_IGNORE
	shell.clip_contents = false
	host.add_child(center)
	host.move_child(center, idx)
	center.add_child(shell)
	panel.reparent(shell)
	panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
	panel.anchor_right = 0.0
	panel.anchor_bottom = 0.0
	panel.offset_left = 0.0
	panel.offset_top = 0.0
	panel.offset_right = 0.0
	panel.offset_bottom = 0.0
	panel.z_index = 0
	return shell


func _install_panel_corner_close(panel: PanelContainer, on_close: Callable) -> void:
	if panel == null:
		return
	_hide_panel_bottom_close(panel)
	var old_layer: Node = panel.get_node_or_null("CornerCloseLayer")
	if old_layer != null:
		old_layer.queue_free()
	var old_inner: Node = panel.get_node_or_null("CornerClose")
	if old_inner != null:
		old_inner.queue_free()
	var old_float: Node = get_node_or_null("%sCornerClose" % panel.name)
	if old_float != null:
		old_float.queue_free()
	var shell: Control = _ensure_popup_shell(panel)
	var btn: Button = shell.get_node_or_null("CornerClose") as Button
	if btn == null:
		btn = Button.new()
		btn.name = "CornerClose"
		shell.add_child(btn)
		btn.pressed.connect(on_close)
	UiStyle.apply_corner_close_button(btn)
	if not panel.has_meta("_corner_close_pin"):
		panel.set_meta("_corner_close_pin", true)
		panel.visibility_changed.connect(func() -> void:
			_sync_popup_host_visible(panel)
			if panel.visible:
				_fit_popup_shell_later(panel)
			else:
				_sync_corner_close(panel)
		)
	call_deferred("_fit_popup_shell", panel)


func _fit_popup_shell_later(panel: PanelContainer) -> void:
	# 首次打开时 CenterContainer 要过几帧才定宽，必须延后重钉 ×
	if not is_inside_tree():
		_fit_popup_shell(panel)
		return
	call_deferred("_fit_popup_shell_stable", panel)


func _fit_popup_shell_stable(panel: PanelContainer) -> void:
	if panel == null or not is_instance_valid(panel):
		return
	_fit_popup_shell(panel)
	await get_tree().process_frame
	if not is_instance_valid(panel):
		return
	_fit_popup_shell(panel)
	await get_tree().process_frame
	if not is_instance_valid(panel):
		return
	_fit_popup_shell(panel)
	_pin_corner_close_to_actual(panel)


func _pin_corner_close_btn(btn: Button, shell_w: float) -> void:
	if btn == null:
		return
	# 与设置弹窗完全同一套：Shell 本地坐标钉右上角
	btn.set_anchors_preset(Control.PRESET_TOP_LEFT)
	btn.anchor_right = 0.0
	btn.anchor_bottom = 0.0
	btn.offset_left = 0.0
	btn.offset_top = 0.0
	btn.offset_right = 0.0
	btn.offset_bottom = 0.0
	var bw: float = 30.0
	var bh: float = 30.0
	var x: float = maxf(shell_w - bw - 2.0, 0.0)
	btn.position = Vector2(x, 2.0)
	btn.size = Vector2(bw, bh)
	btn.z_index = 20
	btn.mouse_filter = Control.MOUSE_FILTER_STOP
	btn.modulate = Color.WHITE


func _pin_corner_close_to_actual(panel: PanelContainer) -> void:
	var shell: Control = _popup_shell_of(panel)
	if shell == null:
		return
	var btn: Button = shell.get_node_or_null("CornerClose") as Button
	if btn == null:
		return
	# 用布局后的真实宽度，避免首帧 shell.size 偏小把 × 钉偏
	var sw: float = maxf(shell.size.x, shell.custom_minimum_size.x)
	sw = maxf(sw, panel.size.x)
	sw = maxf(sw, panel.custom_minimum_size.x)
	if sw < 1.0:
		return
	_pin_corner_close_btn(btn, sw)
	btn.visible = panel.visible
	btn.move_to_front()


func _sync_corner_close(panel: PanelContainer) -> void:
	_pin_corner_close_to_actual(panel)


func _wire_shell_close_resize(panel: PanelContainer, shell: Control) -> void:
	if shell == null or shell.has_meta("_close_resize_wired"):
		return
	shell.set_meta("_close_resize_wired", true)
	shell.resized.connect(func() -> void:
		if panel != null and is_instance_valid(panel) and panel.visible:
			_pin_corner_close_to_actual(panel)
	)


func _fit_popup_shell(panel: PanelContainer) -> void:
	if panel == null or _fitting_popup_shell:
		return
	var shell: Control = _ensure_popup_shell(panel)
	if shell == null:
		return
	var center: CenterContainer = _popup_center_of(panel)
	_fitting_popup_shell = true
	var min_w: float = maxf(panel.custom_minimum_size.x, 120.0)
	panel.size = Vector2(min_w, 0.0)
	panel.reset_size()
	var min_sz: Vector2 = panel.get_combined_minimum_size()
	var w: float = maxf(min_w, min_sz.x)
	var h: float = maxf(panel.custom_minimum_size.y, min_sz.y)
	h = maxf(h, 80.0)
	# CenterContainer 子节点靠 custom_minimum_size 吃尺寸（同设置弹窗）
	shell.custom_minimum_size = Vector2(w, h)
	shell.size = Vector2(w, h)
	panel.position = Vector2.ZERO
	panel.size = Vector2(w, h)
	if center != null:
		center.visible = panel.visible
		if not center.has_meta("_popup_z"):
			center.set_meta("_popup_z", int(shell.get_meta("_popup_z", 40)))
		center.z_index = int(center.get_meta("_popup_z"))
	_wire_shell_close_resize(panel, shell)
	var btn: Button = shell.get_node_or_null("CornerClose") as Button
	_pin_corner_close_btn(btn, w)
	if btn != null:
		btn.visible = panel.visible
		btn.move_to_front()
	_fitting_popup_shell = false
	# 布局后再按真实尺寸钉一次
	call_deferred("_pin_corner_close_to_actual", panel)


func _pin_panel_corner_close(panel: PanelContainer) -> void:
	_fit_popup_shell(panel)


func _bring_popup_front(panel: PanelContainer) -> void:
	var center: CenterContainer = _popup_center_of(panel)
	if center != null:
		center.move_to_front()
		return
	var shell: Control = _popup_shell_of(panel)
	if shell != null:
		shell.move_to_front()
	else:
		panel.move_to_front()


func _style_trade_confirm_spin() -> void:
	if ore_trade_confirm_spin == null:
		return
	ore_trade_confirm_spin.add_theme_font_size_override("font_size", 15)
	ore_trade_confirm_spin.alignment = HORIZONTAL_ALIGNMENT_CENTER
	# 藏掉自带上下箭头，避免中间竖分隔线透到两侧 −/+
	ore_trade_confirm_spin.add_theme_constant_override("buttons_width", 0)
	var empty := StyleBoxEmpty.new()
	ore_trade_confirm_spin.add_theme_stylebox_override("up_background", empty)
	ore_trade_confirm_spin.add_theme_stylebox_override("up_background_hovered", empty)
	ore_trade_confirm_spin.add_theme_stylebox_override("up_background_pressed", empty)
	ore_trade_confirm_spin.add_theme_stylebox_override("down_background", empty)
	ore_trade_confirm_spin.add_theme_stylebox_override("down_background_hovered", empty)
	ore_trade_confirm_spin.add_theme_stylebox_override("down_background_pressed", empty)
	ore_trade_confirm_spin.add_theme_icon_override("updown", ImageTexture.new())
	var le: LineEdit = ore_trade_confirm_spin.get_line_edit()
	if le != null:
		var field := StyleBoxFlat.new()
		field.bg_color = Color(0.08, 0.12, 0.2, 0.95)
		field.border_width_left = 1
		field.border_width_top = 1
		field.border_width_right = 1
		field.border_width_bottom = 1
		field.border_color = Color(UiStyle.CYAN, 0.45)
		field.corner_radius_top_left = 10
		field.corner_radius_top_right = 10
		field.corner_radius_bottom_left = 10
		field.corner_radius_bottom_right = 10
		field.content_margin_left = 8
		field.content_margin_right = 8
		le.add_theme_stylebox_override("normal", field)
		le.add_theme_stylebox_override("focus", field)
		le.add_theme_stylebox_override("read_only", field)
		le.add_theme_color_override("font_color", Color("#f2f7ff"))
		le.add_theme_font_size_override("font_size", 16)
		le.alignment = HORIZONTAL_ALIGNMENT_CENTER


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


func _ensure_trade_grid() -> void:
	# 拆掉旧滚动壳：货架一屏展全，不要滚动条
	var parent: Node = ore_trade_list.get_parent()
	if parent is ScrollContainer:
		var scroll: ScrollContainer = parent as ScrollContainer
		var grand: Node = scroll.get_parent()
		var idx: int = scroll.get_index()
		scroll.remove_child(ore_trade_list)
		grand.add_child(ore_trade_list)
		grand.move_child(ore_trade_list, idx)
		scroll.queue_free()
		parent = ore_trade_list.get_parent()
	# VBox → 双列 Grid
	if not (ore_trade_list is GridContainer):
		var grid := GridContainer.new()
		grid.name = "TradeList"
		grid.columns = TRADE_GRID_COLS
		grid.add_theme_constant_override("h_separation", 14)
		grid.add_theme_constant_override("v_separation", 16)
		grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var host: Node = parent
		var at: int = ore_trade_list.get_index()
		var kids: Array = ore_trade_list.get_children()
		for c in kids:
			ore_trade_list.remove_child(c)
			if str(c.name) == "EmptyHint":
				host.add_child(c)
			else:
				grid.add_child(c)
		host.remove_child(ore_trade_list)
		ore_trade_list.queue_free()
		host.add_child(grid)
		host.move_child(grid, at)
		ore_trade_list = grid
	else:
		var g: GridContainer = ore_trade_list as GridContainer
		g.columns = TRADE_GRID_COLS
		g.add_theme_constant_override("h_separation", 14)
		g.add_theme_constant_override("v_separation", 16)
	ore_trade_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ore_trade_list.size_flags_vertical = Control.SIZE_SHRINK_BEGIN


func _fit_trade_panel_size() -> void:
	if ore_trade_panel == null:
		return
	ore_trade_panel.custom_minimum_size = Vector2(TRADE_PANEL_W, 0)
	ore_trade_panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_fit_popup_shell(ore_trade_panel)


func bind_session(game_session: GameSession) -> void:
	_session = game_session
	_bootstrapping = true
	_upgrade_ready_notified = true
	if money_label != null and _session != null:
		money_label.text = _fmt(_session.money)
	# 重活挪到下一帧，避免和进局同帧叠卡
	call_deferred("_bind_session_deferred")


func _bind_session_deferred() -> void:
	if _session == null:
		_bootstrapping = false
		return
	_refresh_absorb_label()
	_refresh_ore_bag()
	_refresh_status_panel()
	_bootstrapping = false
	_upgrade_ready_notified = false
	_refresh_upgrade_ready_hint()
	# 兑换行预热再晚一点，不挡进局
	get_tree().create_timer(0.35, true, false, true).timeout.connect(
		_prewarm_trade_rows, CONNECT_ONE_SHOT
	)


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
		_bring_popup_front(status_panel)
		UiJuice.modal_open(status_panel, status_backdrop, false, true)
		_sync_popup_host_visible(status_panel)
		_fit_popup_shell_later(status_panel)
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
	_bring_popup_front(ore_trade_panel)
	# favour 风：弹窗弹入 + 货架卡错落
	UiJuice.modal_open(ore_trade_panel, ore_trade_backdrop, false, false)
	_sync_popup_host_visible(ore_trade_panel)
	ore_trade_open.release_focus()
	if _trade_rows_prewarmed:
		_sync_trade_list()
		_play_trade_cards_in()
	else:
		call_deferred("_sync_trade_list_after_open")
	_fit_popup_shell_later(ore_trade_panel)


func _sync_trade_list_after_open() -> void:
	if not ore_trade_panel.visible:
		return
	_prewarm_trade_rows()
	_sync_trade_list()
	_play_trade_cards_in()


func _play_trade_cards_in() -> void:
	if ore_trade_list == null or not ore_trade_panel.visible:
		return
	UiJuice.stagger_visible_children(ore_trade_list, 0.042)


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


func _eat_trade_wheel(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP or mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			get_viewport().set_input_as_handled()


func _on_trade_panel_gui_input(event: InputEvent) -> void:
	_eat_trade_wheel(event)


func _on_trade_backdrop_input(event: InputEvent) -> void:
	if ore_trade_confirm_panel.visible:
		return
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP or mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			get_viewport().set_input_as_handled()
			return
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


func _trade_empty_hint() -> Label:
	var host: Node = ore_trade_list.get_parent()
	if host == null:
		return null
	var empty_lbl: Label = host.get_node_or_null("EmptyHint") as Label
	if empty_lbl != null:
		return empty_lbl
	empty_lbl = Label.new()
	empty_lbl.name = "EmptyHint"
	empty_lbl.text = "背包里没有可兑换的矿石"
	empty_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	empty_lbl.add_theme_font_size_override("font_size", 15)
	empty_lbl.add_theme_color_override("font_color", UiStyle.TEXT_DIM)
	host.add_child(empty_lbl)
	host.move_child(empty_lbl, ore_trade_list.get_index() + 1)
	return empty_lbl


func _sync_trade_list() -> void:
	if _session == null:
		return
	_prewarm_trade_rows()
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
	var empty_lbl: Label = _trade_empty_hint()
	if empty_lbl != null:
		empty_lbl.visible = not any
	ore_trade_list.visible = any
	_fit_trade_panel_size()


func _make_trade_row(type_id: int) -> PanelContainer:
	var meta: Dictionary = GameData.ore_meta(type_id)
	var ore_color: Color = meta.get("color", Color.GRAY)
	var ore_glow: Color = meta.get("glow", ore_color)
	var bar_col: Color = UiStyle.trade_slot_accent(ore_color, ore_glow)
	var ink: Color = UiStyle.ore_ink_color(ore_color, ore_glow)
	var normal_sb: StyleBoxFlat = UiStyle.trade_ore_slot(ore_color, ore_glow)
	var hover_sb: StyleBoxFlat = UiStyle.trade_ore_slot_hover(ore_color, ore_glow)
	var card := PanelContainer.new()
	card.name = "Trade_%d" % type_id
	card.set_meta("type_id", type_id)
	card.set_meta("normal_style", normal_sb)
	card.set_meta("hover_style", hover_sb)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.custom_minimum_size = Vector2(148, 0)
	card.add_theme_stylebox_override("panel", normal_sb)

	var col := VBoxContainer.new()
	col.name = "Col"
	col.add_theme_constant_override("separation", 5)
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	card.add_child(col)

	# 大图标浮在柔光上，不再套方框/顶横线
	var icon_aura := PanelContainer.new()
	icon_aura.name = "IconAura"
	icon_aura.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	icon_aura.add_theme_stylebox_override("panel", UiStyle.trade_icon_well(ore_color))
	col.add_child(icon_aura)
	var icon_center := CenterContainer.new()
	icon_aura.add_child(icon_center)
	var ore_icon := OreBagIcon.new(type_id, TRADE_CARD_ICON)
	ore_icon.name = "OreIcon"
	icon_center.add_child(ore_icon)
	UiJuice.soft_breathe(icon_aura, 1.16, 1.15 + float(type_id) * 0.08)
	UiJuice.icon_hover_pulse(ore_icon)

	var name_lbl := Label.new()
	name_lbl.name = "Name"
	name_lbl.text = str(meta.get("name", ""))
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_lbl.add_theme_font_size_override("font_size", 15)
	name_lbl.add_theme_color_override("font_color", ink)
	name_lbl.add_theme_color_override("font_outline_color", Color("#061018", 0.85))
	name_lbl.add_theme_constant_override("outline_size", 2)
	col.add_child(name_lbl)

	# 数量 + 价格合成一行，去掉价签框
	var meta_row := HBoxContainer.new()
	meta_row.name = "MetaRow"
	meta_row.alignment = BoxContainer.ALIGNMENT_CENTER
	meta_row.add_theme_constant_override("separation", 6)
	col.add_child(meta_row)
	var cnt_lbl := Label.new()
	cnt_lbl.name = "Count"
	cnt_lbl.add_theme_font_size_override("font_size", 12)
	cnt_lbl.add_theme_color_override("font_color", UiStyle.ore_count_color(ore_color, ore_glow))
	meta_row.add_child(cnt_lbl)
	var dot := Label.new()
	dot.text = "·"
	dot.add_theme_font_size_override("font_size", 12)
	dot.add_theme_color_override("font_color", Color(UiStyle.TEXT_DIM, 0.7))
	meta_row.add_child(dot)
	meta_row.add_child(UiIcons.coin(14.0, true))
	var price_lbl := Label.new()
	price_lbl.name = "Price"
	price_lbl.add_theme_font_size_override("font_size", 14)
	price_lbl.add_theme_color_override("font_color", UiStyle.COIN)
	price_lbl.add_theme_color_override("font_outline_color", Color("#2a1808", 0.75))
	price_lbl.add_theme_constant_override("outline_size", 2)
	meta_row.add_child(price_lbl)

	var sell_btn := Button.new()
	sell_btn.name = "SellBtn"
	sell_btn.focus_mode = Control.FOCUS_NONE
	sell_btn.tooltip_text = "选择数量兑换"
	sell_btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	sell_btn.custom_minimum_size = Vector2(96, 32)
	sell_btn.pressed.connect(_request_trade_confirm.bind(type_id))
	UiStyle.apply_trade_sell_button(sell_btn)
	_wire_trade_sell_juice(sell_btn)
	col.add_child(sell_btn)

	UiJuice.wire_hover_lift(card, bar_col)
	return card


func _wire_trade_sell_juice(btn: Button) -> void:
	btn.mouse_entered.connect(func() -> void:
		if not is_instance_valid(btn):
			return
		btn.pivot_offset = btn.size * 0.5
		var tw: Tween = btn.create_tween()
		tw.tween_property(btn, "scale", Vector2(1.06, 1.06), 0.1).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	)
	btn.mouse_exited.connect(func() -> void:
		if not is_instance_valid(btn):
			return
		var tw: Tween = btn.create_tween()
		tw.tween_property(btn, "scale", Vector2.ONE, 0.12)
	)
	btn.button_down.connect(func() -> void:
		if not is_instance_valid(btn):
			return
		btn.pivot_offset = btn.size * 0.5
		btn.scale = Vector2(0.94, 0.94)
	)
	btn.button_up.connect(func() -> void:
		if not is_instance_valid(btn):
			return
		UiJuice.punch(btn, 1.08)
	)


func _update_trade_row(card: PanelContainer, type_id: int, count: int) -> void:
	var unit: int = _session.ore_unit_sell_price(type_id)
	var cnt: Label = card.get_node_or_null("Col/MetaRow/Count") as Label
	if cnt == null:
		cnt = card.get_node_or_null("Col/Count") as Label
	var price: Label = card.get_node_or_null("Col/MetaRow/Price") as Label
	if price == null:
		price = card.get_node_or_null("Col/PricePill/PriceBox/Price") as Label
	if cnt != null:
		cnt.text = "×%d" % count
	if price != null:
		price.text = _fmt(unit)


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
	tutorial_panel.add_theme_stylebox_override("panel", UiStyle.glass_panel(UiStyle.CYAN))
	var tut_title: Label = tutorial_panel.get_node_or_null("Margin/VBox/Title") as Label
	if tut_title != null:
		tut_title.add_theme_color_override("font_color", Color("#9ee8ff"))
		tut_title.add_theme_color_override("font_outline_color", Color("#061018", 0.8))
		tut_title.add_theme_constant_override("outline_size", 3)
	for path in ["Margin/VBox/L1", "Margin/VBox/L2", "Margin/VBox/L3"]:
		var lab: Label = tutorial_panel.get_node_or_null(path) as Label
		if lab != null:
			lab.add_theme_color_override("font_color", Color("#e4ecf6"))
			lab.add_theme_color_override("font_outline_color", Color("#061018", 0.55))
			lab.add_theme_constant_override("outline_size", 2)
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.06, 0.1, 0.16, 0.72)
	bg.border_width_left = 1
	bg.border_width_top = 1
	bg.border_width_right = 1
	bg.border_width_bottom = 1
	bg.border_color = Color(UiStyle.CYAN, 0.45)
	bg.corner_radius_top_left = 16
	bg.corner_radius_top_right = 16
	bg.corner_radius_bottom_left = 16
	bg.corner_radius_bottom_right = 16
	bg.shadow_color = Color(UiStyle.CYAN, 0.22)
	bg.shadow_size = 10
	bg.shadow_offset = Vector2(0, 3)
	mine_row.add_theme_stylebox_override("panel", bg)
	_apply_mine_bar_colors(UiStyle.COIN)
	if mine_label != null:
		mine_label.add_theme_color_override("font_color", Color("#ffe9a0"))
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
	if _bootstrapping:
		return
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
		var ore_color: Color = meta.get("color", Color.GRAY)
		var ore_glow: Color = meta.get("glow", ore_color)
		var ink: Color = UiStyle.ore_ink_color(ore_color, ore_glow)
		var count_col: Color = UiStyle.ore_count_color(ore_color, ore_glow)
		# 无框：图标 + 名称撑开 + 数量右对齐，靠色字区分矿种
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		row.custom_minimum_size = Vector2(0, 38)
		row.alignment = BoxContainer.ALIGNMENT_CENTER
		row.add_child(OreBagIcon.new(type_id, float(ORE_BAG_SWATCH)))
		var name_lbl := Label.new()
		name_lbl.text = str(meta.get("name", ""))
		name_lbl.add_theme_font_size_override("font_size", ORE_BAG_FONT)
		name_lbl.add_theme_color_override("font_color", ink)
		name_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		name_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		row.add_child(name_lbl)
		var cnt_lbl := Label.new()
		cnt_lbl.text = "×%d" % count
		cnt_lbl.add_theme_font_size_override("font_size", ORE_BAG_FONT)
		cnt_lbl.add_theme_color_override("font_color", count_col)
		cnt_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		cnt_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		cnt_lbl.custom_minimum_size = Vector2(48, 0)
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
