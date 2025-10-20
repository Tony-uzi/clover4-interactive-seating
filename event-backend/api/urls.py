from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_auth import login, signup
from .views import designs, design_versions, design_latest, design_version_detail, create_share_link, invite_user, shared_designs
from .views import (
    ConferenceEventViewSet, ConferenceElementViewSet, ConferenceGuestViewSet,
    ConferenceSeatAssignmentViewSet, ConferenceShareViewSet,
    TradeshowEventViewSet, TradeshowShareViewSet,ConferenceGroupViewSet
)

app_name = "api"

router = DefaultRouter()
# Conference viewset
router.register(r"conference/events", ConferenceEventViewSet, basename="conf-events")
router.register(r"conference/elements", ConferenceElementViewSet, basename="conf-elements")
router.register(r"conference/guests", ConferenceGuestViewSet, basename="conf-guests")
router.register(r"conference/assignments", ConferenceSeatAssignmentViewSet, basename="conf-assignments")
router.register(r"conference/share", ConferenceShareViewSet, basename="conf-share")
router.register(r"conference/groups", ConferenceGroupViewSet, basename="conf-groups")

# Tradeshow
router.register(r"tradeshow/events", TradeshowEventViewSet, basename="ts-events")
router.register(r"tradeshow/share", TradeshowShareViewSet, basename="ts-share")

urlpatterns = [
    path('auth/login/', login, name='login'),
    path('auth/register/', signup, name='signup'),

    # Designs and versions
    path('designs/', designs, name='designs'),
    path('designs/shared/', shared_designs, name='shared-designs'),
    path('designs/<int:design_id>/versions/', design_versions, name='design-versions'),
    path('designs/<int:design_id>/latest/', design_latest, name='design-latest'),
    path('designs/<int:design_id>/versions/<int:version>/', design_version_detail, name='design-version-detail'),
    path('designs/<int:design_id>/share-link/', create_share_link, name='design-create-share-link'),
    path('designs/<int:design_id>/invite/', invite_user, name='design-invite-user'),

    path("", include(router.urls)),
]