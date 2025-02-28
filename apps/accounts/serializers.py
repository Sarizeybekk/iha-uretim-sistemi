
from rest_framework import serializers
from .models import Kullanici

class KullaniciSerializer(serializers.ModelSerializer):
    class Meta:
        model = Kullanici
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['id']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, write_only=True)