extends CanvasLayer

@onready var _art: TextureRect = $BgArt


func _ready() -> void:
	# 局内：极淡纹理，不抢画面（主菜单仍用纯色）
	var tex: Texture2D = UiArt.texture("play_bg")
	if tex == null:
		tex = UiArt.texture("tile_ground")
	if tex != null:
		_art.texture = tex
		_art.visible = true
		_art.modulate = Color(1, 1, 1, 0.11)
	else:
		_art.visible = false
