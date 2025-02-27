from django.contrib import admin
from .models import UcakTipi, UcakDurumu, Ucak, ParcaKullanimi

@admin.register(UcakTipi)
class UcakTipiAdmin(admin.ModelAdmin):
    """Uçak Tipi modeli için admin sınıfı."""
    list_display = ('kod', 'ad')
    search_fields = ('kod', 'ad')


@admin.register(UcakDurumu)
class UcakDurumuAdmin(admin.ModelAdmin):
    """Uçak Durumu modeli için admin sınıfı."""
    list_display = ('ad', 'aciklama')
    search_fields = ('ad',)


class ParcaKullanimiInline(admin.TabularInline):
    """Uçak detay sayfasında parça kullanımlarını göstermek için inline admin sınıfı."""
    model = ParcaKullanimi
    extra = 1
    autocomplete_fields = ['parca']


@admin.register(Ucak)
class UcakAdmin(admin.ModelAdmin):
    """Uçak modeli için admin sınıfı."""
    list_display = ('seri_no', 'ucak_tipi', 'montaj_yapan_takim', 'durum', 'montaj_tarihi')
    list_filter = ('ucak_tipi', 'durum', 'montaj_yapan_takim')
    search_fields = ('seri_no',)
    readonly_fields = ('montaj_tarihi', 'guncelleme_tarihi')
    date_hierarchy = 'montaj_tarihi'
    inlines = [ParcaKullanimiInline]


@admin.register(ParcaKullanimi)
class ParcaKullanimiAdmin(admin.ModelAdmin):
    """Parça Kullanımı modeli için admin sınıfı."""
    list_display = ('parca', 'ucak', 'kullanim_tarihi', 'aktif')
    list_filter = ('aktif', 'kullanim_tarihi')
    search_fields = ('parca__seri_no', 'ucak__seri_no')
    autocomplete_fields = ['parca', 'ucak']
    readonly_fields = ('kullanim_tarihi',)
    date_hierarchy = 'kullanim_tarihi'