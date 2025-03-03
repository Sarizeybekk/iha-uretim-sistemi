from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import Kullanici
from apps.parts.models import ParcaTipi, ParcaDurumu, Parca
from apps.aircrafts.models import UcakTipi
from apps.inventory.models import Envanter


class EnvanterAPITestCase(TestCase):
    """
    Envanter API uç noktaları için test sınıfı.
    """

    def setUp(self):
        # Test veritabanını oluştur

        # Kullanıcı oluştur
        self.user = Kullanici.objects.create_user(
            username='envanter',
            email='envanter@example.com',
            password='envanter123'
        )

        # Parça ve Uçak tiplerini oluştur
        self.kanat_tipi = ParcaTipi.objects.create(ad='KANAT', aciklama='Test kanat tipi')
        self.ucak_tipi = UcakTipi.objects.create(kod='TB2', ad='Test TB2')

        # Envanter kaydı oluştur
        self.envanter = Envanter.objects.create(
            parca_tipi=self.kanat_tipi,
            ucak_tipi=self.ucak_tipi,
            mevcut_adet=10,
            minimum_esik=5
        )

        # API client'ı oluştur
        self.client = APIClient()

    def test_envanter_listesi_alma(self):
        """
        Envanter listesini almanın test edilmesi.
        """
        # Kullanıcı girişi yap
        self.client.force_authenticate(user=self.user)

        # Envanter listesi uç noktasına istek gönder
        url = reverse('envanter-list')
        response = self.client.get(url)

        # Yanıtı kontrol et
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['mevcut_adet'], 10)
        self.assertEqual(response.data['results'][0]['ucak_tipi_kodu'], 'TB2')

    def test_dusuk_stok_filtreleme(self):
        """
        Düşük stok filtreleme özelliğinin test edilmesi.
        """
        # Kullanıcı girişi yap
        self.client.force_authenticate(user=self.user)

        # Düşük stoğa sahip envanter kaydı oluştur
        self.dusuk_envanter = Envanter.objects.create(
            parca_tipi=self.kanat_tipi,
            ucak_tipi=UcakTipi.objects.create(kod='AKINCI', ad='Test Akıncı'),
            mevcut_adet=2,
            minimum_esik=5
        )

        # Düşük stok envanter uç noktasına istek gönder
        url = reverse('envanter-dusuk-stok')
        response = self.client.get(url)

        # Yanıtı kontrol et
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['ucak_tipi_kodu'], 'AKINCI')
        self.assertEqual(response.data[0]['mevcut_adet'], 2)
        self.assertTrue(response.data[0]['dusuk_stok_durumu'])

    def test_ucak_tipi_bazinda_durum(self):
        """
        Uçak tipi bazında envanter durumunun test edilmesi.
        """
        # Kullanıcı girişi yap
        self.client.force_authenticate(user=self.user)

        # Diğer parça tiplerini oluştur
        self.govde_tipi = ParcaTipi.objects.create(ad='GOVDE', aciklama='Test gövde tipi')
        self.kuyruk_tipi = ParcaTipi.objects.create(ad='KUYRUK', aciklama='Test kuyruk tipi')
        self.aviyonik_tipi = ParcaTipi.objects.create(ad='AVIYONIK', aciklama='Test aviyonik tipi')

        # Diğer parça tipleri için envanter kayıtları oluştur
        Envanter.objects.create(
            parca_tipi=self.govde_tipi,
            ucak_tipi=self.ucak_tipi,
            mevcut_adet=8,
            minimum_esik=5
        )

        Envanter.objects.create(
            parca_tipi=self.kuyruk_tipi,
            ucak_tipi=self.ucak_tipi,
            mevcut_adet=6,
            minimum_esik=5
        )

        Envanter.objects.create(
            parca_tipi=self.aviyonik_tipi,
            ucak_tipi=self.ucak_tipi,
            mevcut_adet=7,
            minimum_esik=5
        )

        # Uçak tipi bazında durum uç noktasına istek gönder
        url = reverse('envanter-ucak-tipi-bazinda-durum') + f'?ucak_tipi={self.ucak_tipi.kod}'
        response = self.client.get(url)

        # Yanıtı kontrol et
        # Yanıtı kontrol et
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['ucak_tipi'], 'TB2')  # 'ucak_tipi' yerine 'ucak_tipi_kodu'
        self.assertTrue(response.data['montaj_icin_yeterli'])

        # Parça tiplerine göre envanter durumlarını kontrol et
        kanat_durumu = next((d for d in response.data['ozet'] if d['parca_tipi'] == 'Kanat'), None)

        # 'parca_durumlari' yerine 'ozet' alanını kontrol et
        self.assertEqual(len(response.data['ozet']), 4)

        # Parça tiplerine göre envanter durumlarını kontrol et
        kanat_durumu = next((d for d in response.data['ozet'] if d['parca_tipi'] == 'Kanat'), None)
        self.assertIsNotNone(kanat_durumu)
        self.assertEqual(kanat_durumu['mevcut_adet'], 10)

        govde_durumu = next((d for d in response.data['ozet'] if d['parca_tipi'] == 'Gövde'), None)
        self.assertIsNotNone(govde_durumu)
        self.assertEqual(govde_durumu['mevcut_adet'], 8)
