extends CanvasLayer

@onready var _root: Control = $Root
@onready var _coin: TextureRect = $Root/Center/VBox/Coin
@onready var _label: Label = $Root/Center/VBox/Label
@onready var _gif: TextureRect = $Root/Center/VBox/Gif

var _spin_tween: Tween


func _ready() -> void:
	layer = 50
	visible = false
	var coin_tex: Texture2D = UiIcons.texture_coin()
	if coin_tex != null:
		_coin.texture = coin_tex
	var load_tex: Texture2D = UiArt.texture("loading")
	if load_tex != null:
		_gif.texture = load_tex
		_gif.visible = true
		_coin.visible = false
	else:
		_gif.visible = false


func show_loading(msg: String = "加载中…") -> void:
	_label.text = msg
	visible = true
	_root.modulate.a = 0.0
	var tw: Tween = create_tween()
	tw.tween_property(_root, "modulate:a", 1.0, 0.12)
	_start_spin()


func hide_loading() -> void:
	if _spin_tween != null and _spin_tween.is_valid():
		_spin_tween.kill()
	visible = false


func _start_spin() -> void:
	if not _coin.visible:
		return
	_coin.rotation = 0.0
	if _spin_tween != null and _spin_tween.is_valid():
		_spin_tween.kill()
	_spin_tween = create_tween().set_loops()
	_spin_tween.tween_property(_coin, "rotation", TAU, 1.1).from(0.0)
