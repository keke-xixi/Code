class_name ImageMatte
extends RefCounted

## money 已用 #0a1521 底图，不再运行时抠底
const STRIP_REL_SUFFIXES := []
const HUD_ICON_BG := Color("#0a1521")

const BG_DISTANCE := 0.14


## 半透明像素压到 HUD 底色 #0a1521（与侧边栏一致）
static func flatten_to_hud_bg(img: Image) -> Image:
	if img == null or img.is_empty():
		return img
	var out: Image = img.duplicate()
	out.convert(Image.FORMAT_RGBA8)
	var bg: Color = HUD_ICON_BG
	for y in range(out.get_height()):
		for x in range(out.get_width()):
			var c: Color = out.get_pixel(x, y)
			if c.a >= 0.998:
				continue
			var a: float = c.a
			var flat := Color(
				c.r * a + bg.r * (1.0 - a),
				c.g * a + bg.g * (1.0 - a),
				c.b * a + bg.b * (1.0 - a),
				1.0,
			)
			out.set_pixel(x, y, flat)
	return out


static func should_strip(relative_or_path: String) -> bool:
	var p: String = relative_or_path.replace("\\", "/").to_lower()
	for suf in STRIP_REL_SUFFIXES:
		if p.ends_with(suf):
			return true
	return false


static func should_prepare_hud_icon(relative_or_path: String) -> bool:
	var p: String = relative_or_path.replace("\\", "/").to_lower()
	return (
		p.ends_with("gold3.png")
		or p.ends_with("gold_coin.png")
		or p.ends_with("gold2.png")
		or p.ends_with("money_bag.png")
		or p.ends_with("money.png")
	)


static func prepare_hud_icon(img: Image) -> Image:
	return strip_edge_background(img)


## 只去掉与四角同色、从边缘连通的底（不泛洪整图「所有绿色」）
static func strip_green_edges(img: Image) -> Image:
	return strip_edge_background(img)


static func strip_edge_background(img: Image) -> Image:
	if img == null or img.is_empty():
		return img
	var out: Image = img.duplicate()
	out.convert(Image.FORMAT_RGBA8)
	var w: int = out.get_width()
	var h: int = out.get_height()
	if w < 2 or h < 2:
		return out
	var bg: Color = _estimate_corner_background(out)
	var visited: PackedByteArray = PackedByteArray()
	visited.resize(w * h)
	var queue: Array[Vector2i] = []

	for x in range(w):
		_seed_if_bg(out, visited, queue, Vector2i(x, 0), bg, w)
		_seed_if_bg(out, visited, queue, Vector2i(x, h - 1), bg, w)
	for y in range(h):
		_seed_if_bg(out, visited, queue, Vector2i(0, y), bg, w)
		_seed_if_bg(out, visited, queue, Vector2i(w - 1, y), bg, w)

	while not queue.is_empty():
		var p: Vector2i = queue.pop_back()
		var idx: int = p.y * w + p.x
		if visited[idx] != 0:
			continue
		var c: Color = out.get_pixel(p.x, p.y)
		if not _is_background(c, bg):
			continue
		visited[idx] = 1
		var cleared: Color = c
		cleared.a = 0.0
		out.set_pixel(p.x, p.y, cleared)
		for d in [Vector2i(-1, 0), Vector2i(1, 0), Vector2i(0, -1), Vector2i(0, 1)]:
			var n: Vector2i = p + d
			if n.x < 0 or n.y < 0 or n.x >= w or n.y >= h:
				continue
			if visited[n.y * w + n.x] != 0:
				continue
			if _is_background(out.get_pixel(n.x, n.y), bg):
				queue.append(n)
	return _sharpen_alpha(_boost_visible(out))


static func _estimate_corner_background(img: Image) -> Color:
	var w: int = img.get_width()
	var h: int = img.get_height()
	var pts: Array[Vector2i] = [
		Vector2i(0, 0),
		Vector2i(w - 1, 0),
		Vector2i(0, h - 1),
		Vector2i(w - 1, h - 1),
	]
	var sum := Color(0, 0, 0, 0)
	var n: int = 0
	for p in pts:
		var c: Color = img.get_pixel(p.x, p.y)
		if c.a < 0.05:
			continue
		sum.r += c.r
		sum.g += c.g
		sum.b += c.b
		n += 1
	if n == 0:
		return Color(0.2, 0.75, 0.35, 1.0)
	sum.r /= float(n)
	sum.g /= float(n)
	sum.b /= float(n)
	sum.a = 1.0
	return sum


static func _is_background(c: Color, bg: Color) -> bool:
	if c.a < 0.04:
		return true
	return _color_dist(c, bg) <= BG_DISTANCE


static func _color_dist(a: Color, b: Color) -> float:
	return sqrt(
		(a.r - b.r) * (a.r - b.r) + (a.g - b.g) * (a.g - b.g) + (a.b - b.b) * (a.b - b.b)
	)


static func _seed_if_bg(
	img: Image,
	visited: PackedByteArray,
	queue: Array[Vector2i],
	p: Vector2i,
	bg: Color,
	w: int,
) -> void:
	var idx: int = p.y * w + p.x
	if visited[idx] != 0:
		return
	if _is_background(img.get_pixel(p.x, p.y), bg):
		queue.append(p)


## 透明底上略提亮，暗色 HUD 里更清晰
static func _sharpen_alpha(img: Image) -> Image:
	var out: Image = img.duplicate()
	out.convert(Image.FORMAT_RGBA8)
	for y in range(out.get_height()):
		for x in range(out.get_width()):
			var c: Color = out.get_pixel(x, y)
			if c.a < 0.12:
				c.a = 0.0
			elif c.a > 0.65:
				c.a = 1.0
			out.set_pixel(x, y, c)
	return out


static func _boost_visible(img: Image) -> Image:
	var out: Image = img.duplicate()
	out.convert(Image.FORMAT_RGBA8)
	for y in range(out.get_height()):
		for x in range(out.get_width()):
			var c: Color = out.get_pixel(x, y)
			if c.a < 0.08:
				continue
			c.r = clampf(c.r * 1.12 + 0.04, 0.0, 1.0)
			c.g = clampf(c.g * 1.12 + 0.04, 0.0, 1.0)
			c.b = clampf(c.b * 1.08 + 0.03, 0.0, 1.0)
			out.set_pixel(x, y, c)
	return out
