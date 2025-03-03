from rest_framework import serializers
from .models import Envanter


class EnvanterSerializer(serializers.ModelSerializer):
    parca_tipi_adi = serializers.CharField(source='parca_tipi.get_ad_display', read_only=True)
    ucak_tipi_kodu = serializers.CharField(source='ucak_tipi.kod', read_only=True)
    ucak_tipi_adi = serializers.CharField(source='ucak_tipi.ad', read_only=True)
    dusuk_stok_durumu = serializers.BooleanField(source='dusuk_stok', read_only=True)

    class Meta:
        model = Envanter
        fields = [
            'id', 'parca_tipi', 'parca_tipi_adi', 'ucak_tipi', 'ucak_tipi_kodu', 'ucak_tipi_adi',
            'mevcut_adet', 'minimum_esik', 'son_guncelleme', 'dusuk_stok_durumu'
        ]
        read_only_fields = ['son_guncelleme']


class EnvanterDurumuSerializer(serializers.Serializer):
    ucak_tipi = serializers.CharField()  # 'ucak_tipi_kodu' yerine
    ozet = serializers.ListField(child=serializers.DictField())  # 'parca_durumlari' yerine
    montaj_icin_yeterli = serializers.BooleanField()
    eksik_parcalar = serializers.ListField(child=serializers.CharField(), required=False)

class ParcaDurumuSerializer(serializers.Serializer):
    parca_tipi = serializers.CharField()
    mevcut_adet = serializers.IntegerField()
    minimum_esik = serializers.IntegerField()
    dusuk_stok = serializers.BooleanField()