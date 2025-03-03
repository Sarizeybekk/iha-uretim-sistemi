
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils.translation import gettext as _
from apps.aircrafts.models import ParcaKullanimi
from .models import Envanter
from django.core.exceptions import ValidationError
from .services import EnvanterService

@receiver(post_save, sender=Envanter)
def check_low_inventory(sender, instance, **kwargs):
    """
    Envanter seviyesi güncellendiğinde düşük stok kontrolü yapar.
    """
    if instance.dusuk_stok:
        # Düşük stok uyarısı oluştur
        warning_message = _(
            "Düşük stok uyarısı: {parca_tipi} parçası için {ucak_tipi} modelinde "
            "mevcut adet {mevcut} (minimum: {minimum})"
        ).format(
            parca_tipi=instance.parca_tipi,
            ucak_tipi=instance.ucak_tipi.kod,
            mevcut=instance.mevcut_adet,
            minimum=instance.minimum_esik
        )

        print(warning_message)

@receiver(post_save, sender=ParcaKullanimi)
def stok_azalt_montaj_sonrasi(sender, instance, created, **kwargs):
    """
    Parça kullanıldığında stoktan düşme işlemini yapar.
    """
    if created:
        try:
            EnvanterService.stok_azalt(
                parca_tipi_id=instance.parca.parca_tipi.id,
                ucak_tipi_id=instance.ucak.ucak_tipi.id
            )
        except ValueError as e:
            raise ValidationError(str(e))

