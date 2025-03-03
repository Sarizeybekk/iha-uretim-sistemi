from rest_framework import serializers
from .models import UcakTipi, UcakDurumu, Ucak, ParcaKullanimi
from apps.parts.serializers import ParcaSerializer,Parca


class UcakTipiSerializer(serializers.ModelSerializer):
    class Meta:
        model = UcakTipi
        fields = ['id', 'kod', 'ad', 'aciklama']


class UcakDurumuSerializer(serializers.ModelSerializer):
    class Meta:
        model = UcakDurumu
        fields = ['id', 'ad', 'get_ad_display', 'aciklama']


class ParcaKullanimiSerializer(serializers.ModelSerializer):
    parca_detay = ParcaSerializer(source='parca', read_only=True)

    class Meta:
        model = ParcaKullanimi
        fields = ['id', 'parca', 'parca_detay', 'kullanim_tarihi', 'aktif']
        read_only_fields = ['kullanim_tarihi']


class UcakSerializer(serializers.ModelSerializer):
    ucak_tipi_adi = serializers.CharField(source='ucak_tipi.ad', read_only=True)
    ucak_tipi_kodu = serializers.CharField(source='ucak_tipi.kod', read_only=True)
    durum_adi = serializers.CharField(source='durum.get_ad_display', read_only=True)
    montaj_yapan_takim_adi = serializers.CharField(source='montaj_yapan_takim.ad', read_only=True)
    parcalar = ParcaKullanimiSerializer(source='parcakullanimi_set', many=True, read_only=True)

    class Meta:
        model = Ucak
        fields = [
            'id', 'seri_no', 'ucak_tipi', 'ucak_tipi_adi', 'ucak_tipi_kodu',
            'durum', 'durum_adi', 'montaj_yapan_takim', 'montaj_yapan_takim_adi',
            'montaj_tarihi', 'guncelleme_tarihi', 'notlar', 'parcalar'
        ]
        read_only_fields = ['montaj_tarihi', 'guncelleme_tarihi']


class UcakMontajSerializer(serializers.Serializer):
    ucak_tipi = serializers.IntegerField()
    seri_no = serializers.CharField(max_length=50)

    # Parçaları ID olarak alacağız
    kanat_parca_id = serializers.IntegerField()
    govde_parca_id = serializers.IntegerField()
    kuyruk_parca_id = serializers.IntegerField()
    aviyonik_parca_id = serializers.IntegerField()
    notlar = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        """
        Parça uygunluk ve eksiklik kontrolü.
        """
        eksik_parcalar = []
        if not data.get('kanat_parca_id'):
            eksik_parcalar.append('Kanat')
        if not data.get('govde_parca_id'):
            eksik_parcalar.append('Gövde')
        if not data.get('kuyruk_parca_id'):
            eksik_parcalar.append('Kuyruk')
        if not data.get('aviyonik_parca_id'):
            eksik_parcalar.append('Aviyonik')

        if eksik_parcalar:
            raise serializers.ValidationError(f"Montaj için eksik parçalar: {', '.join(eksik_parcalar)}")

        parca_turleri = {
            'KANAT': data['kanat_parca_id'],
            'GOVDE': data['govde_parca_id'],
            'KUYRUK': data['kuyruk_parca_id'],
            'AVIYONIK': data['aviyonik_parca_id'],
        }

        for parca_turu, parca_id in parca_turleri.items():
            try:
                parca = Parca.objects.get(id=parca_id)
                if parca.parca_tipi.ad != parca_turu or parca.durum.ad != 'KULLANILABILIR':
                    raise serializers.ValidationError(
                        f"{parca_turu} parçası uygun değil veya kullanılamaz durumda."
                    )

            except Parca.DoesNotExist:
                raise serializers.ValidationError(f"{parca_turu} parçası bulunamadı.")

        return data
