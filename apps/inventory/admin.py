from django.contrib import admin
from .models import Envanter

@admin.register(Envanter)
class EnvanterAdmin(admin.ModelAdmin):
    """Envanter modeli için admin sınıfı."""
    list_display = ('parca_tipi', 'ucak_tipi', 'mevcut_adet', 'minimum_esik', 'dusuk_stok', 'son_guncelleme')
    list_filter = ('parca_tipi', 'ucak_tipi', 'son_guncelleme')
    search_fields = ('parca_tipi__ad', 'ucak_tipi__kod')
    readonly_fields = ('son_guncelleme',)
    list_editable = ('mevcut_adet', 'minimum_esik')

    def dusuk_stok(self, obj):
        """Düşük stok durumunu görselleştirmek için metod."""
        return obj.dusuk_stok
    dusuk_stok.boolean = True
    dusuk_stok.short_description = "Düşük Stok"