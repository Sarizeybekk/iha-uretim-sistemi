from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import Kullanici
from apps.teams.models import Takim, KullaniciTakim
from apps.parts.models import ParcaTipi, ParcaDurumu, Parca
from apps.aircrafts.models import UcakTipi, UcakDurumu, Ucak


class MontajAPITestCase(TestCase):
    """
    Montaj API uç noktaları için test sınıfı.
    """

    def setUp(self):
        # Test veritabanını oluştur

        # Kullanıcı oluştur
        self.user = Kullanici.objects.create_user(
            username='montajci',
            email='montaj@example.com',
            password='montajpass123'
        )

        # Parça ve Uçak tiplerini oluştur
        self.kanat_tipi = ParcaTipi.objects.create(ad='KANAT', aciklama='Test kanat tipi')
        self.govde_tipi = ParcaTipi.objects.create(ad='GOVDE', aciklama='Test gövde tipi')
        self.kuyruk_tipi = ParcaTipi.objects.create(ad='KUYRUK', aciklama='Test kuyruk tipi')
        self.aviyonik_tipi = ParcaTipi.objects.create(ad='AVIYONIK', aciklama='Test aviyonik tipi')

        self.ucak_tipi = UcakTipi.objects.create(kod='TB2', ad='Test TB2')

        # Parça durumunu oluştur
        self.kullanilabilir_durumu = ParcaDurumu.objects.create(
            ad='KULLANILABILIR',
            aciklama='Kullanılabilir durum'
        )

        self.kullaniliyor_durumu = ParcaDurumu.objects.create(
            ad='KULLANILIYOR',
            aciklama='Kullanılıyor durum'
        )

        # Uçak durumunu oluştur
        self.tamamlandi_durumu = UcakDurumu.objects.create(
            ad='TAMAMLANDI',
            aciklama='Tamamlandı durum'
        )

        # Takımları oluştur
        self.montaj_takim = Takim.objects.create(
            ad='Montaj Takımı',
            takim_tipi='MONTAJ',
            aciklama='Test montaj takımı',
            montaj_yetkisi=True
        )

        # Kullanıcıyı takıma ekle
        self.kullanici_takim = KullaniciTakim.objects.create(
            kullanici=self.user,
            takim=self.montaj_takim
        )

        # Parçaları oluştur
        self.kanat = Parca.objects.create(
            seri_no='TST-KNT-001',
            parca_tipi=self.kanat_tipi,
            ucak_tipi=self.ucak_tipi,
            olusturan=self.user,
            durum=self.kullanilabilir_durumu
        )

        self.govde = Parca.objects.create(
            seri_no='TST-GVD-001',
            parca_tipi=self.govde_tipi,
            ucak_tipi=self.ucak_tipi,
            olusturan=self.user,
            durum=self.kullanilabilir_durumu
        )

        self.kuyruk = Parca.objects.create(
            seri_no='TST-KYR-001',
            parca_tipi=self.kuyruk_tipi,
            ucak_tipi=self.ucak_tipi,
            olusturan=self.user,
            durum=self.kullanilabilir_durumu
        )

        self.aviyonik = Parca.objects.create(
            seri_no='TST-AVY-001',
            parca_tipi=self.aviyonik_tipi,
            ucak_tipi=self.ucak_tipi,
            olusturan=self.user,
            durum=self.kullanilabilir_durumu
        )

        # API client'ı oluştur
        self.client = APIClient()

    def test_ucak_montaj(self):
            """
            Uçak montajının test edilmesi.
            """
            # Kullanıcı girişi yap
            self.client.force_authenticate(user=self.user)

            # Montaj uç noktasına istek gönder
            url = reverse('montaj-montaj')
            data = {
                'seri_no': 'TST-UCK-001',
                'ucak_tipi': self.ucak_tipi.id,
                'kanat_parca_id': self.kanat.id,
                'govde_parca_id': self.govde.id,
                'kuyruk_parca_id': self.kuyruk.id,
                'aviyonik_parca_id': self.aviyonik.id,
                'notlar': 'Test uçak montajı'
            }

            print("Test - Gönderilen veri:", data)
            response = self.client.post(url, data, format='json')
            print("Test - Yanıt:", response.content.decode())


            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(response.data['seri_no'], 'TST-UCK-001')

            # Veritabanında uçağın oluşturulduğunu kontrol et
            self.assertTrue(Ucak.objects.filter(seri_no='TST-UCK-001').exists())

    def test_montaj_durumu(self):
        """
        Montaj durumunu almanın test edilmesi.
        """
        # Kullanıcı girişi yap
        self.client.force_authenticate(user=self.user)

        # Montaj durumu uç noktasına istek gönder
        url = reverse('montaj-montaj-durumu')
        response = self.client.get(url)

        print("Montaj Durumu Response:", response.data)  # 👉 Bu satırı ekle ve JSON yapısını gör!

        # Yanıtı kontrol et
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(isinstance(response.data, list))

        # TB2 uçak tipi için durum kontrolü
        tb2_durum = next((d for d in response.data if d.get('ucak_tipi') == 'TB2'), None)  # 🔄 Düzeltildi!
        self.assertIsNotNone(tb2_durum)
        self.assertTrue(tb2_durum['montaj_icin_yeterli'])
        self.assertEqual(len(tb2_durum['eksik_parcalar']), 0)

