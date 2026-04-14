from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password',
                  'first_name', 'last_name', 'country', 'city']
        extra_kwargs = {
            'email':      {'required': True},
            'first_name': {'required': True},
            'last_name':  {'required': True},
            'country':    {'required': True},
            'city':       {'required': True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'bio', 'tagline', 'city', 'country', 'skills', 'wallet_balance',
                  'profile_public', 'messaging_pref', 'role',
                  'phone', 'address', 'date_of_birth', 'profile_picture']


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'role',
                  'bio', 'tagline', 'city', 'country', 'skills',
                  'profile_public', 'messaging_pref',
                  'phone', 'address', 'date_of_birth', 'profile_picture']
