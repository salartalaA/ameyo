extends Camera2D
class_name CameraRig

@export var follow_target: Node2D
@export var smooth_speed: float = 7.5
@export var world_bounds: Rect2i = Rect2i(0, 0, 3200, 2400)


func _ready() -> void:
	limit_left = world_bounds.position.x
	limit_top = world_bounds.position.y
	limit_right = world_bounds.end.x
	limit_bottom = world_bounds.end.y
	position_smoothing_enabled = true
	position_smoothing_speed = smooth_speed


func _process(delta: float) -> void:
	if not follow_target:
		return
	var target_pos := follow_target.global_position
	if follow_target is PlayerController and follow_target.is_mounted and follow_target.active_motorcycle:
		var moto := follow_target.active_motorcycle
		target_pos += Vector2.RIGHT.rotated(moto.rotation) * (moto.current_speed * 0.22)
	global_position = global_position.lerp(target_pos, 1.0 - exp(-smooth_speed * delta))
