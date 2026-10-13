class_name UiStyle
extends RefCounted

const GOLD := Color("#f0a020")
const GOLD_DIM := Color("#c4841a")
const CYAN := Color("#7ee8ff")
const INK := Color("#0a0c10")
const PANEL := Color("#141922")
const PANEL_L := Color("#1c2430")
const PANEL_CARD := Color("#222b38")
const TEXT := Color("#e8ecf4")
const TEXT_DIM := Color("#8a929e")
const COIN := Color("#ffe566")
const OK := Color("#5fd38d")
const WARN := Color("#e85d5d")


## 拾光玻璃板：半透明冷底 + 柔彩描边（主菜单 / 局内弹窗统一）
static func glass_panel(accent: Color = CYAN) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.1, 0.16, 0.78)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(accent, 0.55).lerp(Color("#b8e0ff"), 0.35)
	sb.corner_radius_top_left = 14
	sb.corner_radius_top_right = 14
	sb.corner_radius_bottom_left = 14
	sb.corner_radius_bottom_right = 14
	sb.shadow_color = Color(accent, 0.28)
	sb.shadow_size = 14
	sb.shadow_offset = Vector2(0, 4)
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 12
	sb.content_margin_bottom = 12
	return sb


## 局内小芯片（金币条等）
static func glass_chip(accent: Color = COIN) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.08, 0.12, 0.2, 0.55)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(accent, 0.65)
	sb.corner_radius_top_left = 16
	sb.corner_radius_top_right = 16
	sb.corner_radius_bottom_left = 16
	sb.corner_radius_bottom_right = 16
	sb.shadow_color = Color(accent, 0.22)
	sb.shadow_size = 8
	sb.shadow_offset = Vector2(0, 2)
	sb.content_margin_left = 10
	sb.content_margin_right = 12
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	return sb


## 标准局内弹窗外壳（状态 / 兑换 / 工坊）— 保持原深色描边，不跟主菜单玻璃风
static func favour_popup_frame(accent: Color = GOLD) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#0a0e14", 0.97)
	sb.border_width_left = 2
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 3
	sb.border_color = Color(accent, 0.55).lerp(Color("#d0ecff"), 0.45)
	sb.corner_radius_top_left = 10
	sb.corner_radius_top_right = 10
	sb.corner_radius_bottom_left = 10
	sb.corner_radius_bottom_right = 10
	sb.shadow_color = Color("#5c35c3", 0.5)
	sb.shadow_size = 18
	sb.shadow_offset = Vector2(0, 6)
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 12
	sb.content_margin_bottom = 12
	return sb


static func game_modal_frame(accent: Color = GOLD) -> StyleBoxFlat:
	return favour_popup_frame(accent)


static func favour_popup_title_bar(accent: Color = GOLD) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#141c28")
	sb.border_width_bottom = 2
	sb.border_color = Color(accent, 0.85)
	sb.corner_radius_top_left = 4
	sb.corner_radius_top_right = 4
	sb.content_margin_left = 8
	sb.content_margin_right = 8
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	return sb


## 标题区：无底部分隔线，仅轻微底色
static func favour_popup_title_soft() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#121820", 0.55)
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb


## 弹窗内区块：圆角浅底
static func soft_card(_accent: Color = CYAN) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#121820", 0.9)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(1, 1, 1, 0.06)
	sb.corner_radius_top_left = 10
	sb.corner_radius_top_right = 10
	sb.corner_radius_bottom_left = 10
	sb.corner_radius_bottom_right = 10
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb


## 仅工坊外壳：低调玻璃（不影响状态/兑换等 favour_popup）
static func shop_popup_frame() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.06, 0.09, 0.14, 0.94)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(GOLD, 0.28).lerp(Color("#9eb8d0"), 0.5)
	sb.corner_radius_top_left = 14
	sb.corner_radius_top_right = 14
	sb.corner_radius_bottom_left = 14
	sb.corner_radius_bottom_right = 14
	sb.shadow_color = Color(0, 0, 0, 0.45)
	sb.shadow_size = 12
	sb.shadow_offset = Vector2(0, 4)
	sb.content_margin_left = 14
	sb.content_margin_right = 14
	sb.content_margin_top = 12
	sb.content_margin_bottom = 12
	return sb


