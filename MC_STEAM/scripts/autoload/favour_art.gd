extends Node
## 从 D:\zg\design\favour\public\img 读取素材（与 Vue 项目 /img/game 同源）

const KEY_PATHS: Dictionary = {
	"coin": ["game/gold3.png", "game/gold2.png", "game/gold_coin.png"],
	"money_hud": [],
	"trade": [],
	# 背包 / 兑换 / 右下角设置：用 res://assets/ui 语义图，勿被 favour 金币·宝箱覆盖
	"icon_exchange": [],
	"icon_status": [],
	"icon_bag": [],
	"ore_diamond": ["game/zs.png"],
	"ore_gold": ["game/gold.png", "game/gold2.png"],
	"ore_coin": ["game/money.png", "game/gold3.png"],
	"ore_4": ["game/gold.png", "game/gold2.png"],
	"ore_5": ["game/zs.png"],
	"ore_iron_bag": ["game/mine2.png", "game/mine.png", "game/wq.png"],
	"sell": ["game/gold2.png", "game/circle.png"],
	"score": ["game/score.png"],
	"btn_game": ["game/start.png", "jijia/start.png"],
	"tile_ground": ["mouse/bg9.png"],
	"play_bg": ["game/bg3.png", "mouse/bg9.png"],
	"loading": ["gif/loading2.gif", "loading.gif", "gif/loading.gif"],
}

var _root: String = ""
var _cache: Dictionary = {}


func _ready() -> void:
	_cache.clear()
	_root = _resolve_img_root()
	if _root.is_empty():
		push_warning("FavourArt: 未找到 favour/public/img，将仅用 res://assets。")
	else:
		print("FavourArt: 使用 ", _root)


func _resolve_img_root() -> String:
	var candidates: PackedStringArray = PackedStringArray([
		"D:/zg/design/favour/public/img",
		"d:/zg/design/favour/public/img",
	])
	var rel: String = ProjectSettings.globalize_path("res://../../../design/favour/public/img")
	candidates.append(rel.replace("\\", "/"))
	for path in candidates:
		var p: String = path.replace("\\", "/").trim_suffix("/")
		if DirAccess.dir_exists_absolute(p):
			return p
	return ""


func has_root() -> bool:
	return not _root.is_empty()


func texture_for_key(key: String) -> Texture2D:
	if not KEY_PATHS.has(key):
		return null
	for rel in KEY_PATHS[key]:
		var t: Texture2D = load_relative(str(rel))
		if t != null:
			return t
	return null


func load_relative(rel_path: String) -> Texture2D:
	var rel: String = rel_path.replace("\\", "/").trim_prefix("/")
	if _cache.has(rel):
		return _cache[rel] as Texture2D
	var tex: Texture2D = _load_from_disk(rel)
	if tex != null:
		_cache[rel] = tex
	return tex


func _load_from_disk(rel: String) -> Texture2D:
	if _root.is_empty():
		return null
	var abs_path: String = _root.path_join(rel)
	if not FileAccess.file_exists(abs_path):
		return null
	var img := Image.load_from_file(abs_path)
	if img == null or img.is_empty():
		return null
	if ImageMatte.should_strip(rel):
		img = ImageMatte.strip_green_edges(img)
	elif ImageMatte.should_prepare_hud_icon(rel):
		img = ImageMatte.prepare_hud_icon(img)
	return ImageTexture.create_from_image(img)
