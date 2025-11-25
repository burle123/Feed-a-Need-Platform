from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password',
            'first_name', 'last_name', 'role',
            'phone', 'address'
        )

    def create(self, validated_data):
        password = validated_data.pop('password')

        # keep the username exactly as frontend sends
        user = User(**validated_data)

        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email',
            'first_name', 'last_name',
            'role', 'phone', 'address'
        )
