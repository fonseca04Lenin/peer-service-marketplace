from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Message

User = get_user_model()


class MessageUserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'profile_picture']


class MessageSerializer(serializers.ModelSerializer):
    sender   = MessageUserSerializer(read_only=True)
    receiver = MessageUserSerializer(read_only=True)

    class Meta:
        model  = Message
        fields = ['id', 'sender', 'receiver', 'body', 'is_read', 'created_at']
