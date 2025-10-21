from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import ConferenceEvent, TradeshowEvent, EventSession
from .serializers import EventSessionSerializer


# ========================================== Conference Event Sessions ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conference_event_sessions(request, event_id):
    """List all sessions for a conference event or create new ones"""
    event = get_object_or_404(ConferenceEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        sessions = EventSession.objects.filter(conference_event=event).order_by('session_date', 'start_time')
        serializer = EventSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    # POST - create new session
    serializer = EventSessionSerializer(data=request.data)
    if serializer.is_valid():
        # Ensure the session is linked to this conference event
        serializer.save(conference_event=event, tradeshow_event=None)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def conference_session_detail(request, session_id):
    """Get, update, or delete a conference session"""
    session = get_object_or_404(
        EventSession, 
        id=session_id, 
        conference_event__user=request.user
    )

    if request.method == 'GET':
        serializer = EventSessionSerializer(session)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = EventSessionSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ========================================== Tradeshow Event Sessions ==========================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def tradeshow_event_sessions(request, event_id):
    """List all sessions for a tradeshow event or create new ones"""
    event = get_object_or_404(TradeshowEvent, id=event_id, user=request.user)

    if request.method == 'GET':
        sessions = EventSession.objects.filter(tradeshow_event=event).order_by('session_date', 'start_time')
        serializer = EventSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    # POST - create new session
    serializer = EventSessionSerializer(data=request.data)
    if serializer.is_valid():
        # Ensure the session is linked to this tradeshow event
        serializer.save(tradeshow_event=event, conference_event=None)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def tradeshow_session_detail(request, session_id):
    """Get, update, or delete a tradeshow session"""
    session = get_object_or_404(
        EventSession, 
        id=session_id, 
        tradeshow_event__user=request.user
    )

    if request.method == 'GET':
        serializer = EventSessionSerializer(session)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = EventSessionSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

