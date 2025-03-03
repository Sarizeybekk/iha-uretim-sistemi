from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.db import transaction


from .models import Parca, ParcaDurumu
from apps.inventory.models import Envanter


@receiver(post_save, sender=Parca)
def update_inventory_on_part_creation(sender, instance, created, **kwargs):
    """
    Parça oluşturulduğunda veya durumu değiştiğinde envanter seviyesini günceller.
    """
    # Eğer yeni bir parça oluşturulduysa ve kullanılabilir durumdaysa
    if created and instance.durum.ad == 'KULLANILABILIR':
        with transaction.atomic():
            # Envanter kaydını bul veya oluştur
            envanter, _ = Envanter.objects.get_or_create(
                parca_tipi=instance.parca_tipi,
                ucak_tipi=instance.ucak_tipi,
                defaults={'mevcut_adet': 0}
            )

            # Envanter miktarını artır
            envanter.mevcut_adet += 1
            envanter.save()


@receiver(pre_save, sender=Parca)
def handle_part_status_change(sender, instance, **kwargs):
    """
    Parça durumu değiştiğinde envanter seviyesini günceller.
    """

    if instance.pk:
        try:
            eski_parca = Parca.objects.get(pk=instance.pk)

            if eski_parca.durum != instance.durum:
                with transaction.atomic():

                    try:
                        envanter = Envanter.objects.get(
                            parca_tipi=instance.parca_tipi,
                            ucak_tipi=instance.ucak_tipi
                        )

                        # Eğer eski durum 'KULLANILABILIR' ise ve yeni durum değilse, stoktan düş
                        if eski_parca.durum.ad == 'KULLANILABILIR' and instance.durum.ad != 'KULLANILABILIR':
                            if envanter.mevcut_adet > 0:
                                envanter.mevcut_adet -= 1
                                envanter.save()
                        elif eski_parca.durum.ad != 'KULLANILABILIR' and instance.durum.ad == 'KULLANILABILIR':
                            envanter.mevcut_adet += 1
                            envanter.save()

                    except Envanter.DoesNotExist:
                        if instance.durum.ad == 'KULLANILABILIR':
                            Envanter.objects.create(
                                parca_tipi=instance.parca_tipi,
                                ucak_tipi=instance.ucak_tipi,
                                mevcut_adet=1
                            )

        except Parca.DoesNotExist:
            pass


@receiver(post_delete, sender=Parca)
def update_inventory_on_part_deletion(sender, instance, **kwargs):
    """
    Parça silindiğinde envanter seviyesini günceller.
    """
    if instance.durum.ad == 'KULLANILABILIR':
        try:
            with transaction.atomic():
                envanter = Envanter.objects.get(
                    parca_tipi=instance.parca_tipi,
                    ucak_tipi=instance.ucak_tipi
                )

                if envanter.mevcut_adet > 0:
                    envanter.mevcut_adet -= 1
                    envanter.save()

        except Envanter.DoesNotExist:
            pass