class_name UiIcons
extends RefCounted

const PATH_COIN := "res://assets/favour_mirror/game/gold3.png"
const PATH_MONEY_HUD := "res://assets/ui/money_bag.png"
const PATH_EXCHANGE := "res://assets/ui/money_bag.png"
const PATH_TRADE := "res://assets/ui/coin_stack.png"
const PATH_SELL := "res://assets/ui/coin_stack.png"
const PATH_STATUS := "res://assets/ui/sz.png"


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


## 矢量背包（无贴图时回退）
class BagGlyph extends Control:
	func _init(size: float = 22.0) -> void:
		var side: int = maxi(1, int(round(size)))
		custom_minimum_size = Vector2(side, side)
		size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		size_flags_vertical = Control.SIZE_SHRINK_CENTER
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var s: float = minf(size.x, size.y)
		var o := Vector2((size.x - s) * 0.5, (size.y - s) * 0.5)
		var body := Rect2(o.x + s * 0.18, o.y + s * 0.34, s * 0.64, s * 0.52)
		var flap := Rect2(o.x + s * 0.18, o.y + s * 0.28, s * 0.64, s * 0.16)
		var leather := Color("#c4841a")
		var leather_dk := Color("#8a5a12")
		var stitch := Color("#ffe566")
		draw_rect(body, leather, true)
		draw_rect(body, leather_dk, false, maxf(1.2, s * 0.06))
		draw_rect(flap, leather.lightened(0.12), true)
		draw_rect(flap, leather_dk, false, maxf(1.0, s * 0.05))
		# 顶带
		var strap_w: float = s * 0.12
		draw_rect(Rect2(o.x + s * 0.30, o.y + s * 0.12, strap_w, s * 0.28), leather_dk, true)
		draw_rect(Rect2(o.x + s * 0.58, o.y + s * 0.12, strap_w, s * 0.28), leather_dk, true)
		# 扣
		var buckle := Rect2(o.x + s * 0.42, o.y + s * 0.48, s * 0.16, s * 0.14)
		draw_rect(buckle, stitch, true)
		draw_rect(buckle, leather_dk, false, 1.0)


## 状态标题用：青色环 + 矿层条（小尺寸清晰，不用木底齿轮）
class StatusMarkGlyph extends Control:
	func _init(size: float = 24.0) -> void:
		var side: int = maxi(1, int(round(size)))
		custom_minimum_size = Vector2(side, side)
		size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		size_flags_vertical = Control.SIZE_SHRINK_CENTER
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var s: float = minf(size.x, size.y)
		var c := Vector2(size.x * 0.5, size.y * 0.5)
		var r: float = s * 0.42
		var ring := UiStyle.CYAN
		var ink := Color("#0a1520")
		draw_circle(c, r, Color(ring, 0.16))
		draw_arc(c, r * 0.92, 0.0, TAU, 40, ring, maxf(1.8, s * 0.08), true)
		# 三层矿带
		var bars: Array = [
			{"y": -0.18, "w": 0.46, "col": UiStyle.COIN},
			{"y": 0.0, "w": 0.38, "col": Color("#c8d0dc")},
			{"y": 0.18, "w": 0.30, "col": Color("#7a8494")},
		]
		for b in bars:
			var half_w: float = s * float(b["w"]) * 0.5
			var by: float = c.y + s * float(b["y"])
			var h: float = maxf(2.2, s * 0.09)
			var rect := Rect2(c.x - half_w, by - h * 0.5, half_w * 2.0, h)
			draw_rect(rect, b["col"], true)
			draw_rect(rect, ink, false, 1.0)


