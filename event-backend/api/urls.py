from django.urls import path
from .views_auth import login, signup
from .views import designs, designs_detail, design_versions, design_latest, design_version_detail
from .views_conference import (
    conference_events, conference_event_detail, conference_event_share,
    conference_elements, conference_element_detail, conference_elements_bulk,
    conference_groups, conference_group_detail,
    conference_guests, conference_guest_detail, conference_guests_import, conference_guest_checkin, conference_guest_search,
    conference_seat_assignments, conference_seat_assignment_detail
)
from .views_tradeshow import (
    tradeshow_events, tradeshow_event_detail, tradeshow_event_share,
    tradeshow_booths, tradeshow_booth_detail, tradeshow_booths_bulk,
    tradeshow_vendors, tradeshow_vendor_detail, tradeshow_vendors_import, tradeshow_vendor_checkin, tradeshow_vendor_search,
    tradeshow_booth_assignments, tradeshow_booth_assignment_detail,
    tradeshow_routes, tradeshow_route_detail
)
from .views_qr_checkin import (
    qr_checkin_conference, qr_checkin_tradeshow,
    qr_guest_info, qr_vendor_info
)
from .views_schedule import (
    conference_event_sessions, conference_session_detail,
    tradeshow_event_sessions, tradeshow_session_detail
)
from .views_health import health_check, readiness_check

urlpatterns = [
    # Health checks (for Kubernetes probes)
    path('health/', health_check, name='health-check'),
    path('ready/', readiness_check, name='readiness-check'),

    # Authentication
    path('auth/login/', login, name='login'),
    path('auth/register/', signup, name='signup'),

    # Designs and versions
    path('designs/', designs, name='designs'),
    path('designs/<int:design_id>/', designs_detail, name='designs-detail'),
    path('designs/<int:design_id>/versions/', design_versions, name='design-versions'),
    path('designs/<int:design_id>/latest/', design_latest, name='design-latest'),
    path('designs/<int:design_id>/versions/<int:version>/', design_version_detail, name='design-version-detail'),

    # Conference Events
    path('conference/events/', conference_events, name='conference-events'),
    path('conference/events/<uuid:event_id>/', conference_event_detail, name='conference-event-detail'),
    path('conference/events/<uuid:event_id>/share/', conference_event_share, name='conference-event-share'),

    # Conference Elements
    path('conference/events/<uuid:event_id>/elements/', conference_elements, name='conference-elements'),
    path('conference/events/<uuid:event_id>/elements/bulk/', conference_elements_bulk, name='conference-elements-bulk'),
    path('conference/events/<uuid:event_id>/elements/<uuid:element_id>/', conference_element_detail, name='conference-element-detail'),

    # Conference Groups
    path('conference/events/<uuid:event_id>/groups/', conference_groups, name='conference-groups'),
    path('conference/events/<uuid:event_id>/groups/<uuid:group_id>/', conference_group_detail, name='conference-group-detail'),

    # Conference Guests
    path('conference/events/<uuid:event_id>/guests/', conference_guests, name='conference-guests'),
    path('conference/events/<uuid:event_id>/guests/import/', conference_guests_import, name='conference-guests-import'),
    path('conference/events/<uuid:event_id>/guests/search/', conference_guest_search, name='conference-guest-search'),
    path('conference/events/<uuid:event_id>/guests/<uuid:guest_id>/', conference_guest_detail, name='conference-guest-detail'),
    path('conference/events/<uuid:event_id>/guests/<uuid:guest_id>/checkin/', conference_guest_checkin, name='conference-guest-checkin'),

    # Conference Seat Assignments
    path('conference/events/<uuid:event_id>/seat-assignments/', conference_seat_assignments, name='conference-seat-assignments'),
    path('conference/events/<uuid:event_id>/seat-assignments/<uuid:assignment_id>/', conference_seat_assignment_detail, name='conference-seat-assignment-detail'),

    # Conference Sessions (Schedule/Agenda)
    path('conference/events/<uuid:event_id>/sessions/', conference_event_sessions, name='conference-event-sessions'),
    path('conference/sessions/<uuid:session_id>/', conference_session_detail, name='conference-session-detail'),

    # Tradeshow Events
    path('tradeshow/events/', tradeshow_events, name='tradeshow-events'),
    path('tradeshow/events/<uuid:event_id>/', tradeshow_event_detail, name='tradeshow-event-detail'),
    path('tradeshow/events/<uuid:event_id>/share/', tradeshow_event_share, name='tradeshow-event-share'),

    # Tradeshow Booths
    path('tradeshow/events/<uuid:event_id>/booths/', tradeshow_booths, name='tradeshow-booths'),
    path('tradeshow/events/<uuid:event_id>/booths/bulk/', tradeshow_booths_bulk, name='tradeshow-booths-bulk'),
    path('tradeshow/events/<uuid:event_id>/booths/<uuid:booth_id>/', tradeshow_booth_detail, name='tradeshow-booth-detail'),

    # Tradeshow Vendors
    path('tradeshow/events/<uuid:event_id>/vendors/', tradeshow_vendors, name='tradeshow-vendors'),
    path('tradeshow/events/<uuid:event_id>/vendors/import/', tradeshow_vendors_import, name='tradeshow-vendors-import'),
    path('tradeshow/events/<uuid:event_id>/vendors/search/', tradeshow_vendor_search, name='tradeshow-vendor-search'),
    path('tradeshow/events/<uuid:event_id>/vendors/<uuid:vendor_id>/', tradeshow_vendor_detail, name='tradeshow-vendor-detail'),
    path('tradeshow/events/<uuid:event_id>/vendors/<uuid:vendor_id>/checkin/', tradeshow_vendor_checkin, name='tradeshow-vendor-checkin'),

    # Tradeshow Booth Assignments
    path('tradeshow/events/<uuid:event_id>/booth-assignments/', tradeshow_booth_assignments, name='tradeshow-booth-assignments'),
    path('tradeshow/events/<uuid:event_id>/booth-assignments/<uuid:assignment_id>/', tradeshow_booth_assignment_detail, name='tradeshow-booth-assignment-detail'),

    # Tradeshow Routes
    path('tradeshow/events/<uuid:event_id>/routes/', tradeshow_routes, name='tradeshow-routes'),
    path('tradeshow/events/<uuid:event_id>/routes/<uuid:route_id>/', tradeshow_route_detail, name='tradeshow-route-detail'),

    # Tradeshow Sessions (Schedule/Agenda)
    path('tradeshow/events/<uuid:event_id>/sessions/', tradeshow_event_sessions, name='tradeshow-event-sessions'),
    path('tradeshow/sessions/<uuid:session_id>/', tradeshow_session_detail, name='tradeshow-session-detail'),

    # QR Code Check-in (Public, no authentication required)
    path('qr/conference/<uuid:event_id>/guest/<uuid:guest_id>/checkin/', qr_checkin_conference, name='qr-checkin-conference'),
    path('qr/tradeshow/<uuid:event_id>/vendor/<uuid:vendor_id>/checkin/', qr_checkin_tradeshow, name='qr-checkin-tradeshow'),
    path('qr/conference/<uuid:event_id>/guest/<uuid:guest_id>/info/', qr_guest_info, name='qr-guest-info'),
    path('qr/tradeshow/<uuid:event_id>/vendor/<uuid:vendor_id>/info/', qr_vendor_info, name='qr-vendor-info'),
]