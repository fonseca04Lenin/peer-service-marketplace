from django.conf import settings
from django.db import models


class Service(models.Model):
    CATEGORY_CHOICES = [
        ('tech_services', 'Tech Services'),
        ('creative_services', 'Creative Services'),
        ('home_services', 'Home Services'),
        ('education', 'Education'),
        ('health_wellness', 'Health & Wellness'),
        ('financial_services', 'Financial Services'),
        ('business_services', 'Business Services'),
        ('other', 'Other'),

    ]

    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='service_images/', blank=True, null=True)
    service_area = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_remote = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.title} by {self.provider.username}'
