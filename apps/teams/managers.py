from django.db import models

class TakimManager(models.Manager):
    """
    Takım modeli için özel sorgu metodları içeren manager.
    """

    def montaj_yetkili_takimlar(self):
        """
        Montaj yetkisi olan takımları döndürür.
        """
        return self.filter(montaj_yetkisi=True)

    def tip_bazinda_takimlar(self, takim_tipi=None):
        """
        Belirli bir tipteki takımları döndürür.
        """
        if takim_tipi:
            return self.filter(takim_tipi=takim_tipi)
        return self

    def personel_sayisi_ile(self):
        """
        Her takımdaki personel sayısı ile takımları döndürür.
        """
        return self.annotate(
            personel_sayisi=models.Count('kullanicitakim')
        )