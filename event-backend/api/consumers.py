"""
WebSocket consumers for real-time updates
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class ConferenceConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for conference planner real-time updates
    
    Handles:
    - Layout changes (elements added/updated/deleted)
    - Guest updates (added/updated/deleted/checked-in)
    - Group changes
    """

    async def connect(self):
        # Get event_id from URL route
        self.event_id = self.scope['url_route']['kwargs'].get('event_id', 'default')
        self.room_group_name = f'conference_{self.event_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to conference {self.event_id}'
        }))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Receive message from WebSocket client
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            # Broadcast to all clients in the same event room
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_update',
                    'data': data
                }
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))

    async def broadcast_update(self, event):
        """
        Broadcast update to WebSocket
        """
        await self.send(text_data=json.dumps(event['data']))

    # Specific update handlers that can be called from views
    async def element_update(self, event):
        """Send element update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'element_update',
            'data': event['data']
        }))

    async def guest_update(self, event):
        """Send guest update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'guest_update',
            'data': event['data']
        }))

    async def group_update(self, event):
        """Send group update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'group_update',
            'data': event['data']
        }))

    async def event_update(self, event):
        """Send event update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'event_update',
            'data': event['data']
        }))


class TradeshowConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for tradeshow planner real-time updates
    """

    async def connect(self):
        self.event_id = self.scope['url_route']['kwargs'].get('event_id', 'default')
        self.room_group_name = f'tradeshow_{self.event_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to tradeshow {self.event_id}'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_update',
                    'data': data
                }
            )
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))

    async def broadcast_update(self, event):
        await self.send(text_data=json.dumps(event['data']))

    async def booth_update(self, event):
        """Send booth update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'booth_update',
            'data': event['data']
        }))

    async def vendor_update(self, event):
        """Send vendor update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'vendor_update',
            'data': event['data']
        }))