## 仅工坊模块卡：柔和描边，勿过亮
static func shop_module_card(accent: Color = GOLD) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.1, 0.13, 0.2, 0.82)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(accent, 0.42)
	sb.corner_radius_top_left = 12
	sb.corner_radius_top_right = 12
	sb.corner_radius_bottom_left = 12
	sb.corner_radius_bottom_right = 12
	sb.shadow_color = Color(0, 0, 0, 0.28)
	sb.shadow_size = 6
	sb.shadow_offset = Vector2(0, 2)
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	return sb


## 主菜单底板占位（实际绘制见 menu_title_plate.gd）
static func menu_vault_frame() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0, 0, 0, 0)
	sb.content_margin_left = 8
	sb.content_margin_right = 8
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb


## 深核琥珀：近黑底 + 琥珀金主色 + 青紫点缀
const MENU_AMBER := Color("#e8a825")
const MENU_AMBER_HI := Color("#ffe08a")
const MENU_CYAN := Color("#6ec8ff")
const MENU_VIOLET := Color("#8b7cf8")
const MENU_INK := Color("#0a0d14")


## 矿井招牌主按钮：厚石板感
static func menu_primary_btn(accent: Color = MENU_AMBER) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#d4921a").lerp(Color(accent, 1.0), 0.35)
	sb.border_width_left = 2
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 5
	sb.border_color = Color("#5a3208")
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_left = 6
	sb.corner_radius_bottom_right = 6
	sb.content_margin_left = 28
	sb.content_margin_right = 28
	sb.content_margin_top = 14
	sb.content_margin_bottom = 12
	sb.shadow_color = Color(0, 0, 0, 0.45)
	sb.shadow_size = 10
	sb.shadow_offset = Vector2(0, 4)
	return sb


static func menu_primary_btn_hover(accent: Color = MENU_AMBER) -> StyleBoxFlat:
	var sb := menu_primary_btn(accent)
	sb.bg_color = Color("#f0b030")
	sb.border_width_bottom = 3
	return sb


## 次级石片按钮（横排小块）
static func menu_ghost_btn(accent: Color = MENU_AMBER) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#1a222e", 0.92)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 2
	sb.border_color = Color(accent, 0.4)
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_left = 6
	sb.corner_radius_bottom_right = 6
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb


static func menu_ghost_btn_hover(accent: Color = MENU_AMBER) -> StyleBoxFlat:
	var sb := menu_ghost_btn(accent)
	sb.bg_color = Color("#243040", 0.96)
	sb.border_color = Color(accent, 0.85)
	return sb


static func apply_menu_button(btn: Button, accent: Color = MENU_AMBER, primary: bool = false) -> void:
	var a: Color = accent
	if primary:
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn.add_theme_stylebox_override("normal", menu_primary_btn(a))
		btn.add_theme_stylebox_override("hover", menu_primary_btn_hover(a))
		btn.add_theme_stylebox_override("pressed", menu_primary_btn_hover(a))
		btn.add_theme_color_override("font_color", Color("#1a1208"))
		btn.add_theme_color_override("font_hover_color", Color("#0c0804"))
		btn.add_theme_font_size_override("font_size", 22)
	else:
		btn.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		btn.add_theme_stylebox_override("normal", menu_ghost_btn(a))
		btn.add_theme_stylebox_override("hover", menu_ghost_btn_hover(a))
		btn.add_theme_stylebox_override("pressed", menu_ghost_btn_hover(a))
		btn.add_theme_color_override("font_color", TEXT)
		btn.add_theme_color_override("font_hover_color", Color.WHITE)
		btn.add_theme_font_size_override("font_size", 15)
	btn.add_theme_stylebox_override("disabled", action_button_disabled())


