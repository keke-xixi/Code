class_name OreVisual
extends RefCounted

const ROCK_TOP := Color("#2a2420")
const ROCK_BOTTOM := Color("#12100e")
const ROCK_EDGE := Color("#3d3530")

const DIRT_TOP := Color("#8b5a2b")
const DIRT_MID := Color("#6b4423")
const DIRT_BOTTOM := Color("#4a2f18")
const DIRT_EDGE := Color("#a06838")

const STONE_TOP := Color("#5a5652")
const STONE_MID := Color("#3d3a36")
const STONE_BOTTOM := Color("#252320")
const STONE_EDGE := Color("#6e6a64")


static func draw_mined_pit(canvas: CanvasItem, inner: Rect2) -> void:
	var pit := Color("#08090c")
	var pit_in := Color("#151820")
	canvas.draw_rect(inner, pit, true)
	canvas.draw_rect(inner.grow(-4), pit_in, true)
	canvas.draw_line(
		inner.position + Vector2(4, 4),
		inner.position + inner.size - Vector2(6, 6),
		Color(0, 0, 0, 0.35),
		1.0,
	)


## 未凿开：只画围岩，不暴露矿种（设置里「预览矿石」或探测器除外）
static func draw_rock_shell(
	canvas: CanvasItem,
	inner: Rect2,
	grid_pos: Vector2i,
	ore_type_id: int,
	meta: Dictionary,
	debug_show_ore: bool,
	show_from: String,
	ore_rarity: String,
	det_r: int,
	player: Vector2i,
) -> void:
	var host: String = _host_shell_kind(grid_pos.y)
	match host:
		"dirt":
			_draw_dirt_shell(canvas, inner, grid_pos)
		"stone":
			_draw_stone_shell(canvas, inner, grid_pos)
		_:
			_draw_deep_rock_shell(canvas, inner, grid_pos)

	# 仅调试选项：透视全图矿种
	if debug_show_ore and ore_type_id >= 3:
		draw_gem(canvas, inner, meta, 0.22, ore_type_id)

	if det_r > 0 and _manhattan(player, grid_pos) <= det_r:
		if UpgradeSystem.rarity_meets(ore_rarity, show_from):
			_draw_detector_ping(canvas, inner, grid_pos)


static func draw_exposed(canvas: CanvasItem, inner: Rect2, meta: Dictionary, type_id: int, grid_pos: Vector2i) -> void:
	var glow: Color = meta.get("glow", Color.WHITE)
	canvas.draw_rect(inner.grow(-1), Color("#1c1816"), true)
	canvas.draw_rect(inner.grow(-2), Color("#252018").lerp(glow, 0.12), true)
	draw_gem(canvas, inner, meta, 1.0, type_id)
	if type_id == 1:
		_draw_dirt_crumbs(canvas, inner, _hash_pos(grid_pos), 4)


static func draw_gem(canvas: CanvasItem, inner: Rect2, meta: Dictionary, alpha: float, type_id: int = 0) -> void:
	if alpha >= 0.85 and type_id > 2:
		var tex: Texture2D = texture_for_ui(type_id)
		if tex != null:
			var pad: Rect2 = inner.grow(-5)
			canvas.draw_texture_rect(tex, pad, false, Color(1, 1, 1, alpha))
			if type_id == 5:
				_draw_sparkle_triangles(canvas, inner.get_center() + Vector2(0, -inner.size.y * 0.22), alpha)
			return
	if alpha >= 0.85 and type_id <= 2:
		draw_ui_icon(canvas, inner, type_id)
		return

	var ore_color: Color = meta.get("color", Color.GRAY)
	var ore_glow: Color = meta.get("glow", Color.WHITE)
	ore_color.a = alpha
	ore_glow.a = alpha
	var shape: String = str(meta.get("shape", "chunk"))
	var c: Vector2 = inner.get_center()
	var r: float = inner.size.x * 0.22
	match shape:
		"crystal":
			if type_id == 5:
				_draw_brilliant_diamond(canvas, c, r * 1.35, alpha)
			elif type_id == 6:
				_draw_crystal_shard(canvas, c, r * 1.1, ore_color, ore_glow, alpha)
				_draw_sparkle_triangles(canvas, c + Vector2(r * 0.4, -r * 0.55), alpha * 0.9)
			else:
				_draw_crystal_shard(canvas, c, r, ore_color, ore_glow, alpha)
		"metal":
			_draw_metal_nugget(canvas, c, r, ore_color, ore_glow, alpha)
		"void":
			_draw_void_core(canvas, c, r, ore_color, ore_glow, alpha, type_id)
		_:
			if type_id == 1 or str(meta.get("name", "")) == "泥土":
				_draw_dirt_clod(canvas, inner, alpha)
			elif type_id == 2:
				_draw_stone_chunk(canvas, c, r, alpha)
			else:
				canvas.draw_circle(c, r, ore_color)
				canvas.draw_circle(c, r * 0.65, ore_color.lightened(0.12))
				var ring: Color = ore_glow
				ring.a *= 0.35
				canvas.draw_circle(c, r * 1.05, ring)


