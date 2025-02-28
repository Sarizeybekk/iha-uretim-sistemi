from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.aircrafts.models import Ucak, UcakTipi, UcakDurumu
from apps.parts.models import Parca, ParcaTipi, ParcaDurumu
from apps.teams.models import Takim
from apps.aircrafts.models import ParcaKullanimi
from apps.accounts.models import Kullanici

class UcakModelTestCase(TestCase):

    def setUp(self):
        """
        Test için gerekli nesneler oluşturuluyor.
        """

        self.test_user = Kullanici.objects.create_user(username="testuser", password="test123")


        self.montaj_takimi = Takim.objects.create(
            ad="Montaj Ekibi",
            aciklama="Uçak montajı yapan ekip",
            montaj_yetkisi=True
        )


        self.ucak_tipi = UcakTipi.objects.create(
            kod="TB2",
            ad="Bayraktar TB2",
            aciklama="İHA Modeli"
        )


        self.ucak_durumu = UcakDurumu.objects.create(
            ad="MONTAJ",
            aciklama="Uçak montaj aşamasında"
        )


        self.kullanilabilir_durum = ParcaDurumu.objects.create(
            ad="KULLANILABILIR",
            aciklama="Parça kullanılabilir durumda"
        )
        self.kullaniliyor_durum = ParcaDurumu.objects.create(
            ad="KULLANILIYOR",
            aciklama="Parça bir uçakta kullanılıyor"
        )


        self.parca_tipi = ParcaTipi.objects.create(
            ad="KANAT",
            aciklama="Kanat Parçası",
            sorumlu_takim=self.montaj_takimi
        )


        self.parca = Parca.objects.create(
            seri_no="P12345",
            parca_tipi=self.parca_tipi,
            ucak_tipi=self.ucak_tipi,
            durum=self.kullanilabilir_durum,
            olusturan=self.test_user
        )

    def test_parca_olusturuluyor_mu(self):
        """
        Parça başarıyla oluşturulmalı.
        """
        self.assertEqual(Parca.objects.count(), 1)
        self.assertEqual(self.parca.olusturan, self.test_user)

