from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import Kullanici
from apps.teams.models import Takim


class ParcaTipi(models.Model):
    """
    Farklı parça tiplerini temsil eden model.
    """
    TIP_SECENEKLERI = (
        ('KANAT', _('Kanat')),
        ('GOVDE', _('Gövde')),
        ('KUYRUK', _('Kuyruk')),
        ('AVIYONIK', _('Aviyonik')),
    )

    ad = models.CharField(max_length=50, choices=TIP_SECENEKLERI, verbose_name=_("Parça Adı"))
    aciklama = models.TextField(blank=True, verbose_name=_("Açıklama"))
    sorumlu_takim = models.ForeignKey(
        Takim,
        on_delete=models.PROTECT,
        related_name='sorumlu_parcalar',
        verbose_name=_("Sorumlu Takım")
    )

    class Meta:
        db_table = 'parca_tipleri'
        verbose_name = _('Parça Tipi')
        verbose_name_plural = _('Parça Tipleri')

    def __str__(self):
        return self.get_ad_display()


class ParcaDurumu(models.Model):
    """
    Parça durumlarını temsil eden model.
    """
    DURUM_SECENEKLERI = (
        ('KULLANILABILIR', _('Kullanılabilir')),
        ('KULLANILIYOR', _('Kullanılıyor')),
        ('KUSURLU', _('Kusurlu')),
        ('GERI_DONUSUM', _('Geri Dönüşüm')),
    )

    ad = models.CharField(max_length=50, choices=DURUM_SECENEKLERI, unique=True, verbose_name=_("Durum Adı"))
    aciklama = models.TextField(blank=True, verbose_name=_("Açıklama"))

    class Meta:
        db_table = 'parca_durumlari'
        verbose_name = _('Parça Durumu')
        verbose_name_plural = _('Parça Durumları')

    def __str__(self):
        return self.get_ad_display()


class Parca(models.Model):
    """
    Üretilen parçaları temsil eden model.
    """
    seri_no = models.CharField(max_length=100, unique=True, verbose_name=_("Seri No"))
    parca_tipi = models.ForeignKey(ParcaTipi, on_delete=models.PROTECT, verbose_name=_("Parça Tipi"))
    ucak_tipi = models.ForeignKey(
        'aircrafts.UcakTipi',
        on_delete=models.PROTECT,
        verbose_name=_("Uçak Tipi")
    )
    olusturan = models.ForeignKey(Kullanici, on_delete=models.PROTECT, verbose_name=_("Oluşturan"))
    durum = models.ForeignKey(ParcaDurumu, on_delete=models.PROTECT, verbose_name=_("Durum"))
    uretim_tarihi = models.DateTimeField(auto_now_add=True, verbose_name=_("Üretim Tarihi"))
    guncelleme_tarihi = models.DateTimeField(auto_now=True, verbose_name=_("Güncelleme Tarihi"))
    notlar = models.TextField(blank=True, verbose_name=_("Notlar"))

    class Meta:
        db_table = 'parcalar'
        verbose_name = _('Parça')
        verbose_name_plural = _('Parçalar')
        indexes = [
            models.Index(fields=['parca_tipi', 'ucak_tipi', 'durum']),
        ]

    def __str__(self):
        return f"{self.seri_no} - {self.parca_tipi} ({self.ucak_tipi.kod})"

    def clean(self):
        """
        Parçaların yalnızca sorumlu takım tarafından üretilebilmesini doğrular.
        """

        kullanici_takimlari = Takim.objects.filter(kullanicitakim__kullanici=self.olusturan)


        if not kullanici_takimlari.filter(sorumlu_parcalar=self.parca_tipi).exists():
            raise ValidationError(
                _("{} kullanıcısı {} tipi parça üretemez.").format(
                    self.olusturan.username, self.parca_tipi
                )
            )

        super().clean()