from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone
from .models import (
    TradeshowEvent, TradeshowBooth, TradeshowVendor,
    TradeshowBoothAssignment, TradeshowRoute
)
from .serializers import (
    TradeshowEventSerializer, TradeshowEventListSerializer,
    TradeshowBoothSerializer, TradeshowVendorSerializer,
    TradeshowBoothAssignmentSerializer, TradeshowRouteSerializer
)
import csv
import io


# ========================================== Tradeshow Event Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tradeshow_events(request):
    """List all tradeshow events or create a new one"""
    if request.method == 'GET':
        events = TradeshowEvent.objects.filter(user=request.user).annotate(
            vendor_count=Count('vendors'),
            booth_count=Count('booths')
        ).order_by('-updated_at')
        serializer = TradeshowEventListSerializer(events, many=True)
        return Response(serializer.data)

    # POST - create new event
    serializer = TradeshowEventSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tradeshow_event_detail(request, event_id):
    """Get, update, or delete a tradeshow event"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        serializer = TradeshowEventSerializer(event)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = TradeshowEventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tradeshow_event_share(request, event_id):
    """Generate or get share token for event"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)
    event.ensure_share_token()
    return Response({'share_token': event.share_token})


# ========================================== Tradeshow Booth Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tradeshow_booths(request, event_id):
    """List all booths for an event or create new ones"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        booths = TradeshowBooth.objects.filter(event=event).order_by('label')
        serializer = TradeshowBoothSerializer(booths, many=True)
        return Response(serializer.data)

    # POST - create new booth
    serializer = TradeshowBoothSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tradeshow_booth_detail(request, event_id, booth_id):
    """Get, update, or delete a booth"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)
    booth = get_object_or_404(TradeshowBooth, id=booth_id, event=event)

    if request.method == 'GET':
        serializer = TradeshowBoothSerializer(booth)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = TradeshowBoothSerializer(booth, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        booth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tradeshow_booths_bulk(request, event_id):
    """Bulk create/update booths - only creates new booths, doesn't delete existing ones"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)
    booths_data = request.data.get('booths', [])

    created_booths = []
    for booth_data in booths_data:
        booth_data['event'] = str(event.id)
        
        # Check if booth has an ID (if it's a valid UUID, try to update; otherwise create new)
        booth_id = booth_data.get('id')
        if booth_id:
            try:
                # Try to get existing booth
                existing_booth = TradeshowBooth.objects.get(id=booth_id, event=event)
                # Update existing booth
                serializer = TradeshowBoothSerializer(existing_booth, data=booth_data, partial=True)
                if serializer.is_valid():
                    booth = serializer.save()
                    created_booths.append(serializer.data)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except (TradeshowBooth.DoesNotExist, ValueError):
                # Booth doesn't exist or invalid UUID, create new one
                booth_data.pop('id', None)  # Remove invalid ID
                serializer = TradeshowBoothSerializer(data=booth_data)
                if serializer.is_valid():
                    booth = serializer.save(event=event)
                    created_booths.append(serializer.data)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            # No ID provided, create new booth
            serializer = TradeshowBoothSerializer(data=booth_data)
            if serializer.is_valid():
                booth = serializer.save(event=event)
                created_booths.append(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(created_booths, status=status.HTTP_201_CREATED)


# ========================================== Tradeshow Vendor Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tradeshow_vendors(request, event_id):
    """List all vendors for an event or create a new one"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        vendors = TradeshowVendor.objects.filter(event=event).order_by('company_name')
        serializer = TradeshowVendorSerializer(vendors, many=True)
        return Response(serializer.data)

    # POST - create new vendor
    serializer = TradeshowVendorSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tradeshow_vendor_detail(request, event_id, vendor_id):
    """Get, update, or delete a vendor"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)
    vendor = get_object_or_404(TradeshowVendor, id=vendor_id, event=event)

    if request.method == 'GET':
        serializer = TradeshowVendorSerializer(vendor)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = TradeshowVendorSerializer(vendor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        vendor.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tradeshow_vendors_import(request, event_id):
    """Bulk import vendors from CSV"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)

    csv_file = request.FILES.get('file')
    if not csv_file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        decoded_file = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        created_vendors = []
        for row in reader:
            vendor_data = {
                'event': str(event.id),
                'company_name': row.get('company_name', ''),
                'contact_name': row.get('contact_name', ''),
                'contact_email': row.get('contact_email', ''),
                'contact_phone': row.get('contact_phone', ''),
                'category': row.get('category', ''),
                'booth_size_preference': row.get('booth_size_preference', ''),
                'website': row.get('website', ''),
                'description': row.get('description', ''),
            }

            serializer = TradeshowVendorSerializer(data=vendor_data)
            if serializer.is_valid():
                vendor = serializer.save(event=event)
                created_vendors.append(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'count': len(created_vendors),
            'vendors': created_vendors
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tradeshow_vendor_checkin(request, event_id, vendor_id):
    """Check in a vendor"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)
    vendor = get_object_or_404(TradeshowVendor, id=vendor_id, event=event)

    vendor.checked_in = True
    vendor.check_in_time = timezone.now()
    vendor.save()

    serializer = TradeshowVendorSerializer(vendor)
    return Response(serializer.data)


@api_view(['GET'])
def tradeshow_vendor_search(request, event_id):
    """Public endpoint to search vendors by company name for kiosk check-in"""
    query = request.query_params.get('q', '').strip()
    if not query:
        return Response({'error': 'Query parameter required'}, status=status.HTTP_400_BAD_REQUEST)

    event = get_object_or_404(TradeshowEvent, id=event_id)

    vendors = TradeshowVendor.objects.filter(
        event=event,
        company_name__icontains=query
    )

    serializer = TradeshowVendorSerializer(vendors[:10], many=True)
    return Response(serializer.data)


# ========================================== Tradeshow Booth Assignment Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tradeshow_booth_assignments(request, event_id):
    """List all booth assignments or create new ones"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        assignments = TradeshowBoothAssignment.objects.filter(event=event).select_related('vendor', 'booth')
        serializer = TradeshowBoothAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

    # POST - create new assignment
    serializer = TradeshowBoothAssignmentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def tradeshow_booth_assignment_detail(request, event_id, assignment_id):
    """Delete a booth assignment"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)
    assignment = get_object_or_404(TradeshowBoothAssignment, id=assignment_id, event=event)
    assignment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ========================================== Tradeshow Route Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tradeshow_routes(request, event_id):
    """List all routes or create a new one"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        routes = TradeshowRoute.objects.filter(event=event).order_by('-created_at')
        serializer = TradeshowRouteSerializer(routes, many=True)
        return Response(serializer.data)

    # POST - create new route
    serializer = TradeshowRouteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(event=event, created_by=request.user.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tradeshow_route_detail(request, event_id, route_id):
    """Get, update, or delete a route"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)
    route = get_object_or_404(TradeshowRoute, id=route_id, event=event)

    if request.method == 'GET':
        serializer = TradeshowRouteSerializer(route)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = TradeshowRouteSerializer(route, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        route.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
