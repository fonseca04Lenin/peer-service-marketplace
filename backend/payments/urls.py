from django.urls import path
from . import views

urlpatterns = [
    path('create-intent/',   views.create_payment_intent, name='create-payment-intent'),
    path('deposit-intent/',  views.create_deposit_intent, name='deposit-intent'),
    path('confirm-deposit/', views.confirm_deposit,       name='confirm-deposit'),
    path('webhook/',         views.stripe_webhook,        name='stripe-webhook'),
    path('deposit/',         views.deposit_funds,         name='wallet-deposit'),
    path('transactions/',    views.wallet_transactions,   name='wallet-transactions'),
    path('pay-booking/',     views.pay_booking,           name='wallet-pay-booking'),
    path('release-escrow/',  views.release_escrow,        name='release-escrow'),
    path('refund-booking/',  views.refund_booking,        name='refund-booking'),
    path('withdraw/',        views.request_withdrawal,    name='wallet-withdraw'),
]
