from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.accounts.models import Kullanici
from apps.teams.models import Takim
from apps.parts.models import Parca, ParcaTipi, ParcaDurumu
from apps.aircrafts.models import UcakTipi  # Uçak tiplerini test etmek için

class ParcaModelTest(TestCase):

    def setUp(self):
        """
        Testler için gerekli nesneleri oluşturur.
        """
        # Test kullanıcılarını oluştur
        self.user1 = Kullanici.objects.create_user(username="testuser1", password="password123")
        self.user2 = Kullanici.objects.create_user(username="testuser2", password="password123")



    def test_parca_uretimi_basariyla(self):
        """
        Yetkili takımda bulunan bir kullanıcının parça üretimi başarılı olmalı.
        """
        parca = Parca(
            seri_no="123456",
            parca_tipi=self.parca_tipi,
            ucak_tipi=self.ucak_tipi,
            olusturan=self.user1,
            durum=self.parca_durumu
        )
        parca.clean()  # Validasyon çağır
        parca.save()  # Veritabanına kaydet

        # Veritabanında 1 kayıt olup olmadığını doğrula
        self.assertEqual(Parca.objects.count(), 1)

    def test_yetkisiz_kullanici_parca_uretemez(self):
        """
        Kullanıcının yetkili olmadığı bir parça tipini üretmeye çalışması hata vermeli.
        """
        yetkisiz_parca = Parca(
            seri_no="789012",
            parca_tipi=self.parca_tipi,  # Test kullanıcısı bu parça tipini üretemez
            ucak_tipi=self.ucak_tipi,
            olusturan=self.user2,  # Yetkili olmayan kullanıcı
            durum=self.parca_durumu
        )

        # Parçanın kaydedilemeyeceğini test et
        with self.assertRaises(ValidationError):
            yetkisiz_parca.clean()

    def test_parca_guncellenme_tarihi(self):
        """
        Parça güncellendiğinde `guncelleme_tarihi` değişmeli.
        """
        parca = Parca.objects.create(
            seri_no="654321",
            parca_tipi=self.parca_tipi,
            ucak_tipi=self.ucak_tipi,
            olusturan=self.user1,
            durum=self.parca_durumu
        )

        eski_tarih = parca.guncelleme_tarihi
        parca.durum = ParcaDurumu.objects.create(ad="KUSURLU")  # Durumu değiştir
        parca.save()  # Güncelle

        self.assertNotEqual(parca.guncelleme_tarihi, eski_tarih)

    def test_parcalar_filtrelenebilir(self):
        """
        Parçalar belirli parça tipine, uçak tipine ve duruma göre filtrelenebilmeli.
        """
        # Örnek 3 farklı parça oluştur
        Parca.objects.create(seri_no="1001", parca_tipi=self.parca_tipi, ucak_tipi=self.ucak_tipi, olusturan=self.user1, durum=self.parca_durumu)
        Parca.objects.create(seri_no="1002", parca_tipi=self.parca_tipi, ucak_tipi=self.ucak_tipi, olusturan=self.user1, durum=self.parca_durumu)
        Parca.objects.create(seri_no="1003", parca_tipi=self.parca_tipi, ucak_tipi=self.ucak_tipi, olusturan=self.user1, durum=ParcaDurumu.objects.create(ad="KUSURLU"))

        # Kullanılabilir parça sayısını test et
        kullanilabilir_parcalar = Parca.objects.filter(durum__ad="KULLANILABILIR")
        self.assertEqual(kullanilabilir_parcalar.count(), 2)

        # Kusurlu parça sayısını test et
        kusurlu_parcalar = Parca.objects.filter(durum__ad="KUSURLU")
        self.assertEqual(kusurlu_parcalar.count(), 1)