## 兑换弹窗外壳：与工坊同一套（浅描边 + 紫阴影），内边距略宽
static func trade_vault_frame() -> StyleBoxFlat:
	var sb := favour_popup_frame(GOLD)
	sb.content_margin_left = 18
	sb.content_margin_right = 18
	sb.content_margin_top = 16
	sb.content_margin_bottom = 16
	return sb


## 兑换标题：无描边，仅暖色底带
static func trade_title_ribbon() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#1a1610", 0.7)
	sb.border_width_left = 0
	sb.border_width_top = 0
	sb.border_width_right = 0
	sb.border_width_bottom = 2
	sb.border_color = Color(GOLD, 0.45)
	sb.corner_radius_top_left = 10
	sb.corner_radius_top_right = 10
	sb.corner_radius_bottom_left = 10
	sb.corner_radius_bottom_right = 10
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	return sb


## 副标题：无边框浅底
static func trade_sub_chip() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#121820", 0.45)
	sb.border_width_left = 0
	sb.border_width_top = 0
	sb.border_width_right = 0
	sb.border_width_bottom = 0
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	sb.content_margin_left = 8
	sb.content_margin_right = 8
	sb.content_margin_top = 4
	sb.content_margin_bottom = 4
	return sb


## 兑换行描边色：过深的矿色（如黑洞）提亮，避免「没框」
static func trade_slot_accent(accent: Color, glow: Color = Color(0, 0, 0, 0)) -> Color:
	var base: Color = accent
	if glow.a > 0.01 and accent.get_luminance() < 0.32:
		base = glow
	if base.get_luminance() < 0.38:
		base = base.lightened(0.35)
	# 再保底：发灰的深色提到可读的冷蓝紫
	if base.get_luminance() < 0.42:
		base = base.lerp(Color("#8eb0ff"), 0.55)
	return base


## 矿石名称/数量文字色：跟矿色走，并提亮保证可读
static func ore_ink_color(accent: Color, glow: Color = Color(0, 0, 0, 0)) -> Color:
	var c: Color = trade_slot_accent(accent, glow)
	if c.get_luminance() < 0.58:
		c = c.lightened(0.42)
	return c.lerp(Color("#f2f4f8"), 0.28)


static func ore_count_color(accent: Color, glow: Color = Color(0, 0, 0, 0)) -> Color:
	return ore_ink_color(accent, glow).lerp(Color("#dce2ea"), 0.2)


