class_name UiIcons
extends RefCounted

const PATH_COIN := "res://assets/favour_mirror/game/gold3.png"
const PATH_EXCHANGE := "res://assets/favour_mirror/game/gold3.png"
const PATH_TRADE := "res://assets/ui/coin_stack.png"
const PATH_SELL := "res://assets/ui/coin_stack.png"


class TexGlyph extends Control:
	var _inner: TextureRect
	var _animate: bool

	func _init(tex: Texture2D, size: float, animate: bool) -> void:
		_animate = animate
		var side: int = maxi(1, int(round(size)))
		custom_minimum_size = Vector2(side, side)
		size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		size_flags_vertical = Control.SIZE_SHRINK_CENTER
		mouse_filter = Control.MOUSE_FILTER_IGNORE
		texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
		_inner = TextureRect.new()
		_inner.set_anchors_preset(Control.PRESET_FULL_RECT)
		_inner.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		_inner.stretch_mode = TextureRect.STRETCH_KEEP
		_inner.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
		_inner.texture = UiIcons._texture_for_display(tex, side)
		_inner.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(_inner)
		if tex == null:
			queue_redraw()

	func _draw() -> void:
		if _inner.texture != null:
			return
		var sz: Vector2 = custom_minimum_size
		var r: float = minf(sz.x, sz.y) * 0.42
		var c: Vector2 = sz * 0.5
		draw_circle(c, r, UiStyle.COIN)

	func _ready() -> void:
		if _animate and _inner.texture != null:
			_start_idle()

	func _start_idle() -> void:
		var tw: Tween = create_tween().set_loops()
		tw.tween_property(_inner, "scale", Vector2(1.08, 1.08), 0.75).set_trans(Tween.TRANS_SINE)
		tw.tween_property(_inner, "scale", Vector2.ONE, 0.75).set_trans(Tween.TRANS_SINE)


static func texture_coin() -> Texture2D:
	return _load_tex_key("coin")


static func texture_trade() -> Texture2D:
	return _load_tex_key("icon_exchange")


static func texture_status() -> Texture2D:
	return _load_tex_key("icon_status")


static func texture_bag() -> Texture2D:
	return _load_tex_key("icon_bag")


static func texture_sell() -> Texture2D:
	return _load_tex_key("sell")


static func _load_tex(path: String) -> Texture2D:
	if ResourceLoader.exists(path):
		return load(path) as Texture2D
	return null


static func _texture_for_display(tex: Texture2D, side_px: int) -> Texture2D:
	if tex == null or side_px <= 0:
		return tex
	var img: Image = tex.get_image()
	if img == null or img.is_empty():
		return tex
	if img.get_width() == side_px and img.get_height() == side_px:
		return tex
	var scaled: Image = img.duplicate()
	scaled.resize(side_px, side_px, Image.INTERPOLATE_LANCZOS)
	return ImageTexture.create_from_image(scaled)


static func _load_tex_key(key: String) -> Texture2D:
	var t: Texture2D = UiArt.texture(key)
	if t != null:
		return t
	match key:
		"coin":
			return _load_tex(PATH_COIN)
		"icon_exchange":
			return _load_tex(PATH_EXCHANGE)
		"trade":
			return _load_tex(PATH_TRADE)
		"sell":
			return _load_tex(PATH_SELL)
		_:
			return null


static func coin(diameter: float = 16.0, animate: bool = false) -> Control:
	return TexGlyph.new(_load_tex_key("coin"), diameter, animate)


static func trade(size: float = 20.0) -> Control:
	return TexGlyph.new(_load_tex_key("icon_exchange"), size, false)


static func exchange(size: float = 22.0) -> Control:
	return TexGlyph.new(_load_tex_key("icon_exchange"), size, false)


static func status(size: float = 26.0) -> Control:
	return TexGlyph.new(_load_tex_key("icon_status"), size, false)


static func bag(size: float = 22.0) -> Control:
	return TexGlyph.new(_load_tex_key("icon_bag"), size, false)


static func sell(size: float = 18.0) -> Control:
	return TexGlyph.new(_load_tex_key("sell"), size, false)


static func coin_with_amount(text: String, font_size: int = 16, gap: int = 6) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", gap)
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_child(coin(maxf(14.0, float(font_size) * 0.9), false))
	var lbl := Label.new()
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", font_size)
	lbl.add_theme_color_override("font_color", UiStyle.COIN)
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row.add_child(lbl)
	return row
