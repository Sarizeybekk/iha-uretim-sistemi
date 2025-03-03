from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Takim, KullaniciTakim


class KullaniciTakimInline(admin.TabularInline):
    model = KullaniciTakim
    extra = 1
    autocomplete_fields = ('kullanici',)


@admin.register(Takim)
class TakimAdmin(admin.ModelAdmin):
    list_display = ('ad', 'takim_tipi', 'montaj_yetkisi', 'personel_sayisi', 'olusturma_tarihi')
    list_filter = ('takim_tipi', 'montaj_yetkisi')
    search_fields = ('ad', 'aciklama')
    date_hierarchy = 'olusturma_tarihi'
    readonly_fields = ('olusturma_tarihi',)
    fieldsets = (
        (None, {
            'fields': ('ad', 'takim_tipi', 'aciklama', 'montaj_yetkisi')
        }),
        (_('Tarihler'), {
            'fields': ('olusturma_tarihi',)
        }),
    )
    inlines = [KullaniciTakimInline]

    def personel_sayisi(self, obj):
        return obj.uyeler.count()

    personel_sayisi.short_description = _("Personel Sayısı")


@admin.register(KullaniciTakim)
class KullaniciTakimAdmin(admin.ModelAdmin):
    list_display = ('kullanici', 'takim', 'katilma_tarihi')
    list_filter = ('takim', 'katilma_tarihi')
    search_fields = ('kullanici__username', 'kullanici__first_name', 'kullanici__last_name', 'takim__ad')
    date_hierarchy = 'katilma_tarihi'
    readonly_fields = ('katilma_tarihi',)
    autocomplete_fields = ('kullanici', 'takim')
