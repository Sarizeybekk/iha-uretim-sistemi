from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from apps.aircrafts.models import Ucak, UcakTipi, UcakDurumu
from apps.parts.models import Parca, ParcaTipi, ParcaDurumu
from apps.teams.models import Takim

User = get_user_model()

class UcakAPITestCase(APITestCase):
    """
    Uçak işlemleri için API testleri.
    """

    def setUp(self):
        """
        Test öncesinde gerekli nesneleri oluşturur.
        """
        # Takımlar oluşturuluyor (Montaj yetkisi belirleniyor)
        self.montaj_takimi = Takim.objects.create(ad="Montaj Takımı", montaj_yetkisi=True)
        self.kanat_takimi = Takim.objects.create(ad="Kanat Takımı", montaj_yetkisi=False)

        # Kullanıcılar oluşturuluyor
        self.kullanici = User.objects.create_user(username="testuser", password="testpassword")
        self.admin = User.objects.create_superuser(username="admin", password="adminpassword")

        # Uçak Tipleri & Durumları
        self.ucak_tipi = UcakTipi.objects.create(kod="TB2", ad="TB2 Model")
        self.durum_montaj = UcakDurumu.objects.create(ad="MONTAJ", aciklama="Montajda")
        self.durum_tamamlandi = UcakDurumu.objects.create(ad="TAMAMLANDI", aciklama="Tamamlandı")
        self.durum_teslim_edildi = UcakDurumu.objects.create(ad="TESLIM_EDILDI", aciklama="Teslim Edildi")

        # ✅ **Parça Tiplerini oluştururken sorumlu_takim ekleniyor!**
        self.parca_tipi_kanat = ParcaTipi.objects.create(ad="KANAT", sorumlu_takim=self.kanat_takimi)
        self.parca_tipi_govde = ParcaTipi.objects.create(ad="GOVDE", sorumlu_takim=self.kanat_takimi)
        self.parca_tipi_kuyruk = ParcaTipi.objects.create(ad="KUYRUK", sorumlu_takim=self.kanat_takimi)
        self.parca_tipi_aviyonik = ParcaTipi.objects.create(ad="AVIYONIK", sorumlu_takim=self.kanat_takimi)

        # Parça Durumları
        self.parca_durumu_kullanilabilir = ParcaDurumu.objects.create(ad="KULLANILABILIR")
        self.parca_durumu_kullaniliyor = ParcaDurumu.objects.create(ad="KULLANILIYOR")

        # API endpointleri
        self.ucak_create_url = reverse("ucak-list")

    def test_create_ucak(self):
        """ Montaj yetkisi olan takımın uçak oluşturabilmesi gerekir. """
        self.client.force_authenticate(user=self.kullanici)

        data = {
            "seri_no": "U12345",
            "ucak_tipi": self.ucak_tipi.id,
            "montaj_yapan_takim": self.montaj_takimi.id,
        }

        response = self.client.post(self.ucak_create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["seri_no"], "U12345")

    def test_non_montaj_team_cannot_create_ucak(self):
        """ Montaj yetkisi olmayan bir takımın uçak oluşturamaması gerekir. """
        self.client.force_authenticate(user=self.kullanici)

        data = {
            "seri_no": "U54321",
            "ucak_tipi": self.ucak_tipi.id,
            "montaj_yapan_takim": self.kanat_takimi.id,  # ❌ Yetkisi yok
        }

        response = self.client.post(self.ucak_create_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_monte_et_missing_parts(self):
        """ Eksik parçalarla montaj yapılamaz. """
        self.client.force_authenticate(user=self.kullanici)

        ucak = Ucak.objects.create(
            seri_no="U77777",
            ucak_tipi=self.ucak_tipi,
            montaj_yapan_takim=self.montaj_takimi,
            durum=self.durum_montaj
        )

        # ✅ Eksik parça testini düzelttim (Yalnızca 2 parça ekliyoruz!)
        parcalar = []
        for parca_tipi in [self.parca_tipi_kanat, self.parca_tipi_govde]:  # Kuyruk & Aviyonik eksik
            parca = Parca.objects.create(
                seri_no=f"P-{parca_tipi.ad}",
                parca_tipi=parca_tipi,
                ucak_tipi=self.ucak_tipi,
                durum=self.parca_durumu_kullanilabilir
            )
            parcalar.append(parca.id)

        url = reverse("ucak-monte-et", kwargs={"pk": ucak.id})
        response = self.client.post(url, {"parca_idleri": parcalar}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teslim_et(self):
        """ Montajı tamamlanmış uçak teslim edilebilmeli. """
        self.client.force_authenticate(user=self.kullanici)

        ucak = Ucak.objects.create(
            seri_no="U11111",
            ucak_tipi=self.ucak_tipi,
            montaj_yapan_takim=self.montaj_takimi,
            durum=self.durum_tamamlandi  # ✅ Uçak TAMAMLANDI durumunda
        )

        url = reverse("ucak-teslim-et", kwargs={"pk": ucak.id})
        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Ucak.objects.get(id=ucak.id).durum, self.durum_teslim_edildi)

    def test_teslim_et_not_completed(self):
        """ Montajı tamamlanmamış uçak teslim edilememeli. """
        self.client.force_authenticate(user=self.kullanici)

        ucak = Ucak.objects.create(
            seri_no="U22222",
            ucak_tipi=self.ucak_tipi,
            montaj_yapan_takim=self.montaj_takimi,
            durum=self.durum_montaj
        )

        url = reverse("ucak-teslim-et", kwargs={"pk": ucak.id})
        response = self.client.post(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
