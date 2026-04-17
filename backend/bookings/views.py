from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Booking
from .serializers import BookingCreateSerializer, BookingSerializer


def _booking_qs():
    return Booking.objects.select_related('service', 'service__provider', 'requester').order_by(
        '-scheduled_at'
    )


def _apply_status_transition(booking, new_status, is_provider, is_requester):
    if booking.status == 'cancelled':
        return 'This booking is already cancelled.'

    if is_provider:
        allowed = {
            'pending':     ('confirmed', 'cancelled'),
            'paid':        ('in_progress',),
            'in_progress': ('delivered',),
        }
        if new_status not in allowed.get(booking.status, ()):
            return 'Invalid status transition.'
        booking.status = new_status

    elif is_requester:
        if new_status != 'cancelled':
            return 'Clients can only cancel. Use the release or refund endpoints for paid bookings.'
        if booking.status not in ('pending', 'confirmed'):
            return 'This booking cannot be cancelled here. Use the refund endpoint if you have already paid.'
        booking.status = 'cancelled'

    else:
        return 'Not found.'

    return None


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def booking_list_create(request):
    if request.method == 'GET':
        scope = request.query_params.get('scope', 'all')
        qs = _booking_qs()
        if scope == 'requested':
            qs = qs.filter(requester=request.user)
        elif scope == 'providing':
            qs = qs.filter(service__provider=request.user)
        else:
            qs = qs.filter(Q(requester=request.user) | Q(service__provider=request.user))
        data = BookingSerializer(qs, many=True, context={'request': request}).data
        return Response(data)

    ser = BookingCreateSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    service = ser.validated_data['service']
    if service.provider_id == request.user.id:
        return Response(
            {'detail': 'You cannot book your own listing.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    booking = Booking.objects.create(
        service=service,
        requester=request.user,
        scheduled_at=ser.validated_data['scheduled_at'],
        notes=ser.validated_data.get('notes', ''),
        status='pending',
    )
    booking = _booking_qs().get(pk=booking.pk)
    return Response(
        BookingSerializer(booking, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def booking_detail(request, pk):
    try:
        booking = _booking_qs().get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    uid = request.user.id
    if uid not in (booking.requester_id, booking.service.provider_id):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(BookingSerializer(booking, context={'request': request}).data)

    new_status = request.data.get('status')
    if not new_status or new_status not in dict(Booking.STATUS_CHOICES):
        return Response({'detail': 'Invalid or missing status.'}, status=status.HTTP_400_BAD_REQUEST)

    is_provider = uid == booking.service.provider_id
    is_requester = uid == booking.requester_id

    error = _apply_status_transition(booking, new_status, is_provider, is_requester)
    if error:
        return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

    booking.save()
    booking = _booking_qs().get(pk=booking.pk)
    return Response(BookingSerializer(booking, context={'request': request}).data)
