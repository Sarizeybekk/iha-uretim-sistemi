
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.parts.models import ParcaTipi
from apps.aircrafts.models import UcakTipi
from .managers import EnvanterManager

class Envanter(models.Model):
    """
    Envanter seviyelerini takip eden model.
    """
    parca_tipi = models.ForeignKey(ParcaTipi, on_delete=models.CASCADE, verbose_name=_("Parça Tipi"))
    ucak_tipi = models.ForeignKey(UcakTipi, on_delete=models.CASCADE, verbose_name=_("Uçak Tipi"))
    mevcut_adet = models.PositiveIntegerField(default=0, verbose_name=_("Mevcut Adet"))
    minimum_esik = models.PositiveIntegerField(default=1, verbose_name=_("Minimum Eşik"))
    son_guncelleme = models.DateTimeField(auto_now=True, verbose_name=_("Son Güncelleme"))

    objects = EnvanterManager()
    class Meta:
        db_table = 'envanter'
        unique_together = ('parca_tipi', 'ucak_tipi')
        verbose_name = _('Envanter')
        verbose_name_plural = _('Envanter')

    def __str__(self):
        return f"{self.parca_tipi} - {self.ucak_tipi.kod}: {self.mevcut_adet} adet mevcut"

    @property
    def dusuk_stok(self):
        """
        Envanterin minimum eşiğin altında olup olmadığını kontrolü
        """
        if not isinstance(self.mevcut_adet, int):
            self.refresh_from_db()
        return self.mevcut_adet < self.minimum_esik

