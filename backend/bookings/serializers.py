from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from services.models import Service
from .models import Booking

User = get_user_model()


class ServiceMiniSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ['id', 'title', 'price', 'rate_type', 'category', 'image', 'is_remote', 'provider_name']

    def get_provider_name(self, obj):
        p = obj.provider
        name = f'{p.first_name} {p.last_name}'.strip()
        return name or p.username

    def get_image(self, obj):
        if obj.image:
            return obj.image.url
        return None


class RequesterMiniSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture']

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class BookingSerializer(serializers.ModelSerializer):
    service = ServiceMiniSerializer(read_only=True)
    requester = RequesterMiniSerializer(read_only=True)
    viewer_role = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'service', 'requester', 'viewer_role',
            'scheduled_at', 'status', 'notes', 'created_at',
        ]

    def get_viewer_role(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        u = request.user
        if obj.requester_id == u.id:
            return 'requester'
        if obj.service and obj.service.provider_id == u.id:
            return 'provider'
        return None


class BookingCreateSerializer(serializers.Serializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.filter(is_active=True))
    scheduled_at = serializers.DateTimeField()
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_scheduled_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError('Choose a date and time in the future.')
        return value
