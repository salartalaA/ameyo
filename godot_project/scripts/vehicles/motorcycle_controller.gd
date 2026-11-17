extends CharacterBody2D
class_name MotorcycleController

signal speed_changed(speed_kmh: int)

@export var max_speed: float = 340.0
@export var reverse_max_speed: float = -75.0
@export var acceleration: float = 270.0
@export var brake_deceleration: float = 420.0
@export var coast_drag: float = 135.0
@export var turn_speed: float = 2.85

var has_rider: bool = false
var current_speed: float = 0.0

@onready var headlight: PointLight2D = $Headlight
@onready var sprite: Sprite2D = $Sprite2D
@onready var engine_player: AudioStreamPlayer2D = $EngineAudio


func _ready() -> void:
	if headlight:
		headlight.enabled = false


func set_rider_mounted(mounted: bool) -> void:
	has_rider = mounted
	if headlight:
		headlight.enabled = mounted
	if engine_player:
		if mounted and not engine_player.playing:
			engine_player.play()
		elif not mounted and engine_player.playing:
			engine_player.stop()


func _physics_process(delta: float) -> void:
	if not has_rider:
		current_speed = move_toward(current_speed, 0.0, brake_deceleration * delta)
		velocity = Vector2.ZERO
		return

	var throttle := Input.get_axis("move_down", "move_up")
	var steer := Input.get_axis("move_left", "move_right")
	var braking := Input.is_action_pressed("brake")

	if braking:
		current_speed = move_toward(current_speed, 0.0, brake_deceleration * delta)
	elif throttle > 0.05:
		if current_speed < 0.0:
			current_speed += brake_deceleration * delta
		else:
			current_speed = minf(max_speed, current_speed + acceleration * throttle * delta)
	elif throttle < -0.05:
		if current_speed > 12.0:
			current_speed -= brake_deceleration * delta
		else:
			current_speed = maxf(reverse_max_speed, current_speed + acceleration * 0.65 * throttle * delta)
	else:
		current_speed = move_toward(current_speed, 0.0, coast_drag * delta)

	var abs_speed := absf(current_speed)
	if abs_speed > 6.0 and absf(steer) > 0.01:
		var turn_authority := clampf(abs_speed / 120.0, 0.25, 1.0)
		var reverse_flip := 1.0 if current_speed >= 0.0 else -1.0
		rotation += steer * turn_speed * turn_authority * reverse_flip * delta

	velocity = Vector2.RIGHT.rotated(rotation) * current_speed
	var collided := move_and_slide()
	if collided:
		current_speed *= 0.45

	if engine_player and engine_player.playing:
		engine_player.pitch_scale = lerpf(0.85, 1.85, clampf(abs_speed / max_speed, 0.0, 1.0))

	speed_changed.emit(roundi((abs_speed / max_speed) * 72.0))
