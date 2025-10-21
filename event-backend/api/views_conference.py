from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.utils import timezone
from .models import (
    ConferenceEvent, ConferenceElement, ConferenceGroup,
    ConferenceGuest, ConferenceSeatAssignment
)
from .serializers import (
    ConferenceEventSerializer, ConferenceEventListSerializer,
    ConferenceElementSerializer, ConferenceGroupSerializer,
    ConferenceGuestSerializer, ConferenceSeatAssignmentSerializer
)
import csv
import io


# ========================================== Conference Event Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conference_events(request):
    """List all conference events or create a new one"""
    if request.method == 'GET':
        events = ConferenceEvent.objects.filter(user=request.user).annotate(
            guest_count=Count('guests'),
            element_count=Count('elements')
        ).order_by('-updated_at')
        serializer = ConferenceEventListSerializer(events, many=True)
        return Response(serializer.data)

    # POST - create new event
    serializer = ConferenceEventSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def conference_event_detail(request, event_id):
    """Get, update, or delete a conference event"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        serializer = ConferenceEventSerializer(event)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = ConferenceEventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def conference_event_share(request, event_id):
    """Generate or get share token for event"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)
    event.ensure_share_token()
    return Response({'share_token': event.share_token})


# ========================================== Conference Element Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conference_elements(request, event_id):
    """List all elements for an event or create new ones"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        elements = ConferenceElement.objects.filter(event=event).order_by('created_at')
        serializer = ConferenceElementSerializer(elements, many=True)
        return Response(serializer.data)

    # POST - create new element
    serializer = ConferenceElementSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def conference_element_detail(request, event_id, element_id):
    """Get, update, or delete an element"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)
    element = get_object_or_404(ConferenceElement, id=element_id, event=event)

    if request.method == 'GET':
        serializer = ConferenceElementSerializer(element)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = ConferenceElementSerializer(element, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        element.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def conference_elements_bulk(request, event_id):
    """Bulk create/update elements"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)
    elements_data = request.data.get('elements', [])

    created_elements = []
    for element_data in elements_data:
        element_data['event'] = str(event.id)
        serializer = ConferenceElementSerializer(data=element_data)
        if serializer.is_valid():
            element = serializer.save(event=event)
            created_elements.append(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(created_elements, status=status.HTTP_201_CREATED)


# ========================================== Conference Group Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conference_groups(request, event_id):
    """List all groups for an event or create a new one"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        groups = ConferenceGroup.objects.filter(event=event).annotate(
            guest_count=Count('guests')
        ).order_by('name')
        serializer = ConferenceGroupSerializer(groups, many=True)
        return Response(serializer.data)

    # POST - create new group
    serializer = ConferenceGroupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def conference_group_detail(request, event_id, group_id):
    """Get, update, or delete a group"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)
    group = get_object_or_404(ConferenceGroup, id=group_id, event=event)

    if request.method == 'GET':
        serializer = ConferenceGroupSerializer(group)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = ConferenceGroupSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ========================================== Conference Guest Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conference_guests(request, event_id):
    """List all guests for an event or create a new one"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        guests = ConferenceGuest.objects.filter(event=event).select_related('group').order_by('name')
        serializer = ConferenceGuestSerializer(guests, many=True)
        return Response(serializer.data)

    # POST - create new guest
    serializer = ConferenceGuestSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def conference_guest_detail(request, event_id, guest_id):
    """Get, update, or delete a guest"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)
    guest = get_object_or_404(ConferenceGuest, id=guest_id, event=event)

    if request.method == 'GET':
        serializer = ConferenceGuestSerializer(guest)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = ConferenceGuestSerializer(guest, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        guest.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def conference_guests_import(request, event_id):
    """Bulk import guests from CSV"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)

    csv_file = request.FILES.get('file')
    if not csv_file:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        decoded_file = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        created_guests = []
        for row in reader:
            # Get or create group if specified
            group = None
            if row.get('group'):
                group, _ = ConferenceGroup.objects.get_or_create(
                    event=event,
                    name=row['group'],
                    defaults={'color': '#3B82F6'}
                )

            guest_data = {
                'event': str(event.id),
                'name': row.get('name', ''),
                'email': row.get('email', ''),
                'company': row.get('company', ''),
                'phone': row.get('phone', ''),
                'dietary_requirements': row.get('dietary_requirements', ''),
                'group': str(group.id) if group else None
            }

            serializer = ConferenceGuestSerializer(data=guest_data)
            if serializer.is_valid():
                guest = serializer.save(event=event, group=group)
                created_guests.append(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'count': len(created_guests),
            'guests': created_guests
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def conference_guest_checkin(request, event_id, guest_id):
    """Check in a guest"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)
    guest = get_object_or_404(ConferenceGuest, id=guest_id, event=event)

    guest.checked_in = True
    guest.check_in_time = timezone.now()
    guest.save()

    serializer = ConferenceGuestSerializer(guest)
    return Response(serializer.data)


@api_view(['GET'])
def conference_guest_search(request, event_id):
    """Public endpoint to search guests by name or email for kiosk check-in"""
    query = request.query_params.get('q', '').strip()
    if not query:
        return Response({'error': 'Query parameter required'}, status=status.HTTP_400_BAD_REQUEST)

    event = get_object_or_404(ConferenceEvent, id=event_id)

    guests = ConferenceGuest.objects.filter(
        event=event
    ).filter(
        name__icontains=query
    ) | ConferenceGuest.objects.filter(
        event=event, email__icontains=query
    )

    serializer = ConferenceGuestSerializer(guests[:10], many=True)
    return Response(serializer.data)


# ========================================== Conference Seat Assignment Views ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conference_seat_assignments(request, event_id):
    """List all seat assignments or create new ones"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        assignments = ConferenceSeatAssignment.objects.filter(event=event).select_related('guest', 'element')
        serializer = ConferenceSeatAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

    # POST - create new assignment
    serializer = ConferenceSeatAssignmentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(event=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def conference_seat_assignment_detail(request, event_id, assignment_id):
    """Delete a seat assignment"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)
    assignment = get_object_or_404(ConferenceSeatAssignment, id=assignment_id, event=event)
    assignment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
