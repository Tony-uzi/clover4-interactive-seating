import uuid
import secrets
from django.db import models
from django.conf import settings


class Design(models.Model):
    """A user-owned design file with a friendly name and type (kind)."""
    KIND_CHOICES = (
        ("conference", "Conference"),
        ("tradeshow", "Trade Show"),
        ("custom", "Custom"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="designs")
    name = models.CharField(max_length=200)
    kind = models.CharField(max_length=32, choices=KIND_CHOICES, default="custom")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "name")
        ordering = ["-updated_at", "-id"]

    def __str__(self):
        return f"{self.user_id}:{self.name}"


class DesignVersion(models.Model):
    """Immutable version snapshots for a design, storing editor JSON."""
    design = models.ForeignKey(Design, on_delete=models.CASCADE, related_name="versions")
    version = models.PositiveIntegerField()
    data = models.JSONField(default=dict)
    note = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("design", "version")
        ordering = ["-version"]

    def __str__(self):
        return f"{self.design_id}@{self.version}"




# ========================================== Common Mixin ==========================================
class TimeStamped(models.Model):
    """Abstract base class with automatic timestamp fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ========================================== Conference Models ==========================================
class ConferenceEvent(TimeStamped):
    """Conference event with room layout"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conference_events")
    organization_id = models.UUIDField(null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_date = models.DateTimeField(null=True, blank=True)
    room_width = models.FloatField(default=24.0)
    room_height = models.FloatField(default=16.0)
    is_public = models.BooleanField(default=False)
    share_token = models.CharField(max_length=64, unique=True, null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    def ensure_share_token(self):
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(24)[:64]
            self.save(update_fields=['share_token'])

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["organization_id"]),
            models.Index(fields=["share_token"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.user_id}"


class ConferenceElement(TimeStamped):
    """Elements in conference layout (tables, chairs, doors, outlets, etc.)"""
    ELEMENT_TYPE_CHOICES = [
        ('table_round', 'Round Table'),
        ('table_rectangle', 'Rectangle Table'),
        ('chair', 'Chair'),
        ('podium', 'Podium'),
        ('stage', 'Stage'),
        ('door', 'Door'),
        ('outlet', 'Outlet'),
        ('window', 'Window'),
        ('tactile_paving', 'Tactile Paving'),
        ('custom', 'Custom Element'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(ConferenceEvent, on_delete=models.CASCADE, related_name="elements")
    element_type = models.CharField(max_length=50, choices=ELEMENT_TYPE_CHOICES)
    label = models.CharField(max_length=255)
    seats = models.IntegerField(default=0)
    position_x = models.DecimalField(max_digits=10, decimal_places=2)
    position_y = models.DecimalField(max_digits=10, decimal_places=2)
    width = models.DecimalField(max_digits=10, decimal_places=2)
    height = models.DecimalField(max_digits=10, decimal_places=2)
    rotation = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    scale_x = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    scale_y = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)

    # Door and Outlet specific properties
    door_width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    door_swing = models.CharField(max_length=20, null=True, blank=True)  # left/right/double
    outlet_type = models.CharField(max_length=50, null=True, blank=True)  # power/network/both

    class Meta:
        indexes = [models.Index(fields=["event"])]

    def __str__(self):
        return f"{self.label} ({self.element_type})"


class ConferenceGroup(TimeStamped):
    """Guest grouping for better organization"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(ConferenceEvent, on_delete=models.CASCADE, related_name="groups")
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default="#3B82F6")
    is_system = models.BooleanField(default=False)

    class Meta:
        unique_together = ("event", "name")
        indexes = [models.Index(fields=["event"])]

    def __str__(self):
        return f"{self.name} - {self.event.name}"


class ConferenceGuest(TimeStamped):
    """Guest information for conference"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(ConferenceEvent, on_delete=models.CASCADE, related_name="guests")
    group = models.ForeignKey(ConferenceGroup, on_delete=models.SET_NULL, null=True, blank=True, related_name="guests")
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default='')
    dietary_requirements = models.TextField(blank=True)
    company = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    checked_in = models.BooleanField(default=False)
    check_in_time = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["email"]),
            models.Index(fields=["group"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.event.name}"


class ConferenceSeatAssignment(TimeStamped):
    """Seat assignment for conference guests"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(ConferenceEvent, on_delete=models.CASCADE, related_name="seat_assignments")
    element = models.ForeignKey(ConferenceElement, on_delete=models.CASCADE, related_name="seat_assignments")
    guest = models.ForeignKey(ConferenceGuest, on_delete=models.CASCADE, related_name="seat_assignments")
    seat_number = models.IntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["event", "guest"], name="unique_guest_per_event"),
            models.UniqueConstraint(fields=["event", "element", "seat_number"], name="unique_seat_per_element_event"),
        ]
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["element"]),
            models.Index(fields=["guest"]),
        ]

    def __str__(self):
        return f"{self.guest.name} at {self.element.label}"


# ========================================== Tradeshow Models ==========================================
class TradeshowEvent(TimeStamped):
    """Tradeshow event with exhibition hall"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tradeshow_events")
    organization_id = models.UUIDField(null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_date_start = models.DateTimeField(null=True, blank=True)
    event_date_end = models.DateTimeField(null=True, blank=True)
    hall_width = models.FloatField(default=40.0)
    hall_height = models.FloatField(default=30.0)
    preset_layout = models.CharField(max_length=50, blank=True)
    is_public = models.BooleanField(default=False)
    share_token = models.CharField(max_length=64, unique=True, null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    def ensure_share_token(self):
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(24)[:64]
            self.save(update_fields=['share_token'])

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["organization_id"]),
            models.Index(fields=["share_token"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.user_id}"


class TradeshowBooth(TimeStamped):
    """Booth in tradeshow layout"""
    BOOTH_TYPE_CHOICES = [
        ('booth_standard', 'Standard Booth'),
        ('booth_large', 'Large Booth'),
        ('booth_premium', 'Premium Booth'),
        ('booth_island', 'Island Booth'),
        ('aisle', 'Aisle'),
        ('tactile_paving', 'Tactile Paving'),
        ('waiting_area', 'Waiting Area'),
        ('restroom', 'Restroom'),
        ('info_desk', 'Info Desk'),
        ('door1', 'Door (Style 1)'),
        ('door2', 'Door (Style 2)'),
        ('power_outlet', 'Power Outlet'),
    ]

    CATEGORY_CHOICES = [
        ('booth', 'Booth'),
        ('facility', 'Facility'),
        ('structure', 'Structure'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(TradeshowEvent, on_delete=models.CASCADE, related_name="booths")
    booth_type = models.CharField(max_length=50, choices=BOOTH_TYPE_CHOICES)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    label = models.CharField(max_length=255)
    position_x = models.DecimalField(max_digits=10, decimal_places=2)
    position_y = models.DecimalField(max_digits=10, decimal_places=2)
    width = models.DecimalField(max_digits=10, decimal_places=2)
    height = models.DecimalField(max_digits=10, decimal_places=2)
    rotation = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    scale_x = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    scale_y = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)

    class Meta:
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"{self.label} - {self.event.name}"


class TradeshowVendor(TimeStamped):
    """Vendor/Exhibitor information"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(TradeshowEvent, on_delete=models.CASCADE, related_name="vendors")
    company_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=100, blank=True)
    booth_size_preference = models.CharField(max_length=50, blank=True)
    website = models.CharField(max_length=255, blank=True)
    logo_url = models.CharField(max_length=512, blank=True)
    description = models.TextField(blank=True)
    checked_in = models.BooleanField(default=False)
    check_in_time = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["company_name"]),
        ]

    def __str__(self):
        return f"{self.company_name} - {self.event.name}"


class TradeshowBoothAssignment(TimeStamped):
    """Booth assignment for vendors"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(TradeshowEvent, on_delete=models.CASCADE, related_name="booth_assignments")
    booth = models.ForeignKey(TradeshowBooth, on_delete=models.CASCADE, related_name="assignments")
    vendor = models.ForeignKey(TradeshowVendor, on_delete=models.CASCADE, related_name="assignments")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["event", "booth"], name="unique_vendor_per_booth_event"),
            models.UniqueConstraint(fields=["event", "vendor"], name="unique_booth_per_vendor_event"),
        ]
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["booth"]),
            models.Index(fields=["vendor"]),
        ]

    def __str__(self):
        return f"{self.vendor.company_name} at {self.booth.label}"


