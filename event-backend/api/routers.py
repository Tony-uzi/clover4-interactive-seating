# What it does: Use DefaultRouter() to map URL prefixes to ViewSets

from rest_framework.routers import DefaultRouter
from .views import (
    VenueViewSet, LayoutViewSet, TableViewSet, SeatViewSet,
    AttendeeViewSet, AssignmentViewSet
)
router = DefaultRouter()
router.register("venues", VenueViewSet)
router.register("layouts", LayoutViewSet)
router.register("tables", TableViewSet)
router.register("seats", SeatViewSet)
router.register("attendees", AttendeeViewSet)
router.register("assignments", AssignmentViewSet)
urlpatterns = router.urls