
from rest_framework import serializers
from apps.inventory.models import Envanter
from apps.parts.serializers import ParcaTipiSerializer
from apps.aircrafts.serializers import UcakTipiSerializer


class EnvanterSerializer(serializers.ModelSerializer):
    parca_tipi_detay = ParcaTipiSerializer(source='parca_tipi', read_only=True)
    ucak_tipi_detay = UcakTipiSerializer(source='ucak_tipi', read_only=True)
    dusuk_stok = serializers.BooleanField(read_only=True)

    class Meta:
        model = Envanter
        fields = [
            'id', 'parca_tipi', 'parca_tipi_detay',
            'ucak_tipi', 'ucak_tipi_detay',
            'mevcut_adet', 'minimum_esik',
            'son_guncelleme', 'dusuk_stok'
        ]
        read_only_fields = ['id', 'son_guncelleme']

    def get_eksik_adet(self, obj):

            return max(0, obj.minimum_esik - obj.mevcut_adet)  # Eğer negatif olursa 0 olarak döndür