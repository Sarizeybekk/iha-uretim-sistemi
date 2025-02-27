from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import Kullanici


class Takim(models.Model):
    """
    Üretim takımlarını temsil eden model.
    """
    ad = models.CharField(max_length=100, verbose_name=_("Takım Adı"))
    aciklama = models.TextField(blank=True, verbose_name=_("Açıklama"))
    montaj_yetkisi = models.BooleanField(default=False, verbose_name=_("Montaj Yetkisi"))
    olusturma_tarihi = models.DateTimeField(auto_now_add=True, verbose_name=_("Oluşturma Tarihi"))
    uyeler = models.ManyToManyField(Kullanici, through='KullaniciTakim', related_name='takimlar')

    class Meta:
        db_table = 'takimlar'
        verbose_name = _('Takım')
        verbose_name_plural = _('Takımlar')

    def __str__(self):
        return self.ad


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