static func texture_for_ui(type_id: int) -> Texture2D:
	# 背包/兑换只用矿物向素材；data/img* 多为商城立绘（带白底人像）
	if type_id <= 2:
		return null
	match type_id:
		3:
			return null
		4:
			return UiArt.texture("ore_gold")
		5:
			return UiArt.texture("ore_diamond")
		6, 7, 8:
			return null
		_:
			return UiArt.texture("ore_%d" % type_id)


static func draw_ui_icon(canvas: CanvasItem, rect: Rect2, type_id: int) -> void:
	match type_id:
		1:
			_draw_dirt_clod(canvas, rect.grow(-2), 1.0)
		2:
			var c2: Vector2 = rect.get_center()
			var r2: float = minf(rect.size.x, rect.size.y) * 0.36
			_draw_stone_chunk(canvas, c2, r2, 1.0)
		_:
			var tex: Texture2D = texture_for_ui(type_id)
			if tex != null:
				canvas.draw_texture_rect(tex, rect.grow(-2), false)
				if type_id == 5:
					_draw_sparkle_triangles(canvas, rect.get_center() + Vector2(0, -rect.size.y * 0.2), 1.0)
				return
			var meta: Dictionary = GameData.ore_meta(type_id)
			draw_gem(canvas, rect.grow(-3), meta, 1.0, type_id)


static func draw_bag_icon(canvas: CanvasItem, rect: Rect2, type_id: int) -> void:
	var pad: Rect2 = rect.grow(-2)
	var c: Vector2 = pad.get_center()
	var s: float = minf(pad.size.x, pad.size.y)
	var r: float = s * 0.4
	var meta: Dictionary = GameData.ore_meta(type_id)
	var ore_color: Color = meta.get("color", Color.GRAY)
	var ore_glow: Color = meta.get("glow", Color.WHITE)
	match type_id:
		1:
			_draw_bag_dirt_cartoon(canvas, c, r, 1.0)
		2:
			_draw_bag_stone_icon(canvas, pad)
		3:
			_draw_bag_iron_ingot_icon(canvas, pad)
		4:
			_draw_bag_gold_icon(canvas, pad)
		5:
			_draw_bag_diamond_icon(canvas, pad)
		6:
			_draw_red_matter_crystal(canvas, c, r, ore_color, ore_glow, 1.0)
		7:
			_draw_void_crystal_shard(canvas, c, r, ore_color, ore_glow, 1.0)
		8:
			_draw_black_hole_fragment(canvas, c, r, 1.0)
		_:
			draw_ui_icon(canvas, rect, type_id)


static func _host_shell_kind(grid_y: int) -> String:
	if grid_y < 10:
		return "dirt"
	if grid_y < 50:
		return "stone"
	return "deep"


static func _ore_texture(type_id: int) -> Texture2D:
	if type_id >= 3:
		var keyed: Texture2D = UiArt.texture("ore_%d" % type_id)
		if keyed != null:
			return keyed
	match type_id:
		5:
			return UiArt.texture("ore_diamond")
		4:
			return UiArt.texture("ore_gold")
		_:
			return null


static func _draw_detector_ping(canvas: CanvasItem, inner: Rect2, grid_pos: Vector2i) -> void:
	var h: int = _hash_pos(grid_pos)
	var c: Vector2 = inner.get_center()
	var pulse: Color = Color(0.75, 0.9, 1.0, 0.45)
	canvas.draw_rect(inner.grow(-2), pulse, false, 1.5)
	for i in range(3):
		var ang: float = float((h + i * 120) % 360) * TAU / 360.0
		var p: Vector2 = c + Vector2(cos(ang), sin(ang)) * inner.size.x * 0.28
		canvas.draw_circle(p, 2.0, Color(1, 1, 1, 0.35))


