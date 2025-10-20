"""
Utility functions for broadcasting WebSocket updates from Django views
"""

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def broadcast_conference_update(event_id, update_type, data):
    """
    Broadcast update to all clients connected to a conference event
    
    Args:
        event_id: Conference event ID
        update_type: Type of update ('element_update', 'guest_update', etc.)
        data: Update data to broadcast
    """
    channel_layer = get_channel_layer()
    room_group_name = f'conference_{event_id}'
    
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': update_type,
            'data': data
        }
    )


def broadcast_tradeshow_update(event_id, update_type, data):
    """
    Broadcast update to all clients connected to a tradeshow event
    
    Args:
        event_id: Tradeshow event ID
        update_type: Type of update ('booth_update', 'vendor_update', etc.)
        data: Update data to broadcast
    """
    channel_layer = get_channel_layer()
    room_group_name = f'tradeshow_{event_id}'
    
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': update_type,
            'data': data
        }
    )
