# Role: reusable business logic (decoupled from HTTP) (Channels later)
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Seat, Attendee, Assignment

def validate_assignment(seat: Seat, attendee: Attendee):
    # 1) Whether the seat is occupied
    if Assignment.objects.filter(seat=seat).exists():
        raise ValidationError("Seat already assigned.")

    # 2) Whether participants are seated or not
    if Assignment.objects.filter(attendee=attendee).exists():
        raise ValidationError("Attendee already seated.")

    # 3) constraints: diet/accessibility/area
    if attendee.requires_wheelchair and not seat.is_accessible:
        raise ValidationError("Accessible seat required.")

    if attendee.dietary == "VEGAN" and not seat.table.supports_vegan:
        raise ValidationError("Table catering incompatible.")

    # Complement other constraints here

@transaction.atomic
def assign_seat(seat_id: int, attendee_id: int) -> Assignment:
    seat = Seat.objects.select_for_update().get(id=seat_id)
    attendee = Attendee.objects.select_for_update().get(id=attendee_id)
    validate_assignment(seat, attendee)
    assignment = Assignment.objects.create(seat=seat, attendee=attendee)
    # TODO: Write operation logs/versions; trigger broadcast events
    return assignment