## 矢量兑换：双向循环箭头（无贴图时回退）
class ExchangeGlyph extends Control:
	func _init(size: float = 22.0) -> void:
		var side: int = maxi(1, int(round(size)))
		custom_minimum_size = Vector2(side, side)
		size_flags_horizontal = Control.SIZE_SHRINK_CENTER
		size_flags_vertical = Control.SIZE_SHRINK_CENTER
		mouse_filter = Control.MOUSE_FILTER_IGNORE

	func _draw() -> void:
		var s: float = minf(size.x, size.y)
		var c := Vector2(size.x * 0.5, size.y * 0.5)
		var r: float = s * 0.34
		var sw: float = maxf(2.0, s * 0.11)
		var gold := UiStyle.COIN
		var ink := Color("#5a3a08")
		_draw_arc_arrow(c, r, -PI * 0.85, PI * 0.15, sw, gold, ink, true)
		_draw_arc_arrow(c, r, PI * 0.15, PI * 1.15, sw, gold, ink, true)

	func _draw_arc_arrow(
		center: Vector2,
		radius: float,
		a0: float,
		a1: float,
		sw: float,
		body: Color,
		outline: Color,
		cw: bool
	) -> void:
		var pts: PackedVector2Array = PackedVector2Array()
		var steps: int = 14
		for i in range(steps + 1):
			var t: float = float(i) / float(steps)
			var a: float = lerpf(a0, a1, t)
			pts.append(center + Vector2(cos(a), sin(a)) * radius)
		for i in range(pts.size() - 1):
			draw_line(pts[i], pts[i + 1], outline, sw + 1.2)
		for i in range(pts.size() - 1):
			draw_line(pts[i], pts[i + 1], body, sw)
		var tip_a: float = a1
		var tip: Vector2 = center + Vector2(cos(tip_a), sin(tip_a)) * radius
		var tang: float = tip_a + (PI * 0.5 if cw else -PI * 0.5)
		var head: float = maxf(4.0, radius * 0.42)
		var p1: Vector2 = tip + Vector2(cos(tang + 0.9), sin(tang + 0.9)) * head
		var p2: Vector2 = tip + Vector2(cos(tang - 0.9), sin(tang - 0.9)) * head
		draw_colored_polygon(PackedVector2Array([tip, p1, p2]), body)
		draw_line(tip, p1, outline, 1.0)
		draw_line(tip, p2, outline, 1.0)


static func texture_coin() -> Texture2D:
	return _load_tex_key("coin")


static func texture_money_hud() -> Texture2D:
	return _load_tex_key("money_hud")


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
		"money_hud":
			return _load_tex(PATH_MONEY_HUD)
		"icon_exchange":
			return _load_tex(PATH_EXCHANGE)
		"icon_status":
			return _load_tex(PATH_STATUS)
		"trade":
			return _load_tex(PATH_TRADE)
		"sell":
			return _load_tex(PATH_SELL)
		_:
			return null


static func coin(diameter: float = 16.0, animate: bool = false) -> Control:
	return TexGlyph.new(_load_tex_key("coin"), diameter, animate)


## 左上角持有金币数（绿钱袋）
static func money_hud(size: float = 48.0, animate: bool = false) -> Control:
	var tex: Texture2D = _load_tex_key("money_hud")
	if tex == null:
		return coin(size, animate)
	return TexGlyph.new(tex, size, animate)


static func trade(size: float = 20.0) -> Control:
	return exchange(size)


static func exchange(size: float = 22.0) -> Control:
	var tex: Texture2D = _load_tex_key("icon_exchange")
	if tex != null:
		return TexGlyph.new(tex, size, false)
	return ExchangeGlyph.new(size)


static func status(size: float = 26.0) -> Control:
	return TexGlyph.new(_load_tex_key("icon_status"), size, false)


## 状态弹窗标题旁的清晰小标（非 sz 齿轮）
static func status_mark(size: float = 24.0) -> Control:
	return StatusMarkGlyph.new(size)


## 矿石背包标题左侧：矢量背包（与钱袋区分）
static func bag(size: float = 22.0) -> Control:
	return BagGlyph.new(size)


static func bag_ore_texture(type_id: int, side_px: int) -> Texture2D:
	# 背包只用语义明确的贴图；铁矿/钻石用矢量（mine2/zs 缩成小图会像光球）
	if type_id != 4:
		return null
	var tex: Texture2D = _load_tex_key("coin")
	if tex == null:
		tex = _load_tex_key("ore_gold")
	return _texture_for_display(tex, side_px)


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
