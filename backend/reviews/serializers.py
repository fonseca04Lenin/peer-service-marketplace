from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    provider_username = serializers.CharField(source='booking.service.provider.username', read_only=True)
    service_title = serializers.CharField(source='booking.service.title', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'created_at',
                  'reviewer_username', 'provider_username', 'service_title']