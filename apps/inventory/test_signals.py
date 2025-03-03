from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.parts.models import ParcaTipi, ParcaDurumu, Parca
from apps.aircrafts.models import UcakTipi, Ucak, ParcaKullanimi, UcakDurumu
from apps.inventory.models import Envanter
from apps.teams.models import Takim
from apps.accounts.models import Kullanici

class SignalTestCase(TestCase):

    def setUp(self):
        # Kullanıcı oluştur
        self.user = Kullanici.objects.create_user(username='testuser', password='testpass')

        # Takım oluştur
        self.takim = Takim.objects.create(ad='Montaj Takımı', montaj_yetkisi=True)

        # Parça ve uçak tiplerini oluştur
        self.kanat_tipi = ParcaTipi.objects.create(ad='KANAT')
        self.ucak_tipi = UcakTipi.objects.create(kod='TB2', ad='Test TB2')

        # Parça durumları oluştur
        self.kullanilabilir = ParcaDurumu.objects.create(ad='KULLANILABILIR')
        self.kullaniliyor = ParcaDurumu.objects.create(ad='KULLANILIYOR')

        # Envanter kaydı oluştur
        self.envanter = Envanter.objects.create(
            parca_tipi=self.kanat_tipi,
            ucak_tipi=self.ucak_tipi,
            mevcut_adet=5,
            minimum_esik=2
        )

        # Parça oluştur
        self.parca = Parca.objects.create(
            seri_no='KANAT-001',
            parca_tipi=self.kanat_tipi,
            ucak_tipi=self.ucak_tipi,
            olusturan=self.user,
            durum=self.kullanilabilir
        )

        # Uçak durumu ve uçak oluştur
        self.ucak_durumu = UcakDurumu.objects.create(ad='MONTAJ')
        self.ucak = Ucak.objects.create(
            seri_no='TB2-001',
            ucak_tipi=self.ucak_tipi,
            montaj_yapan_takim=self.takim,
            durum=self.ucak_durumu
        )

    def test_stok_azalt_signal(self):
        """
        Parça kullanıldığında envanterdeki stok sayısının azalmasını test eder.
        """
        # İlk envanter kontrolü
        self.assertEqual(self.envanter.mevcut_adet, 5)

        # Parça kullanımını kaydet
        ParcaKullanimi.objects.create(parca=self.parca, ucak=self.ucak)

        # Stok kontrolü
        self.envanter.refresh_from_db()
        self.assertEqual(self.envanter.mevcut_adet, 4)

    def test_stok_azalt_yetersiz_stok(self):
        """
        Yetersiz stok olduğunda hata fırlatılmasını test eder.
        """
        # Mevcut adedi 0 yap
        self.envanter.mevcut_adet = 0
        self.envanter.save()

        # Parça kullanımını kaydetmeye çalış
        with self.assertRaises(ValidationError):
            ParcaKullanimi.objects.create(parca=self.parca, ucak=self.ucak)
