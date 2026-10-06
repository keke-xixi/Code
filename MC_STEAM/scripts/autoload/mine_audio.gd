extends Node
## 程序化挖矿音效（无需外部音频文件）

const HIT_POOL: int = 10
const SAMPLE_RATE: int = 22050

var _hit_players: Array[AudioStreamPlayer] = []
var _hit_idx: int = 0
var _break_player: AudioStreamPlayer
var _level_player: AudioStreamPlayer
var _coin_player: AudioStreamPlayer
var _coin_stream: AudioStreamWAV
var _hit_streams: Array[AudioStreamWAV] = []
var _break_streams: Array[AudioStreamWAV] = []
var _level_stream: AudioStreamWAV
var _amb_a: AudioStreamPlayer
var _amb_b: AudioStreamPlayer
var _amb_front: AudioStreamPlayer
var _amb_layer_idx: int = -1


func _ready() -> void:
	for i in range(5):
		_hit_streams.append(_build_pick_hit(float(i) / 4.0))
	for i in range(3):
		_break_streams.append(_build_break(0.55 + float(i) * 0.22))
	for _i in range(HIT_POOL):
		var p := AudioStreamPlayer.new()
		p.bus = &"Master"
		add_child(p)
		_hit_players.append(p)
	_break_player = AudioStreamPlayer.new()
	_break_player.bus = &"Master"
	add_child(_break_player)
	_level_stream = _build_level_up()
	_level_player = AudioStreamPlayer.new()
	_level_player.bus = &"Master"
	add_child(_level_player)
	_coin_stream = _build_coin()
	_coin_player = AudioStreamPlayer.new()
	_coin_player.bus = &"Master"
	add_child(_coin_player)
	if not GameEvents.coins_earned.is_connected(_on_coins_earned):
		GameEvents.coins_earned.connect(_on_coins_earned)
	if not GameEvents.mining_pick_hit.is_connected(_on_pick_hit):
		GameEvents.mining_pick_hit.connect(_on_pick_hit)
	if not GameEvents.cell_mined.is_connected(_on_cell_mined):
		GameEvents.cell_mined.connect(_on_cell_mined)
	if not GameEvents.layer_changed.is_connected(_on_layer_changed):
		GameEvents.layer_changed.connect(_on_layer_changed)
	if not GameEvents.settings_changed.is_connected(_sync_ambience_enabled):
		GameEvents.settings_changed.connect(_sync_ambience_enabled)
	_amb_a = _make_amb_player()
	_amb_b = _make_amb_player()
	_amb_front = _amb_a
	_set_ambience_layer(0, true)


func _on_pick_hit(_grid_pos: Vector2i, strength: float) -> void:
	play_pick_hit(strength)


func _on_cell_mined(_grid_pos: Vector2i, _ore_color: Color, _ore_glow: Color, gain: int) -> void:
	var w: float = clampf(maxf(0.52, float(gain) / 80.0), 0.45, 1.0)
	play_break(w)


func play_pick_hit(strength: float = 0.7) -> void:
	if not UserSettings.sfx_enabled:
		return
	var player: AudioStreamPlayer = _hit_players[_hit_idx % _hit_players.size()]
	_hit_idx += 1
	var si: int = int(clampf(strength, 0.0, 1.0) * float(_hit_streams.size() - 1))
	player.stream = _hit_streams[si]
	player.volume_db = lerpf(-9.5, -4.0, strength)
	var jitter: float = randf_range(0.97, 1.04)
	player.pitch_scale = lerpf(0.94, 1.08, strength) * jitter
	player.play()


func play_level_up() -> void:
	if not UserSettings.sfx_enabled:
		return
	_level_player.stream = _level_stream
	_level_player.volume_db = -4.0
	_level_player.pitch_scale = 1.0
	_level_player.play()


func play_coin() -> void:
	if not UserSettings.sfx_enabled:
		return
	_coin_player.stream = _coin_stream
	_coin_player.volume_db = -6.0
	_coin_player.pitch_scale = randf_range(0.98, 1.06)
	_coin_player.play()


func _on_coins_earned(_amount: int) -> void:
	play_coin()


