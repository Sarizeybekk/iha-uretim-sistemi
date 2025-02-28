from django.test import TestCase
from apps.accounts.models import Kullanici
from apps.teams.models import Takim, KullaniciTakim

class TakimModelTestCase(TestCase):

    def setUp(self):
        """
        Testler için örnek kullanıcı ve takım oluşturuluyor.
        """
        self.kullanici1 = Kullanici.objects.create_user(username="user1", password="password123")
        self.kullanici2 = Kullanici.objects.create_user(username="user2", password="password456")

        self.takim1 = Takim.objects.create(ad="Kanat Üretim", aciklama="Kanat bölümü üretim takımı")
        self.takim2 = Takim.objects.create(ad="Gövde Montaj", aciklama="Gövde montaj takımı", montaj_yetkisi=True)

    def test_takim_olusturuldu(self):
        """
        Bir takım başarıyla oluşturulmalı.
        """
        self.assertEqual(Takim.objects.count(), 2)
        self.assertEqual(self.takim1.ad, "Kanat Üretim")
        self.assertFalse(self.takim1.montaj_yetkisi)  # Varsayılan olarak False olmalı

    def test_takim_str_representation(self):
        """
        Takımın __str__ metodunun doğru çalıştığını test eder.
        """
        self.assertEqual(str(self.takim1), "Kanat Üretim")
        self.assertEqual(str(self.takim2), "Gövde Montaj")

    def test_kullanici_takima_ekleme(self):
        """
        Bir kullanıcı bir takıma eklenebilmeli.
        """
        KullaniciTakim.objects.create(kullanici=self.kullanici1, takim=self.takim1)
        self.assertEqual(KullaniciTakim.objects.count(), 1)
        self.assertEqual(self.kullanici1.takimlar.count(), 1)
        self.assertEqual(self.kullanici1.takimlar.first(), self.takim1)

    def test_kullanici_ayni_takima_tekrar_eklenemez(self):
        """
        Aynı kullanıcı aynı takıma iki kez eklenemez.
        """
        KullaniciTakim.objects.create(kullanici=self.kullanici1, takim=self.takim1)

        with self.assertRaises(Exception):  # unique_together kontrolü devreye girmeli
            KullaniciTakim.objects.create(kullanici=self.kullanici1, takim=self.takim1)

    def test_kullanici_takim_iliskisi(self):
        """
        Kullanıcı-takım ilişkisi ManyToMany ilişki üzerinden doğru çalışıyor mu?
        """
        KullaniciTakim.objects.create(kullanici=self.kullanici1, takim=self.takim1)
        KullaniciTakim.objects.create(kullanici=self.kullanici1, takim=self.takim2)

        self.assertEqual(self.kullanici1.takimlar.count(), 2)
        self.assertIn(self.takim1, self.kullanici1.takimlar.all())
        self.assertIn(self.takim2, self.kullanici1.takimlar.all())

    def test_takimda_olmayan_kullanici(self):
        """
        Kullanıcı herhangi bir takıma atanmadığında takım sayısı sıfır olmalı.
        """
        self.assertEqual(self.kullanici2.takimlar.count(), 0)
