class_name UiArt
extends RefCounted

## 优先 D:\zg\design\favour\public\img（FavourArt），其次 res://assets 备份

const PATHS := {
	"coin": [
		"res://assets/favour_mirror/game/gold3.png",
		"res://assets/favour_mirror/game/gold2.png",
		"res://assets/ui/coin_clover.png",
	],
	"trade": [
		"res://assets/favour_mirror/game/money.png",
		"res://assets/favour_mirror/game/gold2.png",
		"res://assets/ui/coin_stack.png",
	],
	"icon_exchange": [
		"res://assets/favour_mirror/game/gold3.png",
		"res://assets/favour_mirror/game/gold2.png",
		"res://assets/ui/coin_stack.png",
	],
	"icon_status": [
		"res://assets/favour_mirror/game/wq.png",
		"res://assets/favour_mirror/game/score.png",
	],
	"icon_bag": [
		"res://assets/favour_mirror/mouse/bx2.png",
		"res://assets/favour_mirror/mouse/bx4.png",
	],
	"ore_4": ["res://assets/favour_mirror/game/gold.png"],
	"ore_5": ["res://assets/favour_mirror/game/zs.png"],
	"ore_diamond": ["res://assets/favour_mirror/game/zs.png"],
	"ore_gold": [
		"res://assets/favour_mirror/game/gold.png",
		"res://assets/favour_mirror/game/gold2.png",
	],
	"ore_coin": ["res://assets/favour_mirror/game/money.png"],
	"sell": [
		"res://assets/favour_mirror/game/gold2.png",
		"res://assets/ui/coin_stack.png",
	],
	"score": ["res://assets/favour_mirror/game/score.png"],
	"btn_game": [
		"res://assets/favour_mirror/game/start.png",
		"res://assets/ui/start_btn.png",
		"res://assets/game/start_btn.png",
	],
	"tile_ground": [
		"res://assets/ui/bg9.png",
		"res://assets/ui/tile_ground.png",
	],
	"play_bg": [
		"res://assets/favour_mirror/game/bg3.png",
		"res://assets/ui/bg9.png",
	],
	"loading": [
		"res://assets/favour_mirror/gif/loading2.gif",
		"res://assets/ui/loading_anim.gif",
	],
}


static func texture(key: String) -> Texture2D:
	var fav: Node = _favour_art()
	if fav != null and fav.has_method("texture_for_key"):
		var from_favour: Texture2D = fav.call("texture_for_key", key) as Texture2D
		if from_favour != null:
			return from_favour
	if not PATHS.has(key):
		return null
	for path in PATHS[key]:
		if ResourceLoader.exists(path):
			return _load_texture_path(path)
	return null


static func _load_texture_path(path: String) -> Texture2D:
	if ImageMatte.should_strip(path) or ImageMatte.should_prepare_hud_icon(path):
		var abs: String = ProjectSettings.globalize_path(path)
		var img := Image.load_from_file(abs)
		if img != null and not img.is_empty():
			if ImageMatte.should_strip(path):
				img = ImageMatte.strip_green_edges(img)
			else:
				img = ImageMatte.prepare_hud_icon(img)
			return ImageTexture.create_from_image(img)
	return load(path) as Texture2D


static func _favour_art() -> Node:
	var tree: SceneTree = Engine.get_main_loop() as SceneTree
	if tree == null:
		return null
	return tree.root.get_node_or_null("FavourArt")


static func apply_game_button(btn: Button, fallback_accent: Color = UiStyle.GOLD) -> void:
	var tex: Texture2D = texture("btn_game")
	if tex == null:
		UiStyle.apply_icon_tool_button(btn, fallback_accent)
		return
	var sb := StyleBoxTexture.new()
	sb.texture = tex
	sb.texture_margin_left = 14
	sb.texture_margin_top = 12
	sb.texture_margin_right = 14
	sb.texture_margin_bottom = 16
	sb.modulate_color = Color(1, 1, 1, 0.96)
	btn.add_theme_stylebox_override("normal", sb)
	var sb_h := sb.duplicate() as StyleBoxTexture
	sb_h.modulate_color = Color(1.1, 1.1, 1.05, 1.0)
	btn.add_theme_stylebox_override("hover", sb_h)
	btn.add_theme_stylebox_override("pressed", sb_h)
	btn.add_theme_color_override("font_color", UiStyle.INK)
	btn.add_theme_color_override("font_hover_color", UiStyle.INK)
