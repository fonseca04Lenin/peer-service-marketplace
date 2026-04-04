from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('requester', 'Requester'),
        ('provider', 'Provider'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='requester')
    bio = models.TextField(blank=True)
    tagline = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    skills = models.TextField(blank=True)  # stored as comma-separated values
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.username
