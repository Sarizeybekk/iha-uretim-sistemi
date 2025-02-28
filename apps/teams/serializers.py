from rest_framework import serializers
from .models import Takim, KullaniciTakim

class TakimSerializer(serializers.ModelSerializer):
    class Meta:
        model = Takim
        fields = '__all__'

class KullaniciTakimSerializer(serializers.ModelSerializer):
    class Meta:
        model = KullaniciTakim
        fields = '__all__'
