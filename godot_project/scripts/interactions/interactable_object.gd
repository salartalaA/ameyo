extends Area2D
class_name InteractableObject

enum Kind { BENCH, VENDING, SHOP, SHRINE, LANDMARK }

@export var kind: Kind = Kind.LANDMARK
@export var prompt_label: String = "Inspect"
@export var title: String = "Quiet Corner"
@export var district_name: String = "Ameyo Station Front"
@export_multiline var description: String = "Rain patters softly on the neon-lit pavement."
@export var seat_facing: String = "down"


func seat_marker_position() -> Vector2:
	return global_position + Vector2(0, -4)
