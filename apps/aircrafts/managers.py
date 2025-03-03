from django.db import models
class UcakManager(models.Manager):
    def tip_bazinda_ucak_sayisi(self):
        """
        Uçak tipi bazında üretilen uçak sayısını döndürür.
        """
        return self.values('ucak_tipi__kod').annotate(
            ucak_sayisi=models.Count('id')
        )

    def son_uretilen_ucaklar(self, limit=10):
        """
        Son üretilen uçakları döndürür.
        """
        return self.order_by('-montaj_tarihi')[:limit]

    def takim_bazinda_ucak_uretimi(self):
        """
        Takım bazında üretilen uçak sayısını döndürür.
        """
        return self.values('montaj_yapan_takim__ad').annotate(
            ucak_sayisi=models.Count('id')
        )