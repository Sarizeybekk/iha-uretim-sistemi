
from rest_framework import serializers
from apps.aircrafts.models import UcakTipi, UcakDurumu, Ucak, ParcaKullanimi
from apps.parts.serializers import ParcaSerializer


class UcakTipiSerializer(serializers.ModelSerializer):
    class Meta:
        model = UcakTipi
        fields = ['id', 'kod', 'ad', 'aciklama']
        read_only_fields = ['id']



class UcakDurumuSerializer(serializers.ModelSerializer):
    class Meta:
        model = UcakDurumu
        fields = ['id', 'ad', 'aciklama']
        read_only_fields = ['id']


class ParcaKullanimiSerializer(serializers.ModelSerializer):
    parca_detay = ParcaSerializer(source='parca', read_only=True)

    class Meta:
        model = ParcaKullanimi
        fields = ['id', 'parca', 'parca_detay', 'ucak', 'kullanim_tarihi', 'aktif']
        read_only_fields = ['id', 'kullanim_tarihi']


class UcakSerializer(serializers.ModelSerializer):
    ucak_tipi_adi = serializers.ReadOnlyField(source='ucak_tipi.ad')
    montaj_yapan_takim_adi = serializers.ReadOnlyField(source='montaj_yapan_takim.ad')
    durum_adi = serializers.ReadOnlyField(source='durum.get_ad_display')
    parcalar_bilgisi = serializers.SerializerMethodField()

    class Meta:
        model = Ucak
        fields = [
            'id', 'seri_no', 'ucak_tipi', 'ucak_tipi_adi',
            'montaj_yapan_takim', 'montaj_yapan_takim_adi',
            'durum', 'durum_adi', 'montaj_tarihi',
            'guncelleme_tarihi', 'notlar', 'parcalar_bilgisi'
        ]
        read_only_fields = ['id', 'montaj_tarihi', 'guncelleme_tarihi']

    def get_parcalar_bilgisi(self, obj):
        parcalar = ParcaKullanimi.objects.filter(ucak=obj, aktif=True)
        return ParcaKullanimiSerializer(parcalar, many=True).data