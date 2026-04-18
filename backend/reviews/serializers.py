from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    provider_username = serializers.SerializerMethodField()
    service_title = serializers.SerializerMethodField()

    def get_provider_username(self, obj):
        svc = obj.booking.service if obj.booking.service_id else None
        return svc.provider.username if svc else None

    def get_service_title(self, obj):
        svc = obj.booking.service if obj.booking.service_id else None
        return svc.title if svc else None

    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'created_at',
                  'reviewer_username', 'provider_username', 'service_title']