static func _draw_brilliant_diamond(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var w: float = r * 1.05
	var crown_h: float = r * 0.55
	var table_y: float = c.y - crown_h * 0.35
	var crown: PackedVector2Array = PackedVector2Array([
		c + Vector2(-w, table_y),
		c + Vector2(0, c.y - crown_h),
		c + Vector2(w, table_y),
		c + Vector2(0, c.y + r * 0.05),
	])
	var pavilion: PackedVector2Array = PackedVector2Array([
		c + Vector2(-w * 0.92, table_y + r * 0.08),
		c + Vector2(0, c.y + r * 1.15),
		c + Vector2(w * 0.92, table_y + r * 0.08),
	])
	canvas.draw_colored_polygon(pavilion, Color("#2ec4f0", alpha))
	canvas.draw_colored_polygon(crown, Color("#7ee8ff", alpha))
	canvas.draw_polyline(crown, Color("#0d1a22", alpha), 1.8, true)
	canvas.draw_polyline(pavilion, Color("#0d1a22", alpha), 1.8, true)
	canvas.draw_line(c + Vector2(-w * 0.35, table_y), c + Vector2(0, c.y + r * 1.05), Color("#c8f7ff", 0.55 * alpha), 1.2)
	canvas.draw_line(c + Vector2(w * 0.35, table_y), c + Vector2(0, c.y + r * 1.05), Color("#1a8fb8", 0.45 * alpha), 1.2)
	canvas.draw_circle(c + Vector2(-w * 0.25, table_y - r * 0.08), r * 0.08, Color(1, 1, 1, 0.7 * alpha))
	_draw_sparkle_triangles(canvas, c + Vector2(w * 0.35, c.y - crown_h * 1.1), alpha)


static func _draw_void_core(
	canvas: CanvasItem,
	c: Vector2,
	r: float,
	ore_color: Color,
	ore_glow: Color,
	alpha: float,
	type_id: int,
) -> void:
	if type_id == 8:
		canvas.draw_circle(c, r * 1.2, Color("#1a1a2e", alpha))
		canvas.draw_arc(c, r * 0.95, 0.0, TAU, 20, Color("#4a4a8a", 0.75 * alpha), 2.5)
		canvas.draw_circle(c, r * 0.35, Color(0, 0, 0, 0.85 * alpha))
		for i in range(4):
			var a: float = float(i) * TAU / 4.0 + PI * 0.25
			canvas.draw_line(c, c + Vector2(cos(a), sin(a)) * r * 1.05, Color("#9966cc", 0.45 * alpha), 1.2)
	else:
		canvas.draw_circle(c, r * 1.1, ore_glow)
		canvas.draw_circle(c, r * 0.75, ore_color)
		canvas.draw_arc(c, r * 0.5, 0.0, TAU, 16, Color(0.6, 0.4, 1.0, 0.6 * alpha), 2.0)
		_draw_sparkle_triangles(canvas, c + Vector2(r * 0.3, -r * 0.5), alpha * 0.7)


static func _draw_sparkle_triangles(canvas: CanvasItem, origin: Vector2, alpha: float) -> void:
	for i in range(3):
		var sz: float = 3.5 - float(i) * 0.6
		var off := Vector2(float(i) * 4.0, -float(i) * 3.0)
		var tri: PackedVector2Array = PackedVector2Array([
			origin + off + Vector2(0, -sz),
			origin + off + Vector2(-sz * 0.75, sz * 0.4),
			origin + off + Vector2(sz * 0.75, sz * 0.4),
		])
		canvas.draw_colored_polygon(tri, Color("#5ec8ff", 0.85 * alpha))


static func _draw_crystal_shard(canvas: CanvasItem, c: Vector2, r: float, ore_color: Color, ore_glow: Color, alpha: float) -> void:
	var pts: PackedVector2Array = PackedVector2Array()
	for i in range(4):
		var a: float = float(i) * TAU / 4.0 + PI / 4.0
		pts.append(c + Vector2(cos(a), sin(a)) * r * 1.15)
	canvas.draw_colored_polygon(pts, ore_color)
	canvas.draw_polyline(pts, ore_glow, 2.0, true)
	canvas.draw_circle(c, r * 0.25, Color(1, 1, 1, 0.45 * alpha))


static func _draw_bag_dirt_cartoon(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var mound: PackedVector2Array = PackedVector2Array([
		c + Vector2(-r * 1.05, r * 0.35),
		c + Vector2(-r * 0.85, -r * 0.15),
		c + Vector2(-r * 0.2, -r * 0.55),
		c + Vector2(r * 0.45, -r * 0.45),
		c + Vector2(r * 0.95, r * 0.05),
		c + Vector2(r * 0.75, r * 0.55),
		c + Vector2(-r * 0.15, r * 0.65),
	])
	canvas.draw_colored_polygon(mound, Color("#8b5a2b", alpha))
	canvas.draw_colored_polygon(
		PackedVector2Array([
			c + Vector2(-r * 0.5, -r * 0.05),
			c + Vector2(r * 0.15, -r * 0.35),
			c + Vector2(r * 0.55, r * 0.05),
			c + Vector2(-r * 0.1, r * 0.25),
		]),
		Color("#a06838", 0.85 * alpha),
	)
	canvas.draw_polyline(mound, Color("#3d2818", alpha), 2.5, true)
	canvas.draw_circle(c + Vector2(r * 0.35, r * 0.15), r * 0.11, Color("#5c4030", 0.55 * alpha))
	canvas.draw_circle(c + Vector2(-r * 0.45, r * 0.2), r * 0.08, Color("#c4925a", 0.5 * alpha))
	for i in range(3):
		var gx: float = c.x - r * 0.05 + float(i) * 3.5
		canvas.draw_line(Vector2(gx, c.y - r * 0.62), Vector2(gx + 1.5, c.y - r * 0.78), Color("#6bc04a", alpha), 2.0)


static func _draw_bag_stone_icon(canvas: CanvasItem, rect: Rect2) -> void:
	var c: Vector2 = rect.get_center()
	var r: float = minf(rect.size.x, rect.size.y) * 0.46
	_draw_bag_stone_cartoon(canvas, c, r, 1.0)


static func _draw_bag_stone_cartoon(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var main: PackedVector2Array = PackedVector2Array([
		c + Vector2(-r * 0.78, r * 0.22),
		c + Vector2(-r * 0.68, -r * 0.38),
		c + Vector2(r * 0.05, -r * 0.72),
		c + Vector2(r * 0.75, -r * 0.28),
		c + Vector2(r * 0.68, r * 0.38),
		c + Vector2(-r * 0.08, r * 0.68),
	])
	canvas.draw_colored_polygon(main, Color("#6d6964", alpha))
	canvas.draw_colored_polygon(
		PackedVector2Array([
			c + Vector2(-r * 0.42, -r * 0.28),
			c + Vector2(r * 0.28, -r * 0.38),
			c + Vector2(r * 0.22, r * 0.02),
			c + Vector2(-r * 0.18, r * 0.08),
		]),
		Color("#9a9590", 0.88 * alpha),
	)
	canvas.draw_polyline(main, Color("#2a2826", alpha), 2.0, true)
	canvas.draw_line(
		c + Vector2(-r * 0.1, -r * 0.15),
		c + Vector2(r * 0.42, r * 0.28),
		Color("#3d3a36", 0.75 * alpha),
		1.8,
	)
	canvas.draw_line(
		c + Vector2(-r * 0.35, r * 0.05),
		c + Vector2(-r * 0.08, r * 0.42),
		Color("#4a4743", 0.6 * alpha),
		1.5,
	)
	var pebble: PackedVector2Array = PackedVector2Array([
		c + Vector2(-r * 0.82, r * 0.48),
		c + Vector2(-r * 0.58, r * 0.62),
		c + Vector2(-r * 0.48, r * 0.42),
	])
	canvas.draw_colored_polygon(pebble, Color("#5a5652", alpha))
	canvas.draw_polyline(pebble, Color("#2a2826", alpha), 1.5, true)
	canvas.draw_circle(c + Vector2(-r * 0.15, -r * 0.35), r * 0.09, Color(1, 1, 1, 0.28 * alpha))


static func _draw_bag_iron_ingot_icon(canvas: CanvasItem, rect: Rect2) -> void:
	var c: Vector2 = rect.get_center()
	var r: float = minf(rect.size.x, rect.size.y) * 0.44
	_draw_iron_ingot_bag(canvas, c, r, 1.0)


static func _draw_bag_gold_icon(canvas: CanvasItem, rect: Rect2) -> void:
	var c: Vector2 = rect.get_center()
	var r: float = minf(rect.size.x, rect.size.y) * 0.44
	_draw_gold_bar_ingot_3d(canvas, c, r, 1.0)


static func _draw_bag_diamond_icon(canvas: CanvasItem, rect: Rect2) -> void:
	var c: Vector2 = rect.get_center()
	var r: float = minf(rect.size.x, rect.size.y) * 0.36
	_draw_brilliant_diamond_bag(canvas, c, r, 1.0)


## 参考金条：上窄下宽 + 顶面侧棱
static func _draw_gold_bar_ingot_3d(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var depth: float = r * 0.14
	var top_y: float = c.y - r * 0.4
	var bot_y: float = c.y + r * 0.46
	var top_w: float = r * 0.68
	var bot_w: float = r * 0.9
	var front: PackedVector2Array = PackedVector2Array([
		Vector2(c.x - bot_w, bot_y),
		Vector2(c.x + bot_w, bot_y),
		Vector2(c.x + top_w, top_y),
		Vector2(c.x - top_w, top_y),
	])
	canvas.draw_colored_polygon(front, Color("#ffb300", alpha))
	var top: PackedVector2Array = PackedVector2Array([
		Vector2(c.x - top_w, top_y),
		Vector2(c.x + top_w, top_y),
		Vector2(c.x + top_w * 0.92, top_y - depth),
		Vector2(c.x - top_w + depth * 0.25, top_y - depth),
	])
	canvas.draw_colored_polygon(top, Color("#ffe082", alpha))
	canvas.draw_polyline(front, Color("#5d4037", alpha), 2.4, true)
	canvas.draw_polyline(top, Color("#6d4c00", 0.85 * alpha), 1.8, true)
	var mid_y: float = c.y + r * 0.02
	canvas.draw_line(
		Vector2(c.x - bot_w * 0.58, mid_y - r * 0.06),
		Vector2(c.x + bot_w * 0.58, mid_y - r * 0.06),
		Color("#fff8e1", 0.75 * alpha),
		2.0,
	)
	canvas.draw_line(
		Vector2(c.x - bot_w * 0.42, mid_y + r * 0.14),
		Vector2(c.x + bot_w * 0.42, mid_y + r * 0.14),
		Color("#ff8f00", 0.45 * alpha),
		1.5,
	)
	canvas.draw_line(
		Vector2(c.x - top_w * 0.65, top_y + 2.0),
		Vector2(c.x + top_w * 0.55, top_y + 2.0),
		Color(1, 1, 1, 0.5 * alpha),
		2.2,
	)


## 参考明亮式切工：台面 + 冠部 + 深色亭部
static func _draw_brilliant_diamond_bag(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var cy: float = c.y + r * 0.06
	var core: Vector2 = Vector2(c.x, cy - r * 0.06)
	var apex: Vector2 = Vector2(c.x, cy - r * 0.82)
	var girdle_l: Vector2 = Vector2(c.x - r * 0.76, cy + r * 0.04)
	var girdle_r: Vector2 = Vector2(c.x + r * 0.76, cy + r * 0.04)
	var culet: Vector2 = Vector2(c.x, cy + r * 0.68)
	canvas.draw_colored_polygon(PackedVector2Array([girdle_l, culet, core]), Color("#0d47a1", alpha))
	canvas.draw_colored_polygon(PackedVector2Array([girdle_r, culet, core]), Color("#1976d2", alpha))
	canvas.draw_colored_polygon(PackedVector2Array([apex, girdle_l, core]), Color("#0288d1", alpha))
	canvas.draw_colored_polygon(PackedVector2Array([apex, girdle_r, core]), Color("#4fc3f7", alpha))
	var tw: float = r * 0.46
	var table: PackedVector2Array = PackedVector2Array([
		Vector2(c.x - tw, cy - r * 0.24),
		Vector2(c.x + tw, cy - r * 0.24),
		Vector2(c.x + tw * 0.82, cy - r * 0.36),
		Vector2(c.x - tw * 0.82, cy - r * 0.36),
	])
	canvas.draw_colored_polygon(table, Color("#e1f5fe", alpha))
	canvas.draw_polyline(table, Color("#01579b", 0.9 * alpha), 1.8, true)
	canvas.draw_line(girdle_l, girdle_r, Color("#01579b", alpha), 2.4)
	canvas.draw_line(Vector2(c.x - tw, cy - r * 0.24), culet, Color("#0277bd", 0.45 * alpha), 1.2)
	canvas.draw_line(Vector2(c.x + tw, cy - r * 0.24), culet, Color("#81d4fa", 0.4 * alpha), 1.2)
	canvas.draw_line(apex, culet, Color("#01579b", 0.55 * alpha), 1.5)
	canvas.draw_polyline(
		PackedVector2Array([apex, girdle_r, culet, girdle_l, apex]),
		Color("#062028", alpha),
		2.0,
		true,
	)
	canvas.draw_circle(Vector2(c.x - tw * 0.35, cy - r * 0.3), r * 0.065, Color(1, 1, 1, 0.92 * alpha))
	canvas.draw_circle(Vector2(c.x + tw * 0.15, cy - r * 0.32), r * 0.035, Color(1, 1, 1, 0.55 * alpha))


## 背包用横向铁锭（不超出 clip，避免右侧裁切线）
static func _draw_iron_ingot_bag(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var w: float = r * 0.88
	var h: float = r * 0.34
	var ear: float = r * 0.12
	var body: PackedVector2Array = PackedVector2Array([
		Vector2(c.x - w, c.y - h * 0.55),
		Vector2(c.x - w + ear, c.y - h),
		Vector2(c.x + w - ear, c.y - h),
		Vector2(c.x + w, c.y - h * 0.55),
		Vector2(c.x + w, c.y + h * 0.55),
		Vector2(c.x + w - ear, c.y + h),
		Vector2(c.x - w + ear, c.y + h),
		Vector2(c.x - w, c.y + h * 0.55),
	])
	canvas.draw_colored_polygon(body, Color("#607d8b", alpha))
	canvas.draw_colored_polygon(
		PackedVector2Array([
			Vector2(c.x - w * 0.75, c.y - h * 0.65),
			Vector2(c.x + w * 0.75, c.y - h * 0.65),
			Vector2(c.x + w * 0.55, c.y - h * 0.05),
			Vector2(c.x - w * 0.55, c.y - h * 0.05),
		]),
		Color("#b0bec5", alpha),
	)
	canvas.draw_polyline(body, Color("#263238", alpha), 2.2, true)
	canvas.draw_line(
		Vector2(c.x - w * 0.45, c.y - h * 0.15),
		Vector2(c.x + w * 0.35, c.y + h * 0.45),
		Color("#eceff1", 0.6 * alpha),
		2.0,
	)
	canvas.draw_line(
		Vector2(c.x - w * 0.2, c.y + h * 0.05),
		Vector2(c.x + w * 0.15, c.y + h * 0.35),
		Color("#455a64", 0.45 * alpha),
		1.5,
	)


static func _draw_bag_gold_cartoon(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var nug: PackedVector2Array = PackedVector2Array([
		c + Vector2(-r * 0.55, r * 0.15),
		c + Vector2(-r * 0.75, -r * 0.25),
		c + Vector2(-r * 0.15, -r * 0.65),
		c + Vector2(r * 0.55, -r * 0.45),
		c + Vector2(r * 0.85, r * 0.05),
		c + Vector2(r * 0.45, r * 0.65),
		c + Vector2(-r * 0.05, r * 0.55),
	])
	canvas.draw_colored_polygon(nug, Color("#b8860b", alpha))
	canvas.draw_colored_polygon(
		PackedVector2Array([
			c + Vector2(-r * 0.35, -r * 0.05),
			c + Vector2(r * 0.25, -r * 0.25),
			c + Vector2(r * 0.35, r * 0.2),
			c + Vector2(-r * 0.05, r * 0.25),
		]),
		Color("#ffd54f", alpha),
	)
	canvas.draw_polyline(nug, Color("#6d4c00", alpha), 2.5, true)
	canvas.draw_circle(c + Vector2(-r * 0.22, -r * 0.18), r * 0.18, Color(1, 1, 1, 0.38 * alpha))
	canvas.draw_circle(c + Vector2(-r * 0.28, -r * 0.24), r * 0.07, Color(1, 1, 1, 0.8 * alpha))


static func _draw_iron_ore_chunk(
	canvas: CanvasItem,
	c: Vector2,
	r: float,
	ore_color: Color,
	ore_glow: Color,
	alpha: float,
) -> void:
	_draw_metal_nugget(canvas, c, r * 0.92, ore_color, ore_glow, alpha)
	var streak: Color = Color("#b8c5d0", 0.55 * alpha)
	canvas.draw_line(c + Vector2(-r * 0.5, r * 0.05), c + Vector2(r * 0.15, -r * 0.35), streak, 2.0)
	canvas.draw_line(c + Vector2(-r * 0.1, r * 0.45), c + Vector2(r * 0.45, r * 0.15), streak, 1.5)
	canvas.draw_circle(c + Vector2(-r * 0.35, r * 0.2), r * 0.12, Color("#5a6570", 0.7 * alpha))


static func _draw_gold_ore_nugget(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var pts: PackedVector2Array = PackedVector2Array()
	for i in range(6):
		var a: float = float(i) * TAU / 6.0 + 0.35
		var rad: float = r * (0.95 if i % 2 == 0 else 0.72)
		pts.append(c + Vector2(cos(a), sin(a)) * rad)
	canvas.draw_colored_polygon(pts, Color("#c99208", alpha))
	canvas.draw_colored_polygon(
		PackedVector2Array([c + Vector2(-r * 0.35, -r * 0.2), c + Vector2(r * 0.1, -r * 0.45), c + Vector2(r * 0.4, r * 0.05)]),
		Color("#ffe566", 0.75 * alpha),
	)
	canvas.draw_polyline(pts, Color("#e8b923", alpha), 2.0, true)
	canvas.draw_line(
		c + Vector2(-r * 0.4, -r * 0.05),
		c + Vector2(r * 0.35, r * 0.3),
		Color(1, 1, 1, 0.45 * alpha),
		2.0,
	)


static func _draw_red_matter_crystal(
	canvas: CanvasItem,
	c: Vector2,
	r: float,
	ore_color: Color,
	ore_glow: Color,
	alpha: float,
) -> void:
	var body: PackedVector2Array = PackedVector2Array([
		c + Vector2(0, -r * 1.15),
		c + Vector2(r * 0.55, -r * 0.15),
		c + Vector2(r * 0.35, r * 0.95),
		c + Vector2(-r * 0.35, r * 0.95),
		c + Vector2(-r * 0.55, -r * 0.15),
	])
	canvas.draw_colored_polygon(body, Color(ore_color, alpha))
	canvas.draw_polyline(body, Color(ore_glow, alpha), 2.0, true)
	canvas.draw_line(c + Vector2(-r * 0.15, -r * 0.5), c + Vector2(0, r * 0.55), Color("#ff9fbd", 0.5 * alpha), 1.8)
	canvas.draw_line(c + Vector2(r * 0.2, -r * 0.2), c + Vector2(0, r * 0.55), Color("#8a0028", 0.45 * alpha), 1.5)


static func _draw_void_crystal_shard(
	canvas: CanvasItem,
	c: Vector2,
	r: float,
	ore_color: Color,
	ore_glow: Color,
	alpha: float,
) -> void:
	var left: PackedVector2Array = PackedVector2Array([
		c + Vector2(-r * 0.25, -r * 1.05),
		c + Vector2(-r * 0.65, r * 0.15),
		c + Vector2(-r * 0.15, r * 0.85),
		c + Vector2(r * 0.05, r * 0.05),
	])
	var right: PackedVector2Array = PackedVector2Array([
		c + Vector2(r * 0.05, r * 0.05),
		c + Vector2(r * 0.55, -r * 0.35),
		c + Vector2(r * 0.35, -r * 1.0),
		c + Vector2(-r * 0.25, -r * 1.05),
	])
	canvas.draw_colored_polygon(left, Color(ore_color.darkened(0.15), alpha))
	canvas.draw_colored_polygon(right, Color(ore_glow, alpha))
	canvas.draw_polyline(left, Color("#2a1840", alpha), 1.5, true)
	canvas.draw_polyline(right, Color("#d4a5ff", 0.85 * alpha), 1.5, true)
	canvas.draw_circle(c + Vector2(-r * 0.05, -r * 0.35), r * 0.1, Color(1, 1, 1, 0.35 * alpha))


static func _draw_black_hole_fragment(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var shard: PackedVector2Array = PackedVector2Array()
	for i in range(5):
		var a: float = float(i) * TAU / 5.0 - PI * 0.5
		var rad: float = r * (1.0 if i == 0 else 0.78 + float(i % 2) * 0.12)
		shard.append(c + Vector2(cos(a), sin(a)) * rad)
	canvas.draw_colored_polygon(shard, Color("#12121f", alpha))
	canvas.draw_polyline(shard, Color("#4a4a8a", 0.9 * alpha), 2.0, true)
	canvas.draw_arc(c + Vector2(r * 0.08, r * 0.05), r * 0.38, 0.2, TAU - 0.35, 14, Color("#9966cc", 0.75 * alpha), 2.2)
	canvas.draw_circle(c + Vector2(r * 0.12, r * 0.08), r * 0.14, Color(0, 0, 0, 0.92 * alpha))
	for i in range(3):
		var ang: float = float(i) * TAU / 3.0 + 0.5
		canvas.draw_line(
			c + Vector2(cos(ang), sin(ang)) * r * 0.22,
			c + Vector2(cos(ang), sin(ang)) * r * 0.55,
			Color("#6b5b9a", 0.4 * alpha),
			1.2,
		)


static func _draw_metal_nugget(canvas: CanvasItem, c: Vector2, r: float, ore_color: Color, ore_glow: Color, alpha: float) -> void:
	var pts: PackedVector2Array = PackedVector2Array()
	for i in range(5):
		var a: float = float(i) * TAU / 5.0 + 0.15
		var rad: float = r * (0.92 if i % 2 == 0 else 0.78)
		pts.append(c + Vector2(cos(a), sin(a)) * rad)
	canvas.draw_colored_polygon(pts, ore_color)
	canvas.draw_polyline(pts, ore_glow, 2.0, true)
	canvas.draw_line(
		c + Vector2(-r * 0.35, -r * 0.15),
		c + Vector2(r * 0.4, r * 0.25),
		Color(1, 1, 1, 0.4 * alpha),
		2.0,
	)


static func _draw_stone_chunk(canvas: CanvasItem, c: Vector2, r: float, alpha: float) -> void:
	var pts: PackedVector2Array = PackedVector2Array()
	for i in range(6):
		var a: float = float(i) * TAU / 6.0
		pts.append(c + Vector2(cos(a), sin(a)) * r * 0.95)
	canvas.draw_colored_polygon(pts, Color(STONE_MID, alpha))
	canvas.draw_polyline(pts, Color(STONE_EDGE, alpha), 1.5, true)


static func _draw_dirt_shell(canvas: CanvasItem, inner: Rect2, pos: Vector2i) -> void:
	var h: int = _hash_pos(pos)
	canvas.draw_rect(inner, DIRT_BOTTOM, true)
	canvas.draw_rect(Rect2(inner.position, Vector2(inner.size.x, inner.size.y * 0.72)), DIRT_MID, true)
	canvas.draw_rect(Rect2(inner.position, Vector2(inner.size.x, inner.size.y * 0.38)), DIRT_TOP, true)
	canvas.draw_rect(inner, DIRT_EDGE, false, 1.5)
	var c: Vector2 = inner.get_center()
	for i in range(5):
		var ang: float = float((h + i * 47) % 360) * TAU / 360.0
		var dist: float = inner.size.x * (0.05 + float((h + i * 13) % 24) * 0.014)
		var speck: Vector2 = c + Vector2(cos(ang), sin(ang)) * dist
		var col: Color = Color("#c4925a", 0.55) if i % 2 == 0 else Color("#3d2818", 0.45)
		canvas.draw_circle(speck, 1.5 + float(i % 3), col)
	_draw_dirt_crumbs(canvas, inner, h, 3)
	if pos.y <= 12:
		for i in range(2):
			var gx: float = inner.position.x + float((h + i * 19) % int(inner.size.x - 8)) + 4.0
			canvas.draw_line(
				Vector2(gx, inner.position.y + 3),
				Vector2(gx + 2, inner.position.y + 1),
				Color("#5a8a3a", 0.75),
				1.2,
			)


static func _draw_stone_shell(canvas: CanvasItem, inner: Rect2, pos: Vector2i) -> void:
	var h: int = _hash_pos(pos)
	canvas.draw_rect(inner, STONE_BOTTOM, true)
	canvas.draw_rect(Rect2(inner.position, Vector2(inner.size.x, inner.size.y * 0.5)), STONE_MID, true)
	canvas.draw_rect(Rect2(inner.position, Vector2(inner.size.x, inner.size.y * 0.35)), STONE_TOP, true)
	canvas.draw_rect(inner, STONE_EDGE, false, 1.0)
	_draw_rock_specks(canvas, inner, h, Color("#2a2826"), Color("#6a6560"))


static func _draw_deep_rock_shell(canvas: CanvasItem, inner: Rect2, pos: Vector2i) -> void:
	var h: int = _hash_pos(pos)
	canvas.draw_rect(inner, ROCK_BOTTOM, true)
	canvas.draw_rect(Rect2(inner.position, Vector2(inner.size.x, inner.size.y * 0.45)), ROCK_TOP, true)
	canvas.draw_rect(inner, ROCK_EDGE, false, 1.0)
	_draw_rock_specks(canvas, inner, h, Color(0.18, 0.15, 0.13, 0.55), Color(0.28, 0.24, 0.2, 0.4))
	for i in range(2):
		var a0: float = float((h + i * 41) % 360) * TAU / 360.0
		var a1: float = a0 + 0.45 + float(i) * 0.18
		var r0: float = inner.size.x * 0.1
		var r1: float = inner.size.x * 0.4
		var cc: Vector2 = inner.get_center()
		canvas.draw_line(
			cc + Vector2(cos(a0), sin(a0)) * r0,
			cc + Vector2(cos(a1), sin(a1)) * r1,
			Color(0, 0, 0, 0.4),
			1.0,
		)


static func _draw_rock_specks(canvas: CanvasItem, inner: Rect2, h: int, c0: Color, c1: Color) -> void:
	var c: Vector2 = inner.get_center()
	for i in range(3):
		var ang: float = float((h + i * 53) % 360) * TAU / 360.0
		var dist: float = inner.size.x * (0.08 + float((h + i * 11) % 20) * 0.012)
		var speck: Vector2 = c + Vector2(cos(ang), sin(ang)) * dist
		canvas.draw_circle(speck, 2.0 + float(i % 3), c0 if i % 2 == 0 else c1)


static func _draw_dirt_clod(canvas: CanvasItem, inner: Rect2, alpha: float) -> void:
	var c: Vector2 = inner.get_center()
	var r: float = inner.size.x * 0.26
	var pts: PackedVector2Array = PackedVector2Array()
	for i in range(7):
		var a: float = float(i) * TAU / 7.0 + 0.2
		var wobble: float = 0.88 + float(i % 3) * 0.06
		pts.append(c + Vector2(cos(a), sin(a)) * r * wobble)
	canvas.draw_colored_polygon(pts, Color(DIRT_MID, alpha))
	canvas.draw_polyline(pts, Color(DIRT_EDGE, alpha * 0.9), 2.0, true)
	canvas.draw_circle(c + Vector2(-r * 0.2, -r * 0.15), r * 0.22, Color(DIRT_TOP, alpha * 0.85))
	canvas.draw_circle(c + Vector2(r * 0.15, r * 0.1), r * 0.14, Color("#3d2818", 0.35 * alpha))


static func _draw_dirt_crumbs(canvas: CanvasItem, inner: Rect2, h: int, count: int) -> void:
	for i in range(count):
		var px: float = inner.position.x + float((h + i * 31) % int(maxf(inner.size.x - 6, 1))) + 3.0
		var py: float = inner.position.y + float((h + i * 17) % int(maxf(inner.size.y - 6, 1))) + 3.0
		canvas.draw_rect(Rect2(px, py, 3, 2), Color("#5c4030", 0.5), true)


static func _hash_pos(pos: Vector2i) -> int:
	return absi(pos.x * 73856093 ^ pos.y * 19349663)


static func _manhattan(a: Vector2i, b: Vector2i) -> int:
	return absi(a.x - b.x) + absi(a.y - b.y)
