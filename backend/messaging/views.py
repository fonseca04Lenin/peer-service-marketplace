from django.db import models as db_models
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Message
from .serializers import MessageSerializer, MessageUserSerializer
from bookings.models import Booking

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_list(request):
    me = request.user

    all_msgs = (
        Message.objects
        .filter(db_models.Q(sender=me) | db_models.Q(receiver=me))
        .select_related('sender', 'receiver')
        .order_by('-created_at')
    )

    seen = set()
    conversations = []

    for msg in all_msgs:
        other = msg.receiver if msg.sender_id == me.id else msg.sender
        if other.id in seen:
            continue
        seen.add(other.id)

        unread = Message.objects.filter(
            sender=other, receiver=me, is_read=False
        ).count()

        conversations.append({
            'other_user':   MessageUserSerializer(other, context={'request': request}).data,
            'last_message': MessageSerializer(msg,   context={'request': request}).data,
            'unread_count': unread,
        })

    return Response(conversations)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversation_detail(request, user_id):
    me = request.user

    try:
        other = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if other.pk == me.pk:
        return Response({'error': 'Cannot message yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        msgs = (
            Message.objects
            .filter(
                db_models.Q(sender=me, receiver=other) |
                db_models.Q(sender=other, receiver=me)
            )
            .select_related('sender', 'receiver')
            .order_by('created_at')
        )
        Message.objects.filter(
            sender=other, receiver=me, is_read=False
        ).update(is_read=True)

        return Response(MessageSerializer(msgs, many=True, context={'request': request}).data)

    if other.messaging_pref == 'booked_only':
        shared_booking = Booking.objects.filter(
            db_models.Q(requester=me, service__provider=other) |
            db_models.Q(requester=other, service__provider=me)
        ).exists()
        if not shared_booking:
            return Response(
                {'error': 'This user only accepts messages from people they have a booking with.'},
                status=status.HTTP_403_FORBIDDEN,
            )

    body = request.data.get('body', '').strip()
    if not body:
        return Response({'error': 'Message cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(body) > 2000:
        return Response(
            {'error': 'Message is too long (max 2000 characters).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    msg = Message.objects.create(sender=me, receiver=other, body=body)
    return Response(
        MessageSerializer(msg, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )
