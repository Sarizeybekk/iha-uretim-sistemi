from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse

Kullanici = get_user_model()


class KullaniciModelTest(TestCase):
    def setUp(self):
        self.user = Kullanici.objects.create_user(
            username='testuser',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )

    def test_kullanici_olusturuldu(self):
        """Kullanıcı başarıyla oluşturulmalı"""
        self.assertEqual(Kullanici.objects.count(), 1)
        self.assertEqual(self.user.username, 'testuser')

    def test_kullanici_str(self):
        """__str__ metodu doğru formatta olmalı"""
        self.assertEqual(str(self.user), 'testuser (Test User)')


class KullaniciAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = Kullanici.objects.create_user(username='testuser', password='testpassword')
        self.login_url = reverse('login')  # URL adını Django'daki view ismine göre güncelle
        self.logout_url = reverse('logout')
        self.profile_url = reverse('kullanici-profile')  # ViewSet'teki action

    def test_login_success(self):
        """Geçerli kullanıcı adı ve şifre ile giriş başarılı olmalı"""
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'testpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)

    def test_login_failure(self):
        """Yanlış bilgilerle giriş başarısız olmalı"""
        response = self.client.post(self.login_url, {
            'username': 'wronguser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_profile_authenticated(self):
        """Giriş yapmış kullanıcı kendi profiline erişebilmeli"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_profile_unauthenticated(self):
        """Giriş yapmamış kullanıcı profile erişememeli"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_authenticated(self):
        """Giriş yapmış kullanıcı çıkış yapabilmeli"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Başarıyla çıkış yapıldı')

    def test_logout_unauthenticated(self):
        """Giriş yapmamış kullanıcı çıkış yapamaz"""
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
