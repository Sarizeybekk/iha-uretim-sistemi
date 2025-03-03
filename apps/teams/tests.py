from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import Kullanici
from apps.teams.models import Takim, KullaniciTakim


class TakimAPITestCase(TestCase):
    """
    Takım API uç noktaları için test sınıfı.
    """

    def setUp(self):

        self.user = Kullanici.objects.create_user(
            username='takimci',
            email='takim@example.com',
            password='takim123'
        )

        self.admin_user = Kullanici.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            is_staff=True
        )

        self.kanat_takim = Takim.objects.create(
            ad='Kanat Takımı',
            takim_tipi='KANAT',
            aciklama='Test kanat takımı'
        )

        self.montaj_takim = Takim.objects.create(
            ad='Montaj Takımı',
            takim_tipi='MONTAJ',
            aciklama='Test montaj takımı',
            montaj_yetkisi=True
        )

        self.kullanici_takim = KullaniciTakim.objects.create(
            kullanici=self.user,
            takim=self.kanat_takim
        )

        self.client = APIClient()

    def test_takim_listesi_alma(self):
        """
        Takım listesini almanın test edilmesi.
        """

        self.client.force_authenticate(user=self.user)

        url = reverse('takim-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

        takim_adlari = [t['ad'] for t in response.data['results']]
        self.assertIn('Kanat Takımı', takim_adlari)
        self.assertIn('Montaj Takımı', takim_adlari)

    def test_takim_uyelerini_alma(self):
        """
        Takım üyelerini almanın test edilmesi.
        """
        self.client.force_authenticate(user=self.user)
        url = reverse('takim-uyeler', args=[self.kanat_takim.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['kullanici_detay']['username'], 'takimci')

    def test_kullanici_takim_iliskisi_ekleme(self):
        """
        Kullanıcı-takım ilişkisi eklemenin test edilmesi.
        """
        self.client.force_authenticate(user=self.admin_user)

        new_user = Kullanici.objects.create_user(
            username='newuser',
            email='new@example.com',
            password='new123'
        )

        url = reverse('kullanici-takim-list')
        data = {
            'kullanici': new_user.id,
            'takim': self.montaj_takim.id
        }
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(KullaniciTakim.objects.filter(
            kullanici=new_user,
            takim=self.montaj_takim
        ).exists())
