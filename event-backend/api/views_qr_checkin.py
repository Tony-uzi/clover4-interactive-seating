"""
QR Code Check-in Views
Public API endpoints for QR code based check-in without authentication
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    ConferenceEvent, ConferenceGuest,
    TradeshowEvent, TradeshowVendor
)
from .serializers import (
    ConferenceGuestSerializer,
    TradeshowVendorSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def qr_checkin_conference(request, event_id, guest_id):
    """
    Public endpoint for QR code check-in of conference guests
    No authentication required - designed for kiosk use
    """
    # Get event (public, no user check)
    event = get_object_or_404(ConferenceEvent, id=event_id)
    
    # Get guest
    guest = get_object_or_404(ConferenceGuest, id=guest_id, event=event)
    
    # Check if already checked in
    if guest.checked_in:
        return Response({
            'success': False,
            'message': f'{guest.name} is already checked in.',
            'guest': ConferenceGuestSerializer(guest).data
        }, status=status.HTTP_200_OK)
    
    # Perform check-in
    guest.checked_in = True
    guest.check_in_time = timezone.now()
    guest.save()
    
    return Response({
        'success': True,
        'message': f'{guest.name} checked in successfully!',
        'guest': ConferenceGuestSerializer(guest).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def qr_checkin_tradeshow(request, event_id, vendor_id):
    """
    Public endpoint for QR code check-in of tradeshow vendors
    No authentication required - designed for kiosk use
    """
    # Get event (public, no user check)
    event = get_object_or_404(TradeshowEvent, id=event_id)
    
    # Get vendor
    vendor = get_object_or_404(TradeshowVendor, id=vendor_id, event=event)
    
    # Check if already checked in
    if vendor.checked_in:
        return Response({
            'success': False,
            'message': f'{vendor.name} is already checked in.',
            'vendor': TradeshowVendorSerializer(vendor).data
        }, status=status.HTTP_200_OK)
    
    # Perform check-in
    vendor.checked_in = True
    vendor.check_in_time = timezone.now()
    vendor.save()
    
    return Response({
        'success': True,
        'message': f'{vendor.name} checked in successfully!',
        'vendor': TradeshowVendorSerializer(vendor).data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def qr_guest_info(request, event_id, guest_id):
    """
    Public endpoint to get guest information by QR code
    Returns guest details without checking in
    """
    event = get_object_or_404(ConferenceEvent, id=event_id)
    guest = get_object_or_404(ConferenceGuest, id=guest_id, event=event)
    
    return Response({
        'success': True,
        'guest': ConferenceGuestSerializer(guest).data,
        'event': {
            'id': str(event.id),
            'name': event.name,
            'description': event.description
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def qr_vendor_info(request, event_id, vendor_id):
    """
    Public endpoint to get vendor information by QR code
    Returns vendor details without checking in
    """
    event = get_object_or_404(TradeshowEvent, id=event_id)
    vendor = get_object_or_404(TradeshowVendor, id=vendor_id, event=event)
    
    return Response({
        'success': True,
        'vendor': TradeshowVendorSerializer(vendor).data,
        'event': {
            'id': str(event.id),
            'name': event.name,
            'description': event.description
        }
    })
