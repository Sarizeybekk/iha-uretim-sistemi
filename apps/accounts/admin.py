from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import Kullanici

@admin.register(Kullanici)
class KullaniciAdmin(UserAdmin):
    """Kullanici modeli için admin sınıfı."""
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Kişisel Bilgiler'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('İzinler'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Önemli Tarihler'), {'fields': ('last_login', 'date_joined')}),
    )