func _build_coin() -> AudioStreamWAV:
	var duration: float = 0.22
	var n: int = int(duration * float(SAMPLE_RATE))
	var data := PackedByteArray()
	data.resize(n * 2)
	var freqs: PackedFloat32Array = PackedFloat32Array([880.0, 1174.0, 1568.0])
	for i in range(n):
		var t: float = float(i) / float(SAMPLE_RATE)
		var env: float = exp(-t * 14.0) * (1.0 - smoothstep(0.14, 0.22, t))
		var s: float = 0.0
		for fi in range(freqs.size()):
			var gate: float = smoothstep(float(fi) * 0.06, float(fi) * 0.06 + 0.04, t)
			s += sin(TAU * freqs[fi] * t) * gate * (0.35 / float(freqs.size()))
		var v: int = int(clampf(s * env * 28000.0, -32767.0, 32767.0))
		data[i * 2] = v & 0xFF
		data[i * 2 + 1] = (v >> 8) & 0xFF
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = SAMPLE_RATE
	wav.stereo = false
	wav.data = data
	return wav


func _make_amb_player() -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.bus = &"Master"
	p.volume_db = -22.0
	add_child(p)
	return p


func _on_layer_changed(title: String, _progress: float) -> void:
	var idx: int = _layer_index_for_title(title)
	if idx == _amb_layer_idx:
		return
	_set_ambience_layer(idx, false)


func _layer_index_for_title(title: String) -> int:
	for i in range(GameData.DEPTH_RANGES.size()):
		if str(GameData.DEPTH_RANGES[i].get("title", "")) == title:
			return i
	return GameData.DEPTH_RANGES.size() - 1


func _set_ambience_layer(layer_idx: int, instant: bool) -> void:
	_amb_layer_idx = layer_idx
	if not UserSettings.music_enabled:
		_amb_a.stop()
		_amb_b.stop()
		return
	var stream: AudioStream = _resolve_ambience_stream(layer_idx)
	var back: AudioStreamPlayer = _amb_b if _amb_front == _amb_a else _amb_a
	back.stream = stream
	back.volume_db = -22.0
	back.play()
	if instant:
		_amb_front.stop()
		_amb_front = back
		_amb_front.volume_db = -22.0
		return
	var front: AudioStreamPlayer = _amb_front
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(front, "volume_db", -40.0, 0.7)
	tw.tween_property(back, "volume_db", -22.0, 0.7)
	tw.chain().tween_callback(func() -> void:
		front.stop()
		_amb_front = back
	)


func _sync_ambience_enabled() -> void:
	if UserSettings.music_enabled:
		_set_ambience_layer(maxi(_amb_layer_idx, 0), true)
	else:
		_amb_a.stop()
		_amb_b.stop()


func _resolve_ambience_stream(layer_idx: int) -> AudioStream:
	var title: String = str(GameData.DEPTH_RANGES[mini(layer_idx, GameData.DEPTH_RANGES.size() - 1)].get("title", ""))
	var candidates: PackedStringArray = PackedStringArray([
		"res://audio/layers/%02d.ogg" % layer_idx,
		"res://audio/layers/%02d.wav" % layer_idx,
		"res://audio/layers/%s.ogg" % title,
		"res://audio/ambience.ogg",
		"res://audio/ambience.wav",
	])
	for path in candidates:
		if not ResourceLoader.exists(path):
			continue
		var loaded: Resource = load(path)
		if loaded is AudioStream:
			return loaded as AudioStream
	return _build_ambience_loop(layer_idx)


func _build_ambience_loop(layer_idx: int) -> AudioStreamWAV:
	var depth_t: float = 1.0 - float(layer_idx) / float(maxi(GameData.DEPTH_RANGES.size() - 1, 1))
	var base_hz: float = lerpf(42.0, 92.0, depth_t)
	var duration: float = 3.0
	var n: int = int(SAMPLE_RATE * duration)
	var pcm := PackedFloat32Array()
	pcm.resize(n)
	var rng := RandomNumberGenerator.new()
	rng.seed = layer_idx * 991 + 17
	for i in range(n):
		var t: float = float(i) / float(SAMPLE_RATE)
		var wobble: float = sin(TAU * 0.07 * t + float(layer_idx)) * 3.0
		var f: float = base_hz + wobble
		var hum: float = sin(TAU * f * t) * 0.22
		var sub: float = sin(TAU * f * 0.5 * t) * 0.12
		var noise: float = rng.randf_range(-1.0, 1.0) * 0.04
		pcm[i] = hum + sub + noise
	var wav := _float_to_wav(pcm)
	wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
	return wav


func play_break(weight: float = 0.6) -> void:
	if not UserSettings.sfx_enabled:
		return
	var si: int = int(clampf(weight, 0.0, 1.0) * float(_break_streams.size() - 1))
	_break_player.stream = _break_streams[si]
	_break_player.volume_db = lerpf(-8.5, -3.5, weight)
	_break_player.pitch_scale = lerpf(0.96, 1.06, weight) * randf_range(0.98, 1.02)
	_break_player.play()


func _build_level_up() -> AudioStreamWAV:
	var duration: float = 0.35
	var n: int = int(SAMPLE_RATE * duration)
	var pcm := PackedFloat32Array()
	pcm.resize(n)
	for i in range(n):
		var t: float = float(i) / float(SAMPLE_RATE)
		var env: float = exp(-t * 8.0)
		var f0: float = lerpf(320.0, 880.0, clampf(t / 0.28, 0.0, 1.0))
		var wave: float = sin(TAU * f0 * t) * 0.55 + sin(TAU * f0 * 2.0 * t) * 0.15
		pcm[i] = wave * env
	return _float_to_wav(pcm)


func _build_pick_hit(tone: float) -> AudioStreamWAV:
	var duration: float = 0.11
	var n: int = int(SAMPLE_RATE * duration)
	var pcm := PackedFloat32Array()
	pcm.resize(n)
	var rng := RandomNumberGenerator.new()
	rng.seed = int(tone * 1337.0) + 41
	var f0: float = lerpf(680.0, 1180.0, tone)
	var f1: float = f0 * 2.62
	var f2: float = f0 * 4.05
	for i in range(n):
		var t: float = float(i) / float(SAMPLE_RATE)
		var attack: float = 1.0 - exp(-t * 620.0)
		var decay: float = exp(-t * 32.0)
		var env: float = attack * decay
		var bend: float = exp(-t * 18.0)
		var f: float = f0 * lerpf(1.0, 0.92, 1.0 - bend)
		var ping: float = sin(TAU * f * t) * 0.46
		ping += sin(TAU * f1 * t) * 0.2
		ping += sin(TAU * f2 * t) * 0.09
		var click: float = 0.0
		if t < 0.0035:
			click = rng.randf_range(-0.35, 0.35) * (1.0 - t / 0.0035)
		pcm[i] = (ping + click) * env * 0.82
	return _float_to_wav(pcm)


func _build_break(weight: float) -> AudioStreamWAV:
	var duration: float = 0.14 + weight * 0.16
	var n: int = int(SAMPLE_RATE * duration)
	var pcm := PackedFloat32Array()
	pcm.resize(n)
	var rng := RandomNumberGenerator.new()
	rng.seed = int(weight * 911.0) + 3
	var f_chime: float = lerpf(440.0, 587.0, weight)
	var noise_lp: float = 0.0
	for i in range(n):
		var t: float = float(i) / float(SAMPLE_RATE)
		var env: float = exp(-t * (10.0 + weight * 5.0))
		var raw_n: float = rng.randf_range(-1.0, 1.0)
		noise_lp = lerpf(noise_lp, raw_n, 0.12)
		var grit: float = noise_lp * exp(-t * 22.0) * 0.28
		var chime_env: float = exp(-t * 11.0) * (1.0 - exp(-t * 200.0))
		var chime: float = sin(TAU * f_chime * t) * 0.32
		chime += sin(TAU * f_chime * 1.498 * t) * 0.14
		chime += sin(TAU * f_chime * 2.0 * t) * 0.06
		var thump: float = sin(TAU * lerpf(72.0, 110.0, weight) * t) * exp(-t * 28.0) * 0.16
		pcm[i] = (grit + chime * chime_env + thump) * env
	return _float_to_wav(pcm)


func _float_to_wav(samples: PackedFloat32Array) -> AudioStreamWAV:
	var wav := AudioStreamWAV.new()
	wav.mix_rate = SAMPLE_RATE
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.stereo = false
	var bytes := PackedByteArray()
	bytes.resize(samples.size() * 2)
	for i in range(samples.size()):
		var s: int = int(clampf(samples[i], -1.0, 1.0) * 32767.0)
		if s < 0:
			s += 65536
		bytes[i * 2] = s & 0xFF
		bytes[i * 2 + 1] = (s >> 8) & 0xFF
	wav.data = bytes
	return wav
