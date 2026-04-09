from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('requester', 'Requester'),
        ('provider', 'Provider'),
    ]

    MESSAGING_CHOICES = [
        ('anyone',      'Anyone'),
        ('booked_only', 'Only after a booking'),
    ]

    first_name = models.CharField(max_length=150)
    last_name  = models.CharField(max_length=150)

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='requester')
    bio = models.TextField(blank=True)
    tagline = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    skills = models.TextField(blank=True)  # stored as comma-separated values
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    profile_public = models.BooleanField(default=True)
    messaging_pref = models.CharField(max_length=20, choices=MESSAGING_CHOICES, default='anyone')
    phone   = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=200, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)

    def __str__(self):
        return self.username
