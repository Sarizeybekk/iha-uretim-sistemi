from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import UcakTipi, UcakDurumu, Ucak, ParcaKullanimi


@admin.register(UcakTipi)
class UcakTipiAdmin(admin.ModelAdmin):
    list_display = ('ad', 'kod', 'aciklama')
    search_fields = ('ad', 'kod', 'aciklama')


@admin.register(UcakDurumu)
class UcakDurumuAdmin(admin.ModelAdmin):
    list_display = ('ad', 'get_ad_display', 'aciklama')
    search_fields = ('ad', 'aciklama')


class ParcaKullanimiInline(admin.TabularInline):
    model = ParcaKullanimi
    extra = 0
    readonly_fields = ('kullanim_tarihi',)
    autocomplete_fields = ('parca',)


@admin.register(Ucak)
class UcakAdmin(admin.ModelAdmin):
    list_display = ('seri_no', 'ucak_tipi', 'durum', 'montaj_yapan_takim', 'montaj_tarihi')
    list_filter = ('ucak_tipi', 'durum', 'montaj_yapan_takim', 'montaj_tarihi')
    search_fields = ('seri_no', 'notlar')
    date_hierarchy = 'montaj_tarihi'
    readonly_fields = ('montaj_tarihi', 'guncelleme_tarihi')
    fieldsets = (
        (None, {
            'fields': ('seri_no', 'ucak_tipi', 'durum', 'montaj_yapan_takim')
        }),
        (_('Tarihler'), {
            'fields': ('montaj_tarihi', 'guncelleme_tarihi')
        }),
        (_('Diğer Bilgiler'), {
            'fields': ('notlar',)
        }),
    )
    inlines = [ParcaKullanimiInline]


@admin.register(ParcaKullanimi)
class ParcaKullanimiAdmin(admin.ModelAdmin):
    list_display = ('parca', 'ucak', 'kullanim_tarihi', 'aktif')
    list_filter = ('aktif', 'kullanim_tarihi')
    search_fields = ('parca__seri_no', 'ucak__seri_no')
    date_hierarchy = 'kullanim_tarihi'
    readonly_fields = ('kullanim_tarihi',)
    autocomplete_fields = ('parca', 'ucak')
