from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import ParcaTipi, ParcaDurumu, Parca


@admin.register(ParcaTipi)
class ParcaTipiAdmin(admin.ModelAdmin):
    list_display = ('ad', 'get_ad_display', 'aciklama')
    search_fields = ('ad', 'aciklama')


@admin.register(ParcaDurumu)
class ParcaDurumuAdmin(admin.ModelAdmin):
    list_display = ('ad', 'get_ad_display', 'aciklama')
    search_fields = ('ad', 'aciklama')


@admin.register(Parca)
class ParcaAdmin(admin.ModelAdmin):
    list_display = ('seri_no', 'parca_tipi', 'ucak_tipi', 'durum', 'olusturan', 'uretim_tarihi')
    list_filter = ('parca_tipi', 'ucak_tipi', 'durum', 'uretim_tarihi')
    search_fields = ('seri_no', 'notlar')
    date_hierarchy = 'uretim_tarihi'
    readonly_fields = ('uretim_tarihi', 'guncelleme_tarihi')
    fieldsets = (
        (None, {
            'fields': ('seri_no', 'parca_tipi', 'ucak_tipi', 'olusturan', 'durum')
        }),
        (_('Tarihler'), {
            'fields': ('uretim_tarihi', 'guncelleme_tarihi')
        }),
        (_('Diğer Bilgiler'), {
            'fields': ('notlar',)
        }),
    )

    actions = ['geri_donusume_gonder', 'kullanilabilir_yap']

    def geri_donusume_gonder(self, request, queryset):
        """
        Seçili parçaları geri dönüşüme gönderir.
        """
        success_count = 0
        for parca in queryset:
            try:
                if parca.geri_donusume_gonder():
                    success_count += 1
            except Exception as e:
                self.message_user(request, f"Hata: {str(e)}", level='error')

        if success_count > 0:
            self.message_user(request, _(f"{success_count} parça geri dönüşüme gönderildi."))

    geri_donusume_gonder.short_description = _("Seçili parçaları geri dönüşüme gönder")

    def kullanilabilir_yap(self, request, queryset):
        """
        Seçili parçaları kullanılabilir duruma getirir.
        """
        try:
            kullanilabilir_durumu = ParcaDurumu.objects.get(ad='KULLANILABILIR')
            updated = queryset.exclude(durum=kullanilabilir_durumu).update(durum=kullanilabilir_durumu)
            self.message_user(request, _(f"{updated} parça kullanılabilir duruma getirildi."))
        except ParcaDurumu.DoesNotExist:
            self.message_user(request, _("'KULLANILABILIR' durumu bulunamadı."), level='error')

    kullanilabilir_yap.short_description = _("Seçili parçaları kullanılabilir yap")