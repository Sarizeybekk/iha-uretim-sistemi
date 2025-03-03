from rest_framework import serializers
from .models import Takim, KullaniciTakim
from apps.accounts.serializers import KullaniciSerializer


class TakimSerializer(serializers.ModelSerializer):
    takim_tipi_adi = serializers.CharField(source='get_takim_tipi_display', read_only=True)
    personel_sayisi = serializers.SerializerMethodField()

    class Meta:
        model = Takim
        fields = [
            'id', 'ad', 'takim_tipi', 'takim_tipi_adi', 'aciklama',
            'montaj_yetkisi', 'olusturma_tarihi', 'personel_sayisi'
        ]
        read_only_fields = ['olusturma_tarihi']

    def get_personel_sayisi(self, obj):
        return obj.uyeler.count()


class KullaniciTakimSerializer(serializers.ModelSerializer):
    kullanici_detay = KullaniciSerializer(source='kullanici', read_only=True)
    takim_detay = TakimSerializer(source='takim', read_only=True)

    class Meta:
        model = KullaniciTakim
        fields = ['id', 'kullanici', 'kullanici_detay', 'takim', 'takim_detay', 'katilma_tarihi']
        read_only_fields = ['katilma_tarihi']