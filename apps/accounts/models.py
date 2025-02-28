from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class Kullanici(AbstractUser):
    """
    Personel bilgilerini tutan geliştirilmiş kullanıcı modeli.
    """
    # Çakışmaları önlemek için related_name özellikleri eklendi
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name=_('groups'),
        blank=True,
        help_text=_('The groups this user belongs to.'),
        related_name='kullanici_set',  # Değiştirildi
        related_query_name='kullanici',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name='kullanici_set',  # Değiştirildi
        related_query_name='kullanici',
    )

    class Meta:
        db_table = 'kullanicilar'
        verbose_name = _('Kullanıcı')
        verbose_name_plural = _('Kullanıcılar')

    def __str__(self):
        return f"{self.username} ({self.get_full_name()})"