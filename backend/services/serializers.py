from rest_framework import serializers
from django.db.models import Avg, Count
from users.serializers import UserSerializer
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    provider       = UserSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count   = serializers.SerializerMethodField()

    def get_average_rating(self, obj):
        result = obj.bookings.filter(review__isnull=False).aggregate(avg=Avg('review__rating'))
        avg = result['avg']
        return round(avg, 1) if avg else None

    def get_review_count(self, obj):
        return obj.bookings.filter(review__isnull=False).aggregate(n=Count('review'))['n']

    class Meta:
        model = Service
        fields = ['id', 'title', 'description', 'category', 'price',
                  'image', 'service_area', 'is_remote', 'is_active', 'created_at',
                  'provider', 'average_rating', 'review_count']
        read_only_fields = ['id', 'created_at', 'provider', 'is_active']
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        instance = self.instance
        is_remote = data.get('is_remote', instance.is_remote if instance else False)
        service_area = data.get('service_area', instance.service_area if instance else '').strip()
        if not is_remote and not service_area:
            raise serializers.ValidationError(
                {'service_area': 'Service area is required for in-person services.'}
            )
        if instance is None and not data.get('image'):
            raise serializers.ValidationError(
                {'image': 'A service image is required.'}
            )
        return data
