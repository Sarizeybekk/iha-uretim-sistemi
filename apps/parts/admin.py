from django.contrib import admin
from .models import ParcaTipi, ParcaDurumu, Parca

@admin.register(ParcaTipi)
class ParcaTipiAdmin(admin.ModelAdmin):
    """Parça Tipi modeli için admin sınıfı."""
    list_display = ('ad', 'sorumlu_takim')
    list_filter = ('sorumlu_takim',)
    search_fields = ('ad',)


@admin.register(ParcaDurumu)
class ParcaDurumuAdmin(admin.ModelAdmin):
    """Parça Durumu modeli için admin sınıfı."""
    list_display = ('ad', 'aciklama')
    search_fields = ('ad',)


@admin.register(Parca)
class ParcaAdmin(admin.ModelAdmin):
    """Parça modeli için admin sınıfı."""
    list_display = ('seri_no', 'parca_tipi', 'ucak_tipi', 'durum', 'uretim_tarihi')
    list_filter = ('parca_tipi', 'ucak_tipi', 'durum', 'uretim_tarihi')
    search_fields = ('seri_no',)
    readonly_fields = ('uretim_tarihi', 'guncelleme_tarihi')
    date_hierarchy = 'uretim_tarihi'
    autocomplete_fields = ['olusturan']