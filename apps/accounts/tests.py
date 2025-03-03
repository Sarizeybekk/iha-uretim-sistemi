from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import Kullanici
from apps.teams.models import Takim, KullaniciTakim


class KullaniciAPITestCase(TestCase):
    """
    Kullanıcı API uç noktaları için test sınıfı.
    """

    def setUp(self):


        self.user = Kullanici.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )


        self.kanat_takim = Takim.objects.create(
            ad='Kanat Takımı',
            takim_tipi='KANAT',
            aciklama='Test kanat takımı'
        )


        self.kullanici_takim = KullaniciTakim.objects.create(
            kullanici=self.user,
            takim=self.kanat_takim
        )


        self.client = APIClient()

    def test_login(self):
        """
        Kullanıcı girişinin test edilmesi.
        """

        url = reverse('login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(url, data)


        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['tam_ad'], 'Test User')

    def test_me(self):
        """
        Giriş yapmış kullanıcı bilgilerini almanın test edilmesi.
        """

        self.client.force_authenticate(user=self.user)


        url = reverse('kullanici-me')
        response = self.client.get(url)


        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')


        self.assertEqual(len(response.data['takim_listesi']), 1)
        self.assertEqual(response.data['takim_listesi'][0]['ad'], 'Kanat Takımı')

    def test_takimlarim(self):
        """
        Kullanıcının takımlarını almanın test edilmesi.
        """

        self.client.force_authenticate(user=self.user)

