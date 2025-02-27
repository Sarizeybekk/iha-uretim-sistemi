from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from apps.parts.models import Parca
from apps.teams.models import Takim


class UcakTipi(models.Model):
    """
    Farklı uçak tiplerini/modellerini temsil eden model.
    """
    MODEL_SECENEKLERI = (
        ('TB2', 'TB2'),
        ('TB3', 'TB3'),
        ('AKINCI', 'AKINCI'),
        ('KIZILELMA', 'KIZILELMA'),
    )

    kod = models.CharField(max_length=20, choices=MODEL_SECENEKLERI, unique=True, verbose_name=_("Model Kodu"))
    ad = models.CharField(max_length=100, verbose_name=_("Adı"))
    aciklama = models.TextField(blank=True, verbose_name=_("Açıklama"))

    class Meta:
        db_table = 'ucak_tipleri'
        verbose_name = _('Uçak Tipi')
        verbose_name_plural = _('Uçak Tipleri')

    def __str__(self):
        return self.ad


class UcakDurumu(models.Model):
    """
    Uçak durumlarını temsil eden model.
    """
    DURUM_SECENEKLERI = (
        ('MONTAJ', _('Montajda')),
        ('TAMAMLANDI', _('Tamamlandı')),
        ('TESLIM_EDILDI', _('Teslim Edildi')),
    )

    ad = models.CharField(max_length=50, choices=DURUM_SECENEKLERI, unique=True, verbose_name=_("Durum Adı"))
    aciklama = models.TextField(blank=True, verbose_name=_("Açıklama"))

    class Meta:
        db_table = 'ucak_durumlari'
        verbose_name = _('Uçak Durumu')
        verbose_name_plural = _('Uçak Durumları')

    def __str__(self):
        return self.get_ad_display()


class Ucak(models.Model):
    """
    Monte edilmiş uçakları temsil eden model.
    """
    seri_no = models.CharField(max_length=100, unique=True, verbose_name=_("Seri No"))
    ucak_tipi = models.ForeignKey(UcakTipi, on_delete=models.PROTECT, verbose_name=_("Uçak Tipi"))
    montaj_yapan_takim = models.ForeignKey(Takim, on_delete=models.PROTECT, verbose_name=_("Montaj Yapan Takım"))
    durum = models.ForeignKey(UcakDurumu, on_delete=models.PROTECT, verbose_name=_("Durum"))
    montaj_tarihi = models.DateTimeField(auto_now_add=True, verbose_name=_("Montaj Tarihi"))
    guncelleme_tarihi = models.DateTimeField(auto_now=True, verbose_name=_("Güncelleme Tarihi"))
    notlar = models.TextField(blank=True, verbose_name=_("Notlar"))
    parcalar = models.ManyToManyField(Parca, through='ParcaKullanimi', related_name='kullanildigi_ucaklar')

    class Meta:
        db_table = 'ucaklar'
        verbose_name = _('Uçak')
        verbose_name_plural = _('Uçaklar')

    def __str__(self):
        return f"{self.seri_no} - {self.ucak_tipi.kod}"

    def clean(self):
        """
        Yalnızca montaj takımlarının uçak oluşturabilmesini doğrular.
        """
        if not self.montaj_yapan_takim.montaj_yetkisi:
            raise ValidationError(_("Sadece montaj yetkisi olan takımlar uçak oluşturabilir."))

        super().clean()


class ParcaKullanimi(models.Model):
    """
    Hangi parçaların hangi uçaklarda kullanıldığını takip eden ara tablo.
    """
    parca = models.ForeignKey(Parca, on_delete=models.PROTECT, verbose_name=_("Parça"))
    ucak = models.ForeignKey(Ucak, on_delete=models.PROTECT, verbose_name=_("Uçak"))
    kullanim_tarihi = models.DateTimeField(auto_now_add=True, verbose_name=_("Kullanım Tarihi"))
    aktif = models.BooleanField(default=True, verbose_name=_("Aktif"))

    class Meta:
        db_table = 'parca_kullanimlari'
        unique_together = ('parca', 'aktif')  # Bir parça yalnızca bir aktif uçakta kullanılabilir
        verbose_name = _('Parça Kullanımı')
        verbose_name_plural = _('Parça Kullanımları')

    def __str__(self):
        return f"{self.parca.seri_no} parçası {self.ucak.seri_no} uçağında kullanılıyor"

    def clean(self):
        """
        Parça uyumluluğunu doğrular.
        """
        # Parçanın kullanılabilir olup olmadığını kontrol et
        if self.parca.durum.ad != 'KULLANILABILIR':
            raise ValidationError(_("{} parçası kullanılabilir durumda değil.").format(self.parca.seri_no))

        # Parçanın uçak ile uyumlu olup olmadığını kontrol et
        if self.parca.ucak_tipi != self.ucak.ucak_tipi:
            raise ValidationError(
                _("{} parçası {} ile uyumlu değil.").format(self.parca.seri_no, self.ucak.ucak_tipi.kod)
            )

        super().clean()

    def save(self, *args, **kwargs):
        """
        Parça kullanıldığında durumunu günceller.
        """
        from apps.parts.models import ParcaDurumu

        # "Kullanılıyor" durumunu al
        kullaniliyor_durumu = ParcaDurumu.objects.get(ad='KULLANILIYOR')

        # Parça durumunu "Kullanılıyor" olarak güncelle
        self.parca.durum = kullaniliyor_durumu
        self.parca.save()

        super().save(*args, **kwargs)