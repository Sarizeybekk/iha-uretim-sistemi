from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import Kullanici
from .managers import TakimManager

class Takim(models.Model):
    """
    Üretim takımlarını temsil eden model.
    """
    TAKIM_TIPLERI = (
        ('KANAT', _('Kanat Takımı')),
        ('GOVDE', _('Gövde Takımı')),
        ('KUYRUK', _('Kuyruk Takımı')),
        ('AVIYONIK', _('Aviyonik Takımı')),
        ('MONTAJ', _('Montaj Takımı')),
        ('DIGER', _('Diğer')),
    )

    ad = models.CharField(max_length=100, verbose_name=_("Takım Adı"))
    takim_tipi = models.CharField(max_length=20, choices=TAKIM_TIPLERI, verbose_name=_("Takım Tipi"))
    aciklama = models.TextField(blank=True, verbose_name=_("Açıklama"))
    montaj_yetkisi = models.BooleanField(default=False, verbose_name=_("Montaj Yetkisi"))
    olusturma_tarihi = models.DateTimeField(auto_now_add=True, verbose_name=_("Oluşturma Tarihi"))
    uyeler = models.ManyToManyField(Kullanici, through='KullaniciTakim', related_name='takimlar')

    objects = TakimManager()
    class Meta:
        db_table = 'takimlar'
        verbose_name = _('Takım')
        verbose_name_plural = _('Takımlar')

    def __str__(self):
        return self.ad

    def save(self, *args, **kwargs):
        """
        Montaj takımı tipinde ise montaj yetkisini otomatik olarak True yap.
        """
        if self.takim_tipi == 'MONTAJ':
            self.montaj_yetkisi = True
        super().save(*args, **kwargs)

    @property
    def uretebilecegi_parca_tipi(self):
        """
        Takımın üretebileceği parça tipini döndürür.
        Montaj takımı herhangi bir parça üretemez.
        """
        if self.takim_tipi == 'MONTAJ':
            return None

        # Takım tipi ile uyumlu parça tipini döndür
        from apps.parts.models import ParcaTipi
        try:
            return ParcaTipi.objects.get(ad=self.takim_tipi)
        except ParcaTipi.DoesNotExist:
            return None


class KullaniciTakim(models.Model):
    """
    Kullanıcı ve Takım arasındaki çoka-çok ilişki için ara tablo.
    """
    kullanici = models.ForeignKey(Kullanici, on_delete=models.CASCADE, verbose_name=_("Kullanıcı"))
    takim = models.ForeignKey(Takim, on_delete=models.CASCADE, verbose_name=_("Takım"))
    katilma_tarihi = models.DateTimeField(auto_now_add=True, verbose_name=_("Katılma Tarihi"))

    class Meta:
        db_table = 'kullanici_takimlar'
        unique_together = ('kullanici', 'takim')
        verbose_name = _('Kullanıcı Takım')
        verbose_name_plural = _('Kullanıcı Takımlar')

    def __str__(self):
        return f"{self.kullanici.username} - {self.takim.ad}"

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