import stripe
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from bookings.models import Booking
from .models import Payment, WalletTransaction

stripe.api_key = settings.STRIPE_SECRET_KEY
User = get_user_model()


#  Stripe based booking payment (kept for reference) do not delete yet 

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
        metadata={'booking_id': booking.id, 'user_id': request.user.id},
    )

    payment, _ = Payment.objects.get_or_create(
        booking=booking,
        defaults={'amount': booking.service.price},
    )
    payment.stripe_payment_intent_id = intent.id
    payment.save()

    return Response({'client_secret': intent.client_secret, 'payment_id': payment.id})


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


# Wallet endpoints

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_funds(request):
    """
    Add funds to the authenticated user's wallet balance.
    Uses select_for_update inside an atomic block so concurrent requests
    can't double-credit the same account.
    """
    try:
        amount = Decimal(str(request.data.get('amount', 0)))
    except Exception:
        return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount < Decimal('5.00'):
        return Response({'error': 'Minimum deposit is $5.00.'}, status=status.HTTP_400_BAD_REQUEST)
    if amount > Decimal('5000.00'):
        return Response({'error': 'Maximum deposit is $5,000.00 per transaction.'}, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        user = User.objects.select_for_update().get(pk=request.user.pk)
        user.wallet_balance += amount
        user.save(update_fields=['wallet_balance'])

        WalletTransaction.objects.create(
            user=user,
            type='deposit',
            amount=amount,
            status='completed',
            note='Funds added to wallet',
        )
    return Response({'balance': float(user.wallet_balance)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wallet_transactions(request):
    """Return the authenticated user's last 50 wallet transactions, newest first."""
    txns = (
        WalletTransaction.objects
        .filter(user=request.user)
        .select_related('booking__service')
        .order_by('-created_at')[:50]
    )
    data = [
        {
            'id':         t.id,
            'type':       t.type,
            'amount':     float(t.amount),
            'status':     t.status,
            'note':       t.note,
            'booking_id': t.booking_id,
            'created_at': t.created_at.isoformat(),
        }
        for t in txns
    ]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_booking(request):
    """
    Pay for a booking using wallet balance.
    - Atomically deducts from buyer, credits provider.
    - Moves the booking to 'confirmed'.
    - Idempotent: second call returns an error if already paid.
    """
    booking_id = request.data.get('booking_id')
    try:
        booking = Booking.objects.select_related('service__provider').get(
            id=booking_id, requester=request.user
        )
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.status == 'cancelled':
        return Response({'error': 'This booking has been cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

    already_paid = WalletTransaction.objects.filter(
        booking=booking, user=request.user, type='payment', status='completed'
    ).exists()
    if already_paid:
        return Response({'error': 'This booking has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)

    amount = booking.service.price

    with db_transaction.atomic():
        buyer = User.objects.select_for_update().get(pk=request.user.pk)

        if buyer.wallet_balance < amount:
            return Response(
                {'error': 'Insufficient wallet balance.', 'balance': float(buyer.wallet_balance)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        #deductiom from buyer happens here 
        buyer.wallet_balance -= amount
        buyer.save(update_fields=['wallet_balance'])
        WalletTransaction.objects.create(
            user=buyer,
            type='payment',
            amount=amount,
            status='completed',
            booking=booking,
            note=f'Paid for: {booking.service.title}',
        )
        provider = User.objects.select_for_update().get(pk=booking.service.provider.pk)
        provider.wallet_balance += amount
        provider.save(update_fields=['wallet_balance'])
        WalletTransaction.objects.create(
            user=provider,
            type='earning',
            amount=amount,
            status='completed',
            booking=booking,
            note=f'Earned from: {booking.service.title}',
        )

        # confirm the booking here
        booking.status = 'confirmed'
        booking.save(update_fields=['status'])

    return Response({'status': 'paid', 'new_balance': float(buyer.wallet_balance)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_withdrawal(request):
    """
    Provider requests a withdrawal of their wallet earnings.
    Balance is held (deducted) immediately; admin processes the payout.
    """
    try:
        amount = Decimal(str(request.data.get('amount', 0)))
    except Exception:
        return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount < Decimal('10.00'):
        return Response({'error': 'Minimum withdrawal is $10.00.'}, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        user = User.objects.select_for_update().get(pk=request.user.pk)

        if user.wallet_balance < amount:
            return Response(
                {'error': 'Insufficient wallet balance.', 'balance': float(user.wallet_balance)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.wallet_balance -= amount
        user.save(update_fields=['wallet_balance'])

        WalletTransaction.objects.create(
            user=user,
            type='withdrawal',
            amount=amount,
            status='pending',
            note='Withdrawal request — 3–5 business days',
        )

    return Response({'status': 'requested', 'new_balance': float(user.wallet_balance)})
