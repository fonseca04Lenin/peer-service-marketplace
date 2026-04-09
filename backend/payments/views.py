import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from bookings.models import Booking
from .models import Payment

stripe.api_key =settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    booking_id = request.data.get('booking_id')

    try:
        booking = Booking.objects.get(id=booking_id, requester=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if hasattr(booking, 'payment') and booking.payment.status == 'completed':
        return Response({'error': 'This booking has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)

    amount_cents = int(booking.service.price * 100)

    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency='usd',
        metadata={
            'booking_id': booking.id,
            'user_id':    request.user.id,
        },
    )

    payment, _ = Payment.objects.get_or_create(
        booking=booking,
        defaults={'amount': booking.service.price},
    )
    payment.stripe_payment_intent_id = intent.id
    payment.save()

    return Response({
        'client_secret': intent.client_secret,
        'payment_id':    payment.id,
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([])
def stripe_webhook(request):
    payload    = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        return Response({'error': 'Invalid payload or signature.'}, status=status.HTTP_400_BAD_REQUEST)

    intent = event['data']['object']

    if event['type'] == 'payment_intent.succeeded':
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=intent['id'])
            payment.status = 'completed'
            payment.save()
            payment.booking.status = 'confirmed'
            payment.booking.save()
        except Payment.DoesNotExist:
            pass

    elif event['type'] == 'payment_intent.payment_failed':
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=intent['id'])
            payment.status = 'pending'
            payment.save()
        except Payment.DoesNotExist:
            pass

    return Response({'status': 'ok'})
