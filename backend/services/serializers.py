from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    provider_username = serializers.ReadOnlyField(source='provider.username')

    class Meta:
        model = Service
        fields = ['id', 'title', 'description', 'category', 'price',
                  'is_active', 'created_at', 'provider_username']
        read_only_fields = ['id', 'created_at', 'provider_username']
