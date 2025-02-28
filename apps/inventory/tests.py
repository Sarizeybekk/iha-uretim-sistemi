from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from apps.inventory.models import Envanter
from apps.parts.models import ParcaTipi
from apps.aircrafts.models import UcakTipi
from apps.teams.models import Takim

class EnvanterAPITestCase(APITestCase):
    """
    Envanter API testleri.
    """
    def setUp(self):
        self.client = APIClient()

        # Yetkili kullanıcı oluştur ve giriş yap
        self.user = get_user_model().objects.create_user(username="testuser", password="testpassword")
        self.client.force_authenticate(user=self.user)

        # Takım ve parça tipi oluştur
        self.takim = Takim.objects.create(ad="Kanat Takımı", aciklama="Kanat üretim takımı")
        self.parca_tipi = ParcaTipi.objects.create(ad="KANAT", aciklama="Kanat Parçası", sorumlu_takim=self.takim)
        self.ucak_tipi = UcakTipi.objects.create(kod="TB2", ad="Bayraktar TB2")

        # Envanter kaydı oluştur
        self.envanter = Envanter.objects.create(
            parca_tipi=self.parca_tipi,
            ucak_tipi=self.ucak_tipi,
            mevcut_adet=10,
            minimum_esik=5
        )

    def test_envanter_listesi(self):
        """Envanter listesi API çağrısı başarılı olmalı."""
        response = self.client.get(reverse('envanter-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_envanter_kayit_ekleme(self):
        """Yeni envanter kaydı API üzerinden eklenmeli."""
        data = {
            "parca_tipi": self.parca_tipi.id,
            "ucak_tipi": self.ucak_tipi.id,
            "mevcut_adet": 15,
            "minimum_esik": 5
        }
        response = self.client.post(reverse('envanter-list'), data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_envanter_silme(self):
        """Envanter kaydı silinebilmeli."""
        response = self.client.delete(reverse('envanter-detail', args=[self.envanter.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
