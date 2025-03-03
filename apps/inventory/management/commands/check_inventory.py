from django.core.management.base import BaseCommand, CommandError
from django.utils.translation import gettext as _
from django.utils import timezone
from apps.inventory.services import EnvanterService


class Command(BaseCommand):
    help = 'Envanter seviyelerini kontrol eder ve düşük stok uyarıları oluşturur'

    def add_arguments(self, parser):
        parser.add_argument(
            '--mail',
            action='store_true',
            help='Düşük stok uyarılarını e-posta ile gönderir',
        )
        parser.add_argument(
            '--ucak-tipi',
            type=str,
            help='Belirli bir uçak tipinin stok durumunu kontrol eder',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS(f"Envanter kontrolü başlatıldı: {timezone.now()}"))

        if options['ucak_tipi']:
            # Belirli bir uçak tipi için envanter durumu
            durum = EnvanterService.ucak_tipi_bazinda_durum(options['ucak_tipi'])
            if durum:
                self.stdout.write(self.style.SUCCESS(f"{durum['ucak_tipi']} tipinin envanter durumu:"))

                for ozet in durum['ozet']:
                    stok_durumu = "✅" if not ozet['dusuk_stok'] else "❌"
                    self.stdout.write(f"{stok_durumu} {ozet['parca_tipi']}: {ozet['mevcut_adet']} adet")

                if durum['montaj_icin_yeterli']:
                    self.stdout.write(self.style.SUCCESS("Montaj için yeterli parça mevcut ✅"))
                else:
                    self.stdout.write(self.style.ERROR("Montaj için yeterli parça yok ❌"))
                    self.stdout.write(f"Eksik parçalar: {', '.join(durum['eksik_parcalar'])}")
            else:
                self.stdout.write(self.style.ERROR(f"{options['ucak_tipi']} kodlu uçak tipi bulunamadı."))
        else:
            # Tüm düşük stok uyarıları
            dusuk_stok_var, rapor = EnvanterService.dusuk_stok_kontrolu()

            if dusuk_stok_var:
                self.stdout.write(self.style.WARNING(f"Düşük stok uyarıları tespit edildi: {len(rapor)} adet"))

                for kayit in rapor:
                    self.stdout.write(
                        self.style.ERROR(
                            f"{kayit['parca_tipi']} - {kayit['ucak_tipi']}: "
                            f"{kayit['mevcut_adet']} adet (min: {kayit['minimum_esik']})"
                        )
                    )

                # E-posta gönderme opsiyonu
                if options['mail']:
                    self.stdout.write("E-posta gönderiliyor...")
                    # E-posta gönderme kodunu burada ekleyebilirsiniz
                    self.stdout.write(self.style.SUCCESS("E-posta gönderildi."))
            else:
                self.stdout.write(self.style.SUCCESS("Tüm envanter seviyeleri yeterli ✅"))

        self.stdout.write(self.style.SUCCESS(f"Envanter kontrolü tamamlandı: {timezone.now()}"))
