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


static func pixel_frame(accent: Color = GOLD) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = PANEL
	sb.border_width_left = 4
	sb.border_width_top = 4
	sb.border_width_right = 4
	sb.border_width_bottom = 5
	sb.border_color = accent
	sb.corner_radius_top_left = 0
	sb.corner_radius_top_right = 0
	sb.corner_radius_bottom_left = 0
	sb.corner_radius_bottom_right = 0
	sb.shadow_color = Color(0, 0, 0, 0.65)
	sb.shadow_size = 0
	sb.shadow_offset = Vector2(5, 5)
	sb.content_margin_left = 6
	sb.content_margin_right = 6
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	return sb


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
	sb.bg_color = Color(accent, 0.12)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(accent, 0.55)
	sb.corner_radius_top_left = 3
	sb.corner_radius_top_right = 3
	sb.corner_radius_bottom_left = 3
	sb.corner_radius_bottom_right = 3
	return sb


static func apply_shop_card_button(btn: Button, accent: Color) -> void:
	btn.add_theme_stylebox_override("normal", shop_card_upgrade_btn(accent))
	btn.add_theme_stylebox_override("hover", shop_card_upgrade_btn(Color(accent.lightened(0.15), 1.0)))
	btn.add_theme_stylebox_override("pressed", shop_card_upgrade_btn(accent))
	btn.add_theme_stylebox_override("disabled", action_button_disabled())
	btn.add_theme_color_override("font_color", TEXT)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)


static func apply_action_button(btn: Button, accent: Color = GOLD) -> void:
	btn.add_theme_stylebox_override("normal", action_button(accent))
	btn.add_theme_stylebox_override("hover", action_button_hover(accent))
	btn.add_theme_stylebox_override("pressed", action_button_hover(accent))
	btn.add_theme_stylebox_override("disabled", action_button_disabled())
	btn.add_theme_color_override("font_color", TEXT)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 16)
