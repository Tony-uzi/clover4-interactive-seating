"""
WebSocket URL routing
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/conference/(?P<event_id>\w+)/$', consumers.ConferenceConsumer.as_asgi()),
    re_path(r'ws/tradeshow/(?P<event_id>\w+)/$', consumers.TradeshowConsumer.as_asgi()),
]