class TradeshowRoute(TimeStamped):
    """Route planning for tradeshow navigation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(TradeshowEvent, on_delete=models.CASCADE, related_name="routes")
    name = models.CharField(max_length=255, default="Default Route")
    description = models.TextField(blank=True, default="")
    route_type = models.CharField(max_length=50, default="auto")
    booth_order = models.JSONField()
    color = models.CharField(max_length=20, default="#3B82F6")
    created_by = models.UUIDField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["event"])]

    def __str__(self):
        return f"{self.name} - {self.event.name}"


# ========================================== Schedule/Session Models ==========================================
class EventSession(TimeStamped):
    """Session/Agenda item for events (works for both Conference and Tradeshow)"""
    CATEGORY_CHOICES = [
        ('keynote', 'Keynote'),
        ('workshop', 'Workshop'),
        ('panel', 'Panel Discussion'),
        ('demo', 'Demonstration'),
        ('break', 'Break/Networking'),
        ('ceremony', 'Ceremony'),
        ('presentation', 'Presentation'),
        ('meeting', 'Meeting'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Support both conference and tradeshow events via nullable foreign keys
    conference_event = models.ForeignKey(
        ConferenceEvent, 
        on_delete=models.CASCADE, 
        related_name="sessions",
        null=True,
        blank=True
    )
    tradeshow_event = models.ForeignKey(
        TradeshowEvent,
        on_delete=models.CASCADE,
        related_name="sessions",
        null=True,
        blank=True
    )
    
    title = models.CharField(max_length=255)
    speaker = models.CharField(max_length=255, blank=True)
    speaker_title = models.CharField(max_length=255, blank=True)
    session_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    capacity = models.IntegerField(default=0)
    
    class Meta:
        indexes = [
            models.Index(fields=["conference_event"]),
            models.Index(fields=["tradeshow_event"]),
            models.Index(fields=["session_date", "start_time"]),
        ]
        constraints = [
            # Ensure session belongs to exactly one event type
            models.CheckConstraint(
                check=(
                    models.Q(conference_event__isnull=False, tradeshow_event__isnull=True) |
                    models.Q(conference_event__isnull=True, tradeshow_event__isnull=False)
                ),
                name="session_belongs_to_one_event_type"
            )
        ]
        ordering = ['session_date', 'start_time']

    def __str__(self):
        event_name = self.conference_event.name if self.conference_event else self.tradeshow_event.name
        return f"{self.title} - {event_name} ({self.session_date})"
