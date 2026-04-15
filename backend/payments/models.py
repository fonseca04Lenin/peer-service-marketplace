from django.conf import settings
from django.db import models

from bookings.models import Booking


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('refunded', 'Refunded'),
    ]

    booking              = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    amount               = models.DecimalField(max_digits=8, decimal_places=2)
    status               = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    created_at           = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Payment for booking {self.booking.id} — ${self.amount}'


class WalletTransaction(models.Model):
    TYPE_CHOICES = [
        ('deposit',    'Deposit'),      #money added to wallet
        ('withdrawal', 'Withdrawal'),   # money withdrawn from wallet
        ('payment',    'Payment'),      # buyer pays for a service
        ('earning',    'Earning'),      # provider receives payment
        ('refund',     'Refund'),       # money returned to buyerr
    ]
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('completed', 'Completed'),
        ('failed',    'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet_transactions')
    type       = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount     = models.DecimalField(max_digits=10, decimal_places=2)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    booking    = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='wallet_transactions')
    note       = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.type} ${self.amount} — {self.user.username}'
