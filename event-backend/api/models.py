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

