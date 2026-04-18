from django.conf import settings
from django.db import models

from services.models import Service


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending',     'Pending'),
        ('confirmed',   'Confirmed'),
        ('paid',        'Paid'),
        ('in_progress', 'In Progress'),
        ('delivered',   'Delivered'),
        ('completed',   'Completed'),
        ('cancelled',   'Cancelled'),
    ]

    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        svc = self.service.title if self.service_id else '[deleted]'
        return f'{self.requester.username} → {svc} on {self.scheduled_at}'
