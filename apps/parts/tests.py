from django.test import TestCase
from django.urls import reverse
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import Kullanici
from apps.teams.models import Takim, KullaniciTakim
from apps.parts.models import ParcaTipi, ParcaDurumu, Parca
from apps.aircrafts.models import UcakTipi, UcakDurumu, Ucak, ParcaKullanimi


class ParcaAPITestCase(TestCase):
    """
    Parça API uç noktaları için test sınıfı.
    """

    def setUp(self):
        self.user = Kullanici.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.parca_tipi = ParcaTipi.objects.create(ad='KANAT', aciklama='Test kanat tipi')
        self.ucak_tipi_tb2 = UcakTipi.objects.create(kod='TB2', ad='Test TB2')
        self.ucak_tipi_tb3 = UcakTipi.objects.create(kod='TB3', ad='Test TB3')

        self.parca_durumu = ParcaDurumu.objects.create(
            ad='KULLANILABILIR',
            aciklama='Kullanılabilir durum'
        )

        self.geri_donusum_durumu = ParcaDurumu.objects.create(
            ad='GERI_DONUSUM',
            aciklama='Geri dönüşüm durumu'
        )

        self.takim = Takim.objects.create(
            ad='Kanat Takımı',
            takim_tipi='KANAT',
            aciklama='Test kanat takımı'
        )

        self.kullanici_takim = KullaniciTakim.objects.create(
            kullanici=self.user,
            takim=self.takim
        )

        self.kanat_tb2 = Parca.objects.create(
            seri_no='TST-KNT-TB2',
            parca_tipi=self.parca_tipi,
            ucak_tipi=self.ucak_tipi_tb2,
            olusturan=self.user,
            durum=self.parca_durumu
        )

        self.ucak_tb3 = Ucak.objects.create(
            seri_no='TST-UCK-TB3',
            ucak_tipi=self.ucak_tipi_tb3,
            montaj_yapan_takim=Takim.objects.create(
                ad='Montaj Takımı',
                takim_tipi='MONTAJ',
                montaj_yetkisi=True
            ),
            durum=UcakDurumu.objects.create(
                ad='TAMAMLANDI',
                aciklama='Tamamlandı durum'
            )
        )

        self.client = APIClient()

    def test_parca_uyumsuzlugu(self):
        """
        TB2 kanadı TB3 uçağına takılmaya çalışıldığında hata dönmeli.
        """
        # Uyumsuz parça kullanımı oluşturmaya çalış
        parca_kullanimi = ParcaKullanimi(
            parca=self.kanat_tb2,
            ucak=self.ucak_tb3
        )

        # Hata fırlatma
        with self.assertRaises(ValidationError) as context:
            parca_kullanimi.clean()

        self.assertIn("uyumlu değil", str(context.exception))

    def test_parca_listesi_alma(self):
        """
        Parça listesini almanın test edilmesi.
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('parca-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['seri_no'], 'TST-KNT-TB2')

    def test_parca_olusturma(self):
        """
        Yeni parça oluşturmanın test edilmesi.
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('parca-list')
        data = {
            'seri_no': 'TST-KNT-002',
            'parca_tipi': self.parca_tipi.id,
            'ucak_tipi': self.ucak_tipi_tb2.id,
            'durum': self.parca_durumu.id,
            'notlar': 'Test parçası 2'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['seri_no'], 'TST-KNT-002')
        self.assertTrue(Parca.objects.filter(seri_no='TST-KNT-002').exists())

    def test_parca_detayi_alma(self):
        """
        Parça detayını almanın test edilmesi.
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('parca-detail', args=[self.kanat_tb2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['seri_no'], 'TST-KNT-TB2')

    def test_parca_guncelleme(self):
        """
        Parça güncellemenin test edilmesi.
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('parca-detail', args=[self.kanat_tb2.id])
        data = {
            'seri_no': 'TST-KNT-001-UPD',
            'parca_tipi': self.parca_tipi.id,
            'ucak_tipi': self.ucak_tipi_tb2.id,
            'durum': self.parca_durumu.id,
            'notlar': 'Güncellenmiş test parçası'
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.kanat_tb2.refresh_from_db()
        self.assertEqual(self.kanat_tb2.seri_no, 'TST-KNT-001-UPD')

    def test_parca_geri_donusum(self):
        """
        Parçayı geri dönüşüme göndermenin test edilmesi.
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('parca-geri-donusum', args=[self.kanat_tb2.id])
        data = {
            'parca_id': self.kanat_tb2.id,
            'neden': 'Test için geri dönüşüme gönderildi'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.kanat_tb2.refresh_from_db()
        self.assertEqual(self.kanat_tb2.durum.ad, 'GERI_DONUSUM')
