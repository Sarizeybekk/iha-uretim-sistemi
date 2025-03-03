from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Envanter


@admin.register(Envanter)
class EnvanterAdmin(admin.ModelAdmin):
    list_display = ('parca_tipi', 'ucak_tipi', 'mevcut_adet', 'minimum_esik', 'stok_durumu', 'son_guncelleme')
    list_filter = ('parca_tipi', 'ucak_tipi', 'son_guncelleme')
    search_fields = ('parca_tipi__ad', 'ucak_tipi__kod')
    date_hierarchy = 'son_guncelleme'
    readonly_fields = ('son_guncelleme',)
    fieldsets = (
        (None, {
            'fields': ('parca_tipi', 'ucak_tipi', 'mevcut_adet', 'minimum_esik')
        }),
        (_('Tarihler'), {
            'fields': ('son_guncelleme',)
        }),
    )

    def stok_durumu(self, obj):
        """
        Stok durumunu renkli gösterir.
        """
        if obj.dusuk_stok:
            return format_html('<span style="color: red; font-weight: bold;">⚠️ Düşük Stok</span>')
        return format_html('<span style="color: green;">✅ Yeterli</span>')

    stok_durumu.short_description = _("Stok Durumu")

    actions = ['yuzde_on_artir', 'yuzde_on_azalt']

    def yuzde_on_artir(self, request, queryset):
        """
        Seçili envanter kayıtlarının stok adedini %10 artırır.
        """
        for envanter in queryset:
            envanter.mevcut_adet = int(envanter.mevcut_adet * 1.1)
            envanter.save()

        self.message_user(request, _(f"{queryset.count()} envanter kaydı %10 artırıldı."))

    yuzde_on_artir.short_description = _("Stok adedini %10 artır")

    def yuzde_on_azalt(self, request, queryset):
        """
        Seçili envanter kayıtlarının stok adedini %10 azaltır.
        """
        for envanter in queryset:
            envanter.mevcut_adet = max(0, int(envanter.mevcut_adet * 0.9))
            envanter.save()

        self.message_user(request, _(f"{queryset.count()} envanter kaydı %10 azaltıldı."))

    yuzde_on_azalt.short_description = _("Stok adedini %10 azalt")