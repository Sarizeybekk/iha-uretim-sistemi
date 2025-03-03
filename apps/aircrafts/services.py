from django.utils.translation import gettext as _
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Ucak, UcakTipi, UcakDurumu, ParcaKullanimi
from apps.parts.models import Parca, ParcaDurumu, ParcaTipi
from apps.teams.models import Takim, KullaniciTakim
from apps.inventory.models import Envanter


class UcakMontajService:
    """
    Uçak montaj işlemleri için servis sınıfı.
    """

    @staticmethod
    def montaj_yapabilir_mi(kullanici):
        """
        Kullanıcının montaj yetkisi olup olmadığını kontrol eder.
        """
        return KullaniciTakim.objects.filter(
            kullanici=kullanici,
            takim__montaj_yetkisi=True
        ).exists()

    @staticmethod
    def montaj_icin_parcalari_kontrol_et(ucak_tipi_id, parcalar):
        """
        Montaj için seçilen parçaların uygunluğunu kontrol eder.
        """
        try:
            ucak_tipi = UcakTipi.objects.get(id=ucak_tipi_id)


            parca_tipleri = ParcaTipi.objects.all()
            gerekli_tipler = {pt.ad: False for pt in parca_tipleri}

            for parca_id in parcalar:
                try:
                    parca = Parca.objects.get(id=parca_id)

                    if parca.durum.ad != 'KULLANILABILIR':
                        return False, _("{} parçası kullanılabilir durumda değil.").format(parca.seri_no)

                    # Parça doğru uçak tipine mi ait
                    if parca.ucak_tipi_id != ucak_tipi_id:
                        return False, _("{} parçası {} uçak tipi ile uyumlu değil.").format(
                            parca.seri_no, ucak_tipi.kod
                        )

                    # Bu tipteki bir parça zaten seçilmiş mi
                    if gerekli_tipler[parca.parca_tipi.ad]:
                        return False, _("{} tipinde birden fazla parça seçilmiş.").format(
                            parca.parca_tipi
                        )

                    gerekli_tipler[parca.parca_tipi.ad] = True

                except Parca.DoesNotExist:
                    return False, _("Belirtilen parça bulunamadı.")

            # Tüm gerekli tiplerin seçildiğini kontrol et
            if not all(gerekli_tipler.values()):
                eksik_tipler = [tip for tip, secildi in gerekli_tipler.items() if not secildi]
                return False, _("Eksik parça tipleri: {}").format(", ".join(eksik_tipler))

            return True, _("Tüm parçalar uyumlu.")

        except UcakTipi.DoesNotExist:
            return False, _("Belirtilen uçak tipi bulunamadı.")

    @staticmethod
    def ucak_montaj(data, kullanici):
        """
        Yeni bir uçak montajı yapar.
        """
        # Kullanıcının montaj yetkisi var mı kontrol et
        if not UcakMontajService.montaj_yapabilir_mi(kullanici):
            raise ValidationError(_("Kullanıcının montaj yetkisi yok."))

        # Parçaların uygunluğunu kontrol et
        uygun, mesaj = UcakMontajService.montaj_icin_parcalari_kontrol_et(
            data['ucak_tipi'],
            data['parcalar']
        )

        if not uygun:
            raise ValidationError(mesaj)

        # Montaj takımını bul
        montaj_takimi = Takim.objects.filter(
            kullanicitakim__kullanici=kullanici,
            montaj_yetkisi=True
        ).first()

        if not montaj_takimi:
            raise ValidationError(_("Kullanıcı bir montaj takımında değil."))

        # Tamamlandı durumunu al
        try:
            tamamlandi_durumu = UcakDurumu.objects.get(ad='TAMAMLANDI')
        except UcakDurumu.DoesNotExist:
            raise ValidationError(_("'TAMAMLANDI' durumu tanımlanmamış."))

        with transaction.atomic():
            # Uçağı oluştur
            ucak = Ucak.objects.create(
                seri_no=data['seri_no'],
                ucak_tipi_id=data['ucak_tipi'],
                montaj_yapan_takim=montaj_takimi,
                durum=tamamlandi_durumu,
                notlar=data.get('notlar', '')
            )

            # Parçaları uçağa bağla
            for parca_id in data['parcalar']:
                parca = Parca.objects.get(id=parca_id)
                ParcaKullanimi.objects.create(
                    parca=parca,
                    ucak=ucak
                )

            return ucak

