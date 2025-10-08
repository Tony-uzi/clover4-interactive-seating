from django.contrib import admin
from .models import Design, DesignVersion, DesignShare, DesignLink


@admin.register(Design)
class DesignAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "name", "kind", "updated_at", "created_at")
    search_fields = ("name", "user__email")
    list_filter = ("kind",)


@admin.register(DesignVersion)
class DesignVersionAdmin(admin.ModelAdmin):
    list_display = ("id", "design", "version", "created_at", "note")
    list_select_related = ("design",)
    search_fields = ("design__name",)


@admin.register(DesignShare)
class DesignShareAdmin(admin.ModelAdmin):
    list_display = ("id", "design", "user", "role", "created_at")
    list_select_related = ("design", "user")


@admin.register(DesignLink)
class DesignLinkAdmin(admin.ModelAdmin):
    list_display = ("id", "design", "token", "role", "created_by", "created_at")
    list_select_related = ("design", "created_by")