## 兑换行：左侧色条为主 + 极淡外框，深色矿也能看见
static func trade_ore_slot(accent: Color = GOLD, glow: Color = Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var bar: Color = trade_slot_accent(accent, glow)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#151b26", 0.9).lerp(Color(bar, 1.0), 0.12)
	sb.border_width_left = 5
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(bar, 0.85)
	sb.corner_radius_top_left = 12
	sb.corner_radius_top_right = 12
	sb.corner_radius_bottom_left = 12
	sb.corner_radius_bottom_right = 12
	sb.content_margin_left = 16
	sb.content_margin_right = 14
	sb.content_margin_top = 14
	sb.content_margin_bottom = 14
	return sb


static func trade_check_btn() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(OK, 0.14)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 2
	sb.border_color = Color(OK, 0.65)
	sb.corner_radius_top_left = 9
	sb.corner_radius_top_right = 9
	sb.corner_radius_bottom_left = 9
	sb.corner_radius_bottom_right = 9
	return sb


static func trade_check_btn_hover() -> StyleBoxFlat:
	var sb := trade_check_btn()
	sb.bg_color = Color(OK, 0.28)
	sb.border_color = Color(OK, 0.9)
	return sb


static func apply_trade_check_button(btn: Button) -> void:
	btn.add_theme_stylebox_override("normal", trade_check_btn())
	btn.add_theme_stylebox_override("hover", trade_check_btn_hover())
	btn.add_theme_stylebox_override("pressed", trade_check_btn_hover())
	btn.add_theme_stylebox_override("disabled", action_button_disabled())
	btn.text = ""


static func pixel_frame(accent: Color = GOLD) -> StyleBoxFlat:
	# 旧像素框入口改为玻璃板，保持调用方兼容
	return glass_panel(accent)


static func frame_panel(accent: Color = GOLD, radius: int = 14) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = PANEL
	sb.border_width_left = 3
	sb.border_width_top = 3
	sb.border_width_right = 3
	sb.border_width_bottom = 4
	sb.border_color = Color(accent, 0.75)
	sb.corner_radius_top_left = radius
	sb.corner_radius_top_right = radius
	sb.corner_radius_bottom_left = radius
	sb.corner_radius_bottom_right = radius
	sb.shadow_color = Color(0, 0, 0, 0.55)
	sb.shadow_size = 16
	sb.shadow_offset = Vector2(0, 4)
	sb.content_margin_left = 4
	sb.content_margin_right = 4
	sb.content_margin_top = 4
	sb.content_margin_bottom = 4
	return sb


static func stat_cell_panel(accent: Color = CYAN) -> StyleBoxFlat:
	return game_inset_block(accent)


## 游戏内信息块：玻璃小条（兼容旧左侧色条语义）
static func game_inset_block(accent: Color = CYAN) -> StyleBoxFlat:
	var sb := glass_chip(accent)
	sb.corner_radius_top_left = 10
	sb.corner_radius_top_right = 10
	sb.corner_radius_bottom_left = 10
	sb.corner_radius_bottom_right = 10
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	return sb


static func inner_glow_panel() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#0d1118")
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(CYAN, 0.12)
	sb.corner_radius_top_left = 10
	sb.corner_radius_top_right = 10
	sb.corner_radius_bottom_left = 10
	sb.corner_radius_bottom_right = 10
	return sb


static func card_panel(stripe: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = PANEL_CARD
	sb.border_width_left = 4
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(stripe, 0.9)
	sb.corner_radius_top_left = 0
	sb.corner_radius_top_right = 0
	sb.corner_radius_bottom_left = 0
	sb.corner_radius_bottom_right = 0
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 3
	sb.content_margin_left = 14
	sb.content_margin_right = 12
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	return sb


static func coin_pill() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#2a2210")
	sb.border_width_left = 2
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 2
	sb.border_color = Color(GOLD, 0.65)
	sb.corner_radius_top_left = 20
	sb.corner_radius_top_right = 20
	sb.corner_radius_bottom_left = 20
	sb.corner_radius_bottom_right = 20
	sb.content_margin_left = 16
	sb.content_margin_right = 16
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	return sb


static func action_button(accent: Color = GOLD) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(accent, 0.22)
	sb.border_width_left = 2
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 3
	sb.border_color = Color(accent, 0.85)
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	return sb


static func action_button_hover(accent: Color = GOLD) -> StyleBoxFlat:
	var sb := action_button(accent)
	sb.bg_color = Color(accent, 0.38)
	return sb


static func action_button_disabled() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#1a1f28")
	sb.border_color = Color("#3a4048")
	sb.border_width_left = 2
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 2
	sb.corner_radius_top_left = 8
	sb.corner_radius_top_right = 8
	sb.corner_radius_bottom_left = 8
	sb.corner_radius_bottom_right = 8
	return sb


static func stripe_for_category(cat_id: String) -> Color:
	match cat_id:
		"pickaxe":
			return GOLD
		"auto_bag":
			return Color("#b8a0ff")
		"pickup":
			return CYAN
		"blast":
			return Color("#ff8866")
		"detector":
			return Color("#66ccff")
		"absorb":
			return Color("#9966cc")
		"fortune":
			return COIN
		_:
			return GOLD


static func shop_card_panel() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#12161c", 0.94)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color("#ffffff", 0.28)
	sb.corner_radius_top_left = 4
	sb.corner_radius_top_right = 4
	sb.corner_radius_bottom_left = 4
	sb.corner_radius_bottom_right = 4
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	return sb


static func shop_card_slot() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#080a0e", 0.72)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color("#ffffff", 0.16)
	sb.corner_radius_top_left = 2
	sb.corner_radius_top_right = 2
	sb.corner_radius_bottom_left = 2
	sb.corner_radius_bottom_right = 2
	sb.content_margin_left = 8
	sb.content_margin_top = 8
	sb.content_margin_right = 8
	sb.content_margin_bottom = 8
	return sb


static func shop_card_upgrade_btn(accent: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.12, 0.16, 0.24, 0.75)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(accent, 0.55)
	sb.corner_radius_top_left = 18
	sb.corner_radius_top_right = 18
	sb.corner_radius_bottom_left = 18
	sb.corner_radius_bottom_right = 18
	sb.shadow_color = Color(0, 0, 0, 0.25)
	sb.shadow_size = 4
	sb.content_margin_left = 12
	sb.content_margin_right = 12
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	return sb


static func shop_card_upgrade_btn_hover(accent: Color) -> StyleBoxFlat:
	var sb := shop_card_upgrade_btn(accent)
	sb.bg_color = Color(accent.r, accent.g, accent.b, 0.18)
	sb.border_color = Color(accent, 0.75)
	return sb


static func apply_shop_card_button(btn: Button, accent: Color) -> void:
	btn.add_theme_stylebox_override("normal", shop_card_upgrade_btn(accent))
	btn.add_theme_stylebox_override("hover", shop_card_upgrade_btn_hover(accent))
	btn.add_theme_stylebox_override("pressed", shop_card_upgrade_btn_hover(accent))
	btn.add_theme_stylebox_override("disabled", action_button_disabled())
	btn.add_theme_color_override("font_color", Color("#f2f7ff"))
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_color_override("font_outline_color", Color("#061018", 0.75))
	btn.add_theme_constant_override("outline_size", 2)


static func apply_action_button(btn: Button, accent: Color = GOLD) -> void:
	btn.add_theme_stylebox_override("normal", action_button(accent))
	btn.add_theme_stylebox_override("hover", action_button_hover(accent))
	btn.add_theme_stylebox_override("pressed", action_button_hover(accent))
	btn.add_theme_stylebox_override("disabled", action_button_disabled())
	btn.add_theme_color_override("font_color", TEXT)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 16)


## 数量 − / +：不透明圆钮，避免半透明底透出 SpinBox 竖线
static func apply_qty_step_button(btn: Button, accent: Color = CYAN) -> void:
	var n := StyleBoxFlat.new()
	n.bg_color = Color(0.1, 0.15, 0.24, 1.0)
	n.border_width_left = 2
	n.border_width_top = 2
	n.border_width_right = 2
	n.border_width_bottom = 2
	n.border_color = Color(accent, 0.95)
	n.corner_radius_top_left = 18
	n.corner_radius_top_right = 18
	n.corner_radius_bottom_left = 18
	n.corner_radius_bottom_right = 18
	n.content_margin_left = 2
	n.content_margin_right = 2
	n.content_margin_top = 2
	n.content_margin_bottom = 2
	n.shadow_color = Color(accent, 0.35)
	n.shadow_size = 6
	var h := n.duplicate() as StyleBoxFlat
	h.bg_color = Color(accent.r * 0.35 + 0.1, accent.g * 0.35 + 0.12, accent.b * 0.35 + 0.18, 1.0)
	h.border_color = Color(accent.lightened(0.2), 1.0)
	h.shadow_size = 10
	btn.add_theme_stylebox_override("normal", n)
	btn.add_theme_stylebox_override("hover", h)
	btn.add_theme_stylebox_override("pressed", h)
	btn.add_theme_stylebox_override("disabled", action_button_disabled())
	btn.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	btn.add_theme_color_override("font_color", Color("#f2f7ff"))
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 20)
	btn.clip_text = false
	btn.focus_mode = Control.FOCUS_NONE


static func compact_gold_chip() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#18140c")
	sb.border_width_left = 2
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 3
	sb.border_color = Color(COIN, 0.55)
	sb.corner_radius_top_left = 10
	sb.corner_radius_top_right = 10
	sb.corner_radius_bottom_left = 10
	sb.corner_radius_bottom_right = 10
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 4
	sb.content_margin_bottom = 4
	return sb


static func compact_gold_chip_hover() -> StyleBoxFlat:
	var sb := compact_gold_chip()
	sb.bg_color = Color("#2a2210")
	sb.border_color = Color(COIN, 0.9)
	return sb


static func apply_trade_open_button(btn: Button) -> void:
	btn.add_theme_stylebox_override("normal", compact_gold_chip())
	btn.add_theme_stylebox_override("hover", compact_gold_chip_hover())
	btn.add_theme_stylebox_override("pressed", compact_gold_chip_hover())
	btn.add_theme_stylebox_override("disabled", action_button_disabled())
	btn.add_theme_color_override("font_color", COIN)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 15)


static func icon_tool_button(accent: Color = GOLD) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#12161c")
	sb.border_width_left = 2
	sb.border_width_top = 2
	sb.border_width_right = 2
	sb.border_width_bottom = 3
	sb.border_color = Color(accent, 0.75)
	sb.corner_radius_top_left = 0
	sb.corner_radius_top_right = 0
	sb.corner_radius_bottom_left = 0
	sb.corner_radius_bottom_right = 0
	sb.content_margin_left = 4
	sb.content_margin_right = 4
	sb.content_margin_top = 4
	sb.content_margin_bottom = 4
	return sb


