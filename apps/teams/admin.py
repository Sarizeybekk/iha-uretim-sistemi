from django.contrib import admin
from .models import Takim, KullaniciTakim

class KullaniciTakimInline(admin.TabularInline):
    """Takım detay sayfasında üyeleri göstermek için inline admin sınıfı."""
    model = KullaniciTakim
    extra = 1
    autocomplete_fields = ['kullanici']


@admin.register(Takim)
class TakimAdmin(admin.ModelAdmin):
    """Takım modeli için admin sınıfı."""
    list_display = ('ad', 'montaj_yetkisi', 'olusturma_tarihi')
    list_filter = ('montaj_yetkisi', 'olusturma_tarihi')
    search_fields = ('ad',)
    readonly_fields = ('olusturma_tarihi',)
    inlines = [KullaniciTakimInline]


@admin.register(KullaniciTakim)
class KullaniciTakimAdmin(admin.ModelAdmin):
    """Kullanıcı Takım modeli için admin sınıfı."""
    list_display = ('kullanici', 'takim', 'katilma_tarihi')
    list_filter = ('takim', 'katilma_tarihi')
    search_fields = ('kullanici__username', 'takim__ad')
    readonly_fields = ('katilma_tarihi',)
    autocomplete_fields = ['kullanici', 'takim']