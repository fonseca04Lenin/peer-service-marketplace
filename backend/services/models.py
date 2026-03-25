from django.conf import settings
from django.db import models


class Service(models.Model):
    CATEGORY_CHOICES = [
        ('tutoring', 'Tutoring'),
        ('handyman', 'Handyman'),
        ('tech', 'Tech Help'),
        ('creative', 'Creative Services'),
        ('home', 'Home Assistance'),
        ('other', 'Other'),
    ]

    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.title} by {self.provider.username}'