static func icon_tool_button_hover(accent: Color = GOLD) -> StyleBoxFlat:
	var sb := icon_tool_button(accent)
	sb.bg_color = Color("#1e2430")
	sb.border_color = Color(accent, 1.0)
	return sb


static func apply_icon_tool_button(btn: Button, accent: Color = GOLD) -> void:
	btn.add_theme_stylebox_override("normal", icon_tool_button(accent))
	btn.add_theme_stylebox_override("hover", icon_tool_button_hover(accent))
	btn.add_theme_stylebox_override("pressed", icon_tool_button_hover(accent))
	btn.add_theme_stylebox_override("disabled", action_button_disabled())
	btn.text = ""


static func apply_icon_only_button(btn: Button) -> void:
	var empty := StyleBoxEmpty.new()
	btn.flat = true
	btn.text = ""
	btn.add_theme_stylebox_override("normal", empty)
	btn.add_theme_stylebox_override("hover", empty)
	btn.add_theme_stylebox_override("pressed", empty)
	btn.add_theme_stylebox_override("disabled", empty)
	btn.add_theme_stylebox_override("focus", empty)
	btn.add_theme_color_override("font_color", Color(1, 1, 1, 0))
	btn.add_theme_color_override("font_hover_color", Color(1, 1, 1, 0))
	btn.modulate = Color.WHITE


## 圆形玻璃 FAB（仅主菜单等需要时用）
static func apply_glass_fab_button(btn: Button, accent: Color = CYAN) -> void:
	btn.flat = true
	btn.text = ""
	var n := StyleBoxFlat.new()
	n.bg_color = Color(0.08, 0.12, 0.2, 0.55)
	n.border_width_left = 1
	n.border_width_top = 1
	n.border_width_right = 1
	n.border_width_bottom = 1
	n.border_color = Color(accent, 0.7)
	n.corner_radius_top_left = 28
	n.corner_radius_top_right = 28
	n.corner_radius_bottom_left = 28
	n.corner_radius_bottom_right = 28
	n.shadow_color = Color(accent, 0.3)
	n.shadow_size = 10
	n.content_margin_left = 8
	n.content_margin_right = 8
	n.content_margin_top = 8
	n.content_margin_bottom = 8
	var h := n.duplicate() as StyleBoxFlat
	h.bg_color = Color(accent.r, accent.g, accent.b, 0.22)
	h.border_color = Color(accent.lightened(0.2), 1.0)
	h.shadow_size = 14
	btn.add_theme_stylebox_override("normal", n)
	btn.add_theme_stylebox_override("hover", h)
	btn.add_theme_stylebox_override("pressed", h)
	btn.add_theme_stylebox_override("disabled", n)
	btn.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	btn.add_theme_color_override("font_color", Color(1, 1, 1, 0))
	btn.add_theme_color_override("font_hover_color", Color(1, 1, 1, 0))
	btn.modulate = Color.WHITE
