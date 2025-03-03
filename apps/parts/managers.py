

from django.db import models


class ParcaManager(models.Manager):
    """
    Parça modeli için özel sorgu metodları içeren manager.
    """

    def kullanilabilir_parcalar(self):
        """
        Kullanılabilir durumdaki tüm parçaları döndürür.
        """
        return self.filter(durum__ad='KULLANILABILIR')

    def ucak_tipine_gore_parcalar(self, ucak_tipi_kod):
        """
        Belirli bir uçak tipine ait parçaları döndürür.
        """
        return self.filter(ucak_tipi__kod=ucak_tipi_kod)

    def montaj_icin_uygun_parcalar(self, ucak_tipi_kod):
        """
        Montaj için uygun parçaları döndürür.
        """
        return self.filter(
            durum__ad='KULLANILABILIR',
            ucak_tipi__kod=ucak_tipi_kod
        )