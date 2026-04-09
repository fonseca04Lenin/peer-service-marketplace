from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    provider = UserSerializer(read_only=True)

    class Meta:
        model = Service
        fields = ['id', 'title', 'description', 'category', 'price',
                  'service_area', 'is_remote', 'is_active', 'created_at', 'provider']
        read_only_fields = ['id', 'created_at', 'provider']

    def validate(self, data):
        # On partial update, fall back to the instance's existing values
        instance = self.instance
        is_remote = data.get('is_remote', instance.is_remote if instance else False)
        service_area = data.get('service_area', instance.service_area if instance else '').strip()
        if not is_remote and not service_area:
            raise serializers.ValidationError(
                {'service_area': 'Service area is required for in-person services.'}
            )
        return data
