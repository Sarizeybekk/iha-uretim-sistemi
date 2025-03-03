from django.utils.translation import gettext as _
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Parca, ParcaTipi, ParcaDurumu
from apps.inventory.models import Envanter
from apps.teams.models import Takim, KullaniciTakim


class ParcaService:
    """
    Parça işlemleri için servis sınıfı.
    """

    @staticmethod
    def parca_olustur(data, kullanici):
        """
        Yeni bir parça oluşturur ve envanter seviyesini günceller.
        """
        parca_tipi_id = data['parca_tipi'].id if hasattr(data['parca_tipi'], 'id') else data['parca_tipi']
        parca_tipi = ParcaTipi.objects.get(id=parca_tipi_id)

        # Kullanıcının uygun takımda olup olmadığını kontrol et
        kullanici_takimlari = KullaniciTakim.objects.filter(
            kullanici=kullanici
        ).select_related('takim')
        uygun_takim = False
        for kt in kullanici_takimlari:
            if kt.takim.takim_tipi == parca_tipi.ad or kt.takim.montaj_yetkisi:
                uygun_takim = True
                break

        if not uygun_takim:
            raise ValidationError(
                _("{} kullanıcısı {} tipi parça üretemez.").format(
                    kullanici.username, parca_tipi
                )
            )
        kullanilabilir_durumu = ParcaDurumu.objects.get(ad='KULLANILABILIR')

        with transaction.atomic():
            ucak_tipi_id = data['ucak_tipi'].id if hasattr(data['ucak_tipi'], 'id') else data['ucak_tipi']

            yeni_parca = Parca.objects.create(
                seri_no=data['seri_no'],
                parca_tipi_id=parca_tipi_id,
                ucak_tipi_id=ucak_tipi_id,
                olusturan=kullanici,
                durum=kullanilabilir_durumu,
                notlar=data.get('notlar', '')
            )


            return yeni_parca

    @staticmethod
    def geri_donusume_gonder(parca_id, kullanici):
        """
        Bir parçayı geri dönüşüme gönderir.
        """
        try:
            parca = Parca.objects.get(id=parca_id)
            kullanici_takimlari = KullaniciTakim.objects.filter(
                kullanici=kullanici
            ).values_list('takim__takim_tipi', flat=True)

            if parca.parca_tipi.ad not in kullanici_takimlari and 'MONTAJ' not in kullanici_takimlari:
                raise ValidationError(
                    _("{} kullanıcısı {} tipi parçayı geri dönüşüme gönderemez.").format(
                        kullanici.username, parca.parca_tipi
                    )
                )
            sonuc = parca.geri_donusume_gonder()

            if not sonuc:
                raise ValidationError(_("Parça geri dönüşüme gönderilemedi."))

            return True

        except Parca.DoesNotExist:
            raise ValidationError(_("Belirtilen parça bulunamadı."))