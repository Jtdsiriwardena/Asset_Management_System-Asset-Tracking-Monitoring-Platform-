import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Get token from query string
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # Authenticate user
        self.user = await self.get_user_from_token(token)
        
        if self.user is None or self.user == AnonymousUser():
            print(f"WebSocket connection rejected: Invalid token")
            await self.close()
        else:
            self.group_name = f"user_{self.user.id}_notifications"
            print(f"WebSocket connected for user: {self.user.username}")
            
            # Join room group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to notification service',
                'user_id': self.user.id
            }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        print(f"WebSocket disconnected with code: {close_code}")
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle messages from client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            print(f"Received message: {message_type}")
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            
            elif message_type == 'mark_read':
                await self.mark_notifications_read(data.get('notification_ids', []))
                await self.send_notification_count()
            
        except Exception as e:
            print(f"Error in receive: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def send_notification(self, event):
        """Send notification to client"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    async def notification_count(self, event):
        """Send notification count update"""
        await self.send(text_data=json.dumps({
            'type': 'count_update',
            'count': event['count']
        }))
    
    async def send_notification_count(self):
        """Send current unread count to client"""
        count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'count_update',
            'count': count
        }))
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Get user from JWT token"""
        from django.contrib.auth.models import AnonymousUser
        
        if not token:
            return AnonymousUser()
        
        try:
            access_token = AccessToken(token)
            user = User.objects.get(id=access_token['user_id'])
            return user
        except Exception as e:
            print(f"Token authentication error: {e}")
            return AnonymousUser()
    
    @database_sync_to_async
    def mark_notifications_read(self, notification_ids):
        """Mark notifications as read"""
        from .models import Notification
        
        if notification_ids and self.user and self.user != AnonymousUser():
            Notification.objects.filter(
                id__in=notification_ids,
                recipient=self.user
            ).update(is_read=True)
    
    @database_sync_to_async
    def get_unread_count(self):
        """Get unread notification count"""
        from .models import Notification
        
        if self.user and self.user != AnonymousUser():
            return Notification.objects.filter(
                recipient=self.user,
                is_read=False
            ).count()
        return 0