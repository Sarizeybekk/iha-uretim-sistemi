from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.translation import gettext as _
from apps.aircrafts.models import UcakTipi, UcakDurumu
from apps.parts.models import ParcaTipi, ParcaDurumu
from apps.teams.models import Takim


class Command(BaseCommand):
    help = 'Sistemin ihtiyaç duyduğu temel verileri oluşturur'

    def handle(self, *args, **options):
        self.stdout.write("Temel veriler oluşturuluyor...")

        with transaction.atomic():
            # Uçak tiplerini oluştur
            ucak_tipleri = [
                {'kod': 'TB2', 'ad': 'Bayraktar TB2'},
                {'kod': 'TB3', 'ad': 'Bayraktar TB3'},
                {'kod': 'AKINCI', 'ad': 'Bayraktar Akıncı'},
                {'kod': 'KIZILELMA', 'ad': 'Bayraktar Kızılelma'},
            ]

            for ucak_tipi in ucak_tipleri:
                UcakTipi.objects.get_or_create(
                    kod=ucak_tipi['kod'],
                    defaults={'ad': ucak_tipi['ad']}
                )

            self.stdout.write(self.style.SUCCESS(f"{len(ucak_tipleri)} uçak tipi oluşturuldu."))

            # Uçak durumlarını oluştur
            ucak_durumlari = [
                {'ad': 'MONTAJ', 'aciklama': 'Uçak montaj aşamasında'},
                {'ad': 'TAMAMLANDI', 'aciklama': 'Uçak montajı tamamlandı'},
                {'ad': 'TESLIM_EDILDI', 'aciklama': 'Uçak teslim edildi'},
            ]

            for ucak_durumu in ucak_durumlari:
                UcakDurumu.objects.get_or_create(
                    ad=ucak_durumu['ad'],
                    defaults={'aciklama': ucak_durumu['aciklama']}
                )

            self.stdout.write(self.style.SUCCESS(f"{len(ucak_durumlari)} uçak durumu oluşturuldu."))

            # Parça tiplerini oluştur
            parca_tipleri = [
                {'ad': 'KANAT', 'aciklama': 'Uçak kanadı'},
                {'ad': 'GOVDE', 'aciklama': 'Uçak gövdesi'},
                {'ad': 'KUYRUK', 'aciklama': 'Uçak kuyruğu'},
                {'ad': 'AVIYONIK', 'aciklama': 'Uçak aviyonik sistemleri'},
            ]

            for parca_tipi in parca_tipleri:
                ParcaTipi.objects.get_or_create(
                    ad=parca_tipi['ad'],
                    defaults={'aciklama': parca_tipi['aciklama']}
                )

            self.stdout.write(self.style.SUCCESS(f"{len(parca_tipleri)} parça tipi oluşturuldu."))

            # Parça durumlarını oluştur
            parca_durumlari = [
                {'ad': 'KULLANILABILIR', 'aciklama': 'Parça kullanılabilir durumda'},
                {'ad': 'KULLANILIYOR', 'aciklama': 'Parça bir uçakta kullanılıyor'},
                {'ad': 'KUSURLU', 'aciklama': 'Parça kusurlu durumda'},
                {'ad': 'GERI_DONUSUM', 'aciklama': 'Parça geri dönüşüme gönderildi'},
            ]

            for parca_durumu in parca_durumlari:
                ParcaDurumu.objects.get_or_create(
                    ad=parca_durumu['ad'],
                    defaults={'aciklama': parca_durumu['aciklama']}
                )

            self.stdout.write(self.style.SUCCESS(f"{len(parca_durumlari)} parça durumu oluşturuldu."))

            # Takımları oluştur
            takimlar = [
                {'ad': 'Kanat Takımı', 'takim_tipi': 'KANAT', 'montaj_yetkisi': False},
                {'ad': 'Gövde Takımı', 'takim_tipi': 'GOVDE', 'montaj_yetkisi': False},
                {'ad': 'Kuyruk Takımı', 'takim_tipi': 'KUYRUK', 'montaj_yetkisi': False},
                {'ad': 'Aviyonik Takımı', 'takim_tipi': 'AVIYONIK', 'montaj_yetkisi': False},
                {'ad': 'Montaj Takımı', 'takim_tipi': 'MONTAJ', 'montaj_yetkisi': True},
            ]

            for takim in takimlar:
                Takim.objects.get_or_create(
                    ad=takim['ad'],
                    defaults={
                        'takim_tipi': takim['takim_tipi'],
                        'montaj_yetkisi': takim['montaj_yetkisi'],
                    }
                )

            self.stdout.write(self.style.SUCCESS(f"{len(takimlar)} takım oluşturuldu."))

        self.stdout.write(self.style.SUCCESS("Temel veriler başarıyla oluşturuldu!"))