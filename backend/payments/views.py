import stripe
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction as db_transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from bookings.models import Booking
from .models import EscrowEntry, Payment, WalletTransaction

stripe.api_key = settings.STRIPE_SECRET_KEY
User = get_user_model()

PLATFORM_FEE_PERCENT = Decimal(str(getattr(settings, 'PLATFORM_FEE_PERCENT', 10)))
ESCROW_RELEASE_DAYS  = int(getattr(settings, 'ESCROW_RELEASE_DAYS', 7))


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_deposit_intent(request):
    try:
        amount = Decimal(str(request.data.get('amount', 0)))
    except Exception:
        return Response({'error': 'Invalid amount.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount < Decimal('5.00'):
        return Response({'error': 'Minimum deposit is $5.00.'}, status=status.HTTP_400_BAD_REQUEST)
    if amount > Decimal('5000.00'):
        return Response({'error': 'Maximum deposit is $5,000.00 per transaction.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency='usd',
            payment_method_types=['card'],
            metadata={
                'type':    'deposit',
                'user_id': str(request.user.id),
                'amount':  str(amount),
            },
        )
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'client_secret': intent.client_secret, 'intent_id': intent.id})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_deposit(request):
    intent_id = request.data.get('intent_id')
    if not intent_id:
        return Response({'error': 'Missing intent_id.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        intent = stripe.PaymentIntent.retrieve(intent_id)
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    if str(intent.metadata.get('user_id')) != str(request.user.id):
        return Response({'error': 'Intent does not belong to this user.'}, status=status.HTTP_403_FORBIDDEN)

    if intent.status != 'succeeded':
        return Response({'error': 'Payment has not succeeded yet.'}, status=status.HTTP_400_BAD_REQUEST)

    if WalletTransaction.objects.filter(note__contains=intent_id).exists():
        user = User.objects.get(pk=request.user.pk)
        return Response({'balance': float(user.wallet_balance)})

    try:
        amount = Decimal(intent.metadata.get('amount', ''))
        if amount <= 0:
            raise ValueError
    except Exception:
        return Response({'error': 'Invalid deposit amount in intent metadata.'}, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        user = User.objects.select_for_update().get(pk=request.user.pk)
        user.wallet_balance += amount
        user.save(update_fields=['wallet_balance'])

        WalletTransaction.objects.create(
            user=user,
            type='deposit',
            amount=amount,
            status='completed',
            note=f'Stripe deposit #{intent_id}',
        )

    return Response({'balance': float(user.wallet_balance)})


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
        tx_type = intent.get('metadata', {}).get('type')

        if tx_type == 'deposit':
            if not WalletTransaction.objects.filter(note__contains=intent['id']).exists():
                user_id = intent['metadata'].get('user_id')
                amount  = Decimal(intent['metadata'].get('amount', '0'))
                try:
                    with db_transaction.atomic():
                        user = User.objects.select_for_update().get(pk=user_id)
                        user.wallet_balance += amount
                        user.save(update_fields=['wallet_balance'])
                        WalletTransaction.objects.create(
                            user=user,
                            type='deposit',
                            amount=amount,
                            status='completed',
                            note=f'Stripe deposit #{intent["id"]}',
                        )
                except User.DoesNotExist:
                    pass
        else:
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_funds(request):
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
    booking_id = request.data.get('booking_id')
    try:
        booking = Booking.objects.select_related('service__provider').get(
            id=booking_id, requester=request.user
        )
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.status != 'confirmed':
        if booking.status == 'cancelled':
            return Response({'error': 'This booking has been cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        if booking.status == 'paid':
            return Response({'error': 'This booking has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'Booking must be confirmed by the provider before payment.'}, status=status.HTTP_400_BAD_REQUEST)

    if hasattr(booking, 'escrow'):
        return Response({'error': 'This booking has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)

    if not booking.service_id:
        return Response({'error': 'This listing has been removed and cannot be paid for.'}, status=status.HTTP_400_BAD_REQUEST)

    total    = booking.service.price
    fee      = (total * PLATFORM_FEE_PERCENT / Decimal('100')).quantize(Decimal('0.01'))
    net      = total - fee

    with db_transaction.atomic():
        buyer = User.objects.select_for_update().get(pk=request.user.pk)

        if buyer.wallet_balance < total:
            return Response(
                {'error': 'Insufficient wallet balance.', 'balance': float(buyer.wallet_balance)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        buyer.wallet_balance -= total
        buyer.save(update_fields=['wallet_balance'])

        WalletTransaction.objects.create(
            user=buyer,
            type='payment',
            amount=total,
            status='completed',
            booking=booking,
            note=f'Paid for: {booking.service.title}',
        )

        WalletTransaction.objects.create(
            user=buyer,
            type='platform_fee',
            amount=fee,
            status='completed',
            booking=booking,
            note=f'Platform fee (10%): {booking.service.title}',
        )

        provider = User.objects.select_for_update().get(pk=booking.service.provider.pk)
        provider.escrow_balance += net
        provider.save(update_fields=['escrow_balance'])

        WalletTransaction.objects.create(
            user=provider,
            type='escrow',
            amount=net,
            status='completed',
            booking=booking,
            note=f'Held in escrow: {booking.service.title}',
        )

        EscrowEntry.objects.create(
            booking=booking,
            amount=net,
            platform_fee=fee,
            status='held',
            release_after=timezone.now() + timezone.timedelta(days=ESCROW_RELEASE_DAYS),
        )

        booking.status = 'paid'
        booking.save(update_fields=['status'])

    return Response({'status': 'paid', 'new_balance': float(buyer.wallet_balance)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def release_escrow(request):
    booking_id = request.data.get('booking_id')
    try:
        booking = Booking.objects.select_related('service__provider').get(
            id=booking_id, requester=request.user
        )
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.status != 'delivered':
        return Response({'error': 'Provider must mark the service as delivered first.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        escrow = EscrowEntry.objects.get(booking=booking, status='held')
    except EscrowEntry.DoesNotExist:
        return Response({'error': 'No held escrow found for this booking.'}, status=status.HTTP_400_BAD_REQUEST)

    provider_id = (
        booking.service.provider_id if booking.service_id
        else booking.wallet_transactions.filter(type='escrow').values_list('user_id', flat=True).first()
    )
    if not provider_id:
        return Response({'error': 'Could not identify provider for this booking.'}, status=status.HTTP_400_BAD_REQUEST)

    svc_title = booking.service.title if booking.service_id else 'deleted listing'

    with db_transaction.atomic():
        provider = User.objects.select_for_update().get(pk=provider_id)
        provider.escrow_balance -= escrow.amount
        provider.wallet_balance += escrow.amount
        provider.save(update_fields=['escrow_balance', 'wallet_balance'])

        WalletTransaction.objects.create(
            user=provider,
            type='earning',
            amount=escrow.amount,
            status='completed',
            booking=booking,
            note=f'Payment released: {svc_title}',
        )

        escrow.status = 'released'
        escrow.save(update_fields=['status'])

        booking.status = 'completed'
        booking.save(update_fields=['status'])

    return Response({'status': 'completed'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_booking(request):
    booking_id = request.data.get('booking_id')
    try:
        booking = Booking.objects.select_related('service__provider').get(
            id=booking_id, requester=request.user
        )
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.status not in ('paid', 'in_progress'):
        return Response({'error': 'Refunds are only available before the service is delivered.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        escrow = EscrowEntry.objects.get(booking=booking, status='held')
    except EscrowEntry.DoesNotExist:
        return Response({'error': 'No held escrow found for this booking.'}, status=status.HTTP_400_BAD_REQUEST)

    refund_amount = escrow.amount + escrow.platform_fee
    provider_id = (
        booking.service.provider_id if booking.service_id
        else booking.wallet_transactions.filter(type='escrow').values_list('user_id', flat=True).first()
    )
    if not provider_id:
        return Response({'error': 'Could not identify provider for this booking.'}, status=status.HTTP_400_BAD_REQUEST)

    svc_title = booking.service.title if booking.service_id else 'deleted listing'

    with db_transaction.atomic():
        buyer = User.objects.select_for_update().get(pk=request.user.pk)
        buyer.wallet_balance += refund_amount
        buyer.save(update_fields=['wallet_balance'])

        WalletTransaction.objects.create(
            user=buyer,
            type='refund',
            amount=refund_amount,
            status='completed',
            booking=booking,
            note=f'Refund: {svc_title}',
        )

        provider = User.objects.select_for_update().get(pk=provider_id)
        provider.escrow_balance -= escrow.amount
        provider.save(update_fields=['escrow_balance'])

        escrow.status = 'refunded'
        escrow.save(update_fields=['status'])

        booking.status = 'cancelled'
        booking.save(update_fields=['status'])

    return Response({'status': 'refunded', 'new_balance': float(buyer.wallet_balance)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_withdrawal(request):
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
                {'error': 'Insufficient available balance.', 'balance': float(user.wallet_balance)},
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
