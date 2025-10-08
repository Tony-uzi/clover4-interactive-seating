import uuid, secrets
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


class DesignShare(models.Model):
    ROLE_CHOICES = (
        ("view", "View"),
        ("edit", "Edit"),
    )

    design = models.ForeignKey(Design, on_delete=models.CASCADE, related_name="shares")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="design_shares")
    role = models.CharField(max_length=8, choices=ROLE_CHOICES, default="view")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("design", "user")


class DesignLink(models.Model):
    ROLE_CHOICES = (
        ("view", "View"),
        ("edit", "Edit"),
    )

    design = models.ForeignKey(Design, on_delete=models.CASCADE, related_name="links")
    token = models.CharField(max_length=64, unique=True)
    role = models.CharField(max_length=8, choices=ROLE_CHOICES, default="view")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

#----------------------------------------------- 共有mixin  ----------------------------------------------------------
# TimeStamped（抽象类）提供 created_at/updated_at 自动时间戳。所有实体继承它，方便排序与审计。
class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

# ========= Conference =========
class ConferenceEvent(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conference_events")
    organization_id = models.UUIDField(null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_date = models.DateTimeField(null=True, blank=True)
    room_width = models.DecimalField(max_digits=10, decimal_places=2, default=24.0)
    room_height = models.DecimalField(max_digits=10, decimal_places=2, default=16.0)
    is_public = models.BooleanField(default=False)
    share_token = models.CharField(max_length=64, unique=True, null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    def ensure_share_token(self):
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(24)[:64]

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["organization_id"]),
            models.Index(fields=["share_token"]),
        ]

class ConferenceElement(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(ConferenceEvent, on_delete=models.CASCADE, related_name="elements")
    element_type = models.CharField(max_length=50)  # table_round / chair / podium ...
    label = models.CharField(max_length=255)
    seats = models.IntegerField(default=0)
    position_x = models.DecimalField(max_digits=10, decimal_places=2)
    position_y = models.DecimalField(max_digits=10, decimal_places=2)
    width = models.DecimalField(max_digits=10, decimal_places=2)
    height = models.DecimalField(max_digits=10, decimal_places=2)
    rotation = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    scale_x = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    scale_y = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    class Meta:
        indexes = [models.Index(fields=["event"])]

class ConferenceGuest(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(ConferenceEvent, on_delete=models.CASCADE, related_name="guests")
    name = models.CharField(max_length=255)
    email = models.EmailField()
    dietary_requirements = models.TextField(blank=True)
    company = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    class Meta:
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["email"]),
        ]

class ConferenceSeatAssignment(TimeStamped):
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

# ========= Tradeshow =========
class TradeshowEvent(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tradeshow_events")
    organization_id = models.UUIDField(null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_date_start = models.DateTimeField(null=True, blank=True)
    event_date_end = models.DateTimeField(null=True, blank=True)
    hall_width = models.DecimalField(max_digits=10, decimal_places=2, default=40.0)
    hall_height = models.DecimalField(max_digits=10, decimal_places=2, default=30.0)
    preset_layout = models.CharField(max_length=50, blank=True)  # standard/compact/premium/custom
    is_public = models.BooleanField(default=False)
    share_token = models.CharField(max_length=64, unique=True, null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    def ensure_share_token(self):
        if not self.share_token:
            self.share_token = secrets.token_urlsafe(24)[:64]

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["organization_id"]),
            models.Index(fields=["share_token"]),
        ]

class TradeshowBooth(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(TradeshowEvent, on_delete=models.CASCADE, related_name="booths")
    booth_type = models.CharField(max_length=50)  # booth_standard / booth_large / ...
    category = models.CharField(max_length=50)    # booth / facility / structure
    label = models.CharField(max_length=255)
    position_x = models.DecimalField(max_digits=10, decimal_places=2)
    position_y = models.DecimalField(max_digits=10, decimal_places=2)
    width = models.DecimalField(max_digits=10, decimal_places=2)
    height = models.DecimalField(max_digits=10, decimal_places=2)
    rotation = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    scale_x = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    scale_y = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    class Meta:
        indexes = [models.Index(fields=["event"]), models.Index(fields=["category"])]

class TradeshowVendor(TimeStamped):
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
    metadata = models.JSONField(null=True, blank=True)
    class Meta:
        indexes = [
            models.Index(fields=["event"]),
            models.Index(fields=["company_name"]),
        ]

class TradeshowBoothAssignment(TimeStamped):
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

class TradeshowRoute(TimeStamped):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(TradeshowEvent, on_delete=models.CASCADE, related_name="routes")
    name = models.CharField(max_length=255, default="Default Route")
    route_type = models.CharField(max_length=50, default="auto")
    booth_order = models.JSONField()
    created_by = models.UUIDField(null=True, blank=True)
    class Meta:
        indexes = [models.Index(fields=["event"])]