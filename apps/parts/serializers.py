from rest_framework import serializers
from .models import ParcaTipi, ParcaDurumu, Parca


class ParcaTipiSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParcaTipi
        fields = ['id', 'ad', 'get_ad_display', 'aciklama']


class ParcaDurumuSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParcaDurumu
        fields = ['id', 'ad', 'get_ad_display', 'aciklama']


class ParcaSerializer(serializers.ModelSerializer):
    parca_tipi_adi = serializers.CharField(source='parca_tipi.get_ad_display', read_only=True)
    ucak_tipi_kodu = serializers.CharField(source='ucak_tipi.kod', read_only=True)
    durum_adi = serializers.CharField(source='durum.get_ad_display', read_only=True)
    olusturan_adi = serializers.CharField(source='olusturan.get_full_name', read_only=True)

    class Meta:
        model = Parca
        fields = [
            'id', 'seri_no', 'parca_tipi', 'parca_tipi_adi', 'ucak_tipi', 'ucak_tipi_kodu',
            'durum', 'durum_adi', 'olusturan', 'olusturan_adi', 'uretim_tarihi',
            'guncelleme_tarihi', 'notlar'
        ]
        read_only_fields = ['uretim_tarihi', 'guncelleme_tarihi', 'olusturan']

    def validate(self, data):
        """
        Uygunluk kontrolü.
        """
        request = self.context.get('request')
        if request and not data.get('olusturan'):
            data['olusturan'] = request.user
        return data


class ParcaOlusturSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parca
        fields = ['seri_no', 'parca_tipi', 'ucak_tipi', 'notlar']


class GeriDonusumSerializer(serializers.Serializer):
    parca_id = serializers.IntegerField()
    neden = serializers.CharField(required=False, allow_blank=True)