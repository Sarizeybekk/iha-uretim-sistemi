from rest_framework import serializers
from .models import Parca, ParcaTipi, ParcaDurumu


class ParcaTipiSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParcaTipi
        fields = '__all__'


class ParcaDurumuSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParcaDurumu
        fields = '__all__'


class ParcaSerializer(serializers.ModelSerializer):
    parca_tipi = ParcaTipiSerializer(read_only=True)
    durum = ParcaDurumuSerializer(read_only=True)

    class Meta:
        model = Parca
        fields = '__all__'
