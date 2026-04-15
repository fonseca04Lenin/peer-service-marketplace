from django.urls import path
from . import views

urlpatterns = [
    path('create-intent/',  views.create_payment_intent, name='create-payment-intent'),
    path('webhook/',        views.stripe_webhook,        name='stripe-webhook'),
    path('deposit/',        views.deposit_funds,         name='wallet-deposit'),
    path('transactions/',   views.wallet_transactions,   name='wallet-transactions'),
    path('pay-booking/',    views.pay_booking,           name='wallet-pay-booking'),
    path('withdraw/',       views.request_withdrawal,    name='wallet-withdraw'),
]
