
from django.db import models
class EnvanterManager(models.Manager):
    """
    Envanter modeli için özel sorgu metodları içeren manager.
    """

    def dusuk_stok_alarmlari(self):
        """
        Minimum eşiğin altındaki tüm envanter kayıtlarını döndürür.
        """
        return self.filter(mevcut_adet__lt=models.F('minimum_esik'))

    def ucak_tipi_bazinda_ozet(self):
        """
        Uçak tipi bazında stok özetini döndürür.
        """
        return self.values('ucak_tipi__kod').annotate(
            toplam_stok=models.Sum('mevcut_adet')
        )

    def parca_tipi_bazinda_ozet(self):
        """
        Parça tipi bazında stok özetini döndürür.
        """
        return self.values('parca_tipi__ad').annotate(
            toplam_stok=models.Sum('mevcut_adet')
        )

    def montaj_icin_yeterli_parcalar_var_mi(self, ucak_tipi_kod):
        """
        Belirli bir uçak tipinde montaj için yeterli parça olup olmadığını kontrol eder.
        """
        # Tüm parça tiplerini al
        from apps.parts.models import ParcaTipi
        parca_tipleri = ParcaTipi.objects.all()

        # Her parça tipi için stok durumunu kontrol et
        yeterli = True
        eksik_parcalar = []

        for parca_tipi in parca_tipleri:
            try:
                envanter = self.get(parca_tipi=parca_tipi, ucak_tipi__kod=ucak_tipi_kod)
                if envanter.mevcut_adet <= 0:
                    yeterli = False
                    eksik_parcalar.append(parca_tipi.get_ad_display())
            except self.model.DoesNotExist:
                yeterli = False
                eksik_parcalar.append(parca_tipi.get_ad_display())

        return yeterli, eksik_parcalar