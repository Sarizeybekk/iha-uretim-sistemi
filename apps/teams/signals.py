from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from django.utils.translation import gettext as _
from .models import Takim, KullaniciTakim
from apps.accounts.models import Kullanici


@receiver(post_save, sender=KullaniciTakim)
def handle_team_membership(sender, instance, created, **kwargs):
    """
    Kullanıcı bir takıma eklendiğinde gerçekleştirilecek işlemler.
    """
    if created:
        print(f"{instance.kullanici.username} kullanıcısı {instance.takim.ad} takımına eklendi.")



@receiver(post_delete, sender=KullaniciTakim)
def handle_team_member_removal(sender, instance, **kwargs):
    """
    Kullanıcı bir takımdan çıkarıldığında gerçekleştirilecek işlemler.
    """
    print(f"{instance.kullanici.username} kullanıcısı {instance.takim.ad} takımından çıkarıldı.")



@receiver(post_save, sender=Takim)
def handle_team_creation(sender, instance, created, **kwargs):

    if created:
        print(f"Yeni takım oluşturuldu: {instance.ad}")

        if instance.montaj_yetkisi:
            pass