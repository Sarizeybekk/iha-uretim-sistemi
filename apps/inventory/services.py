from django.utils.translation import gettext as _
from django.db.models import F

from .models import Envanter
from apps.parts.models import ParcaTipi
from apps.aircrafts.models import UcakTipi


class EnvanterService:
    """
    Envanter işlemleri için servis sınıfı.
    """

    @staticmethod
    def dusuk_stok_kontrolu():
        """
        Düşük stok seviyelerini kontrol eder ve rapor üretir.
        """
        dusuk_stok_kayitlari = Envanter.objects.dusuk_stok_alarmlari()

        if not dusuk_stok_kayitlari.exists():
            return False, _("Tüm envanter seviyeleri yeterli.")

        # Düşük stok raporunu hazırla
        rapor = []
        for envanter in dusuk_stok_kayitlari:
            rapor.append({
                'parca_tipi': envanter.parca_tipi.get_ad_display(),
                'ucak_tipi': envanter.ucak_tipi.kod,
                'mevcut_adet': envanter.mevcut_adet,
                'minimum_esik': envanter.minimum_esik
            })

        return True, rapor

    @staticmethod
    def stok_azalt(parca_tipi_id, ucak_tipi_id, miktar=1):
        """
        Verilen parça ve uçak tipi için stoktan belirtilen miktarda azaltır.
        """
        try:
            envanter = Envanter.objects.get(parca_tipi_id=parca_tipi_id, ucak_tipi_id=ucak_tipi_id)

            if envanter.mevcut_adet >= miktar:
                envanter.mevcut_adet = F('mevcut_adet') - miktar
                envanter.save()
                envanter.refresh_from_db()
            else:
                raise ValueError(_(
                    "Yetersiz stok: {parca_tipi} parçası için mevcut adet {mevcut}, istenen miktar {miktar}."
                ).format(
                    parca_tipi=envanter.parca_tipi.get_ad_display(),
                    mevcut=envanter.mevcut_adet,
                    miktar=miktar
                ))
        except Envanter.DoesNotExist:
            raise ValueError(_(
                "{parca_tipi} parçası için {ucak_tipi} modelinde envanter kaydı bulunamadı."
            ).format(
                parca_tipi=ParcaTipi.objects.get(id=parca_tipi_id).get_ad_display(),
                ucak_tipi=UcakTipi.objects.get(id=ucak_tipi_id).kod
            ))
    @staticmethod
    def ucak_tipi_bazinda_durum(ucak_tipi_kod=None):
        """
        Uçak tipi bazında envanter durumunu raporlar.
        """
        if ucak_tipi_kod:
            # Belirli bir uçak tipi için envanter özeti
            try:
                ucak_tipi = UcakTipi.objects.get(kod=ucak_tipi_kod)

                # Tüm parça tipleri için durumu hazırla
                parca_tipleri = ParcaTipi.objects.all()
                ozet= []  # Burayı değiştirdim: 'ozet' -> 'parca_durumlari'

                for parca_tipi in parca_tipleri:
                    try:
                        envanter = Envanter.objects.get(
                            ucak_tipi=ucak_tipi,
                            parca_tipi=parca_tipi
                        )

                        ozet.append({
                            'parca_tipi': parca_tipi.get_ad_display(),
                            'mevcut_adet': envanter.mevcut_adet,
                            'dusuk_stok': envanter.dusuk_stok
                        })
                    except Envanter.DoesNotExist:
                        ozet.append({
                            'parca_tipi': parca_tipi.get_ad_display(),
                            'mevcut_adet': 0,
                            'dusuk_stok': True
                        })

                # Montaj için yeterli parça var mı kontrolü
                yeterli, eksik_parcalar = Envanter.objects.montaj_icin_yeterli_parcalar_var_mi(ucak_tipi_kod)

                return {
                    'ucak_tipi': ucak_tipi.kod,
                    'ozet': ozet,

                    'montaj_icin_yeterli': yeterli,
                    'eksik_parcalar': eksik_parcalar
                }

            except UcakTipi.DoesNotExist:
                return None
        else:
            ucak_tipleri = UcakTipi.objects.all()
            sonuc = []

            for ucak_tipi in ucak_tipleri:
                yeterli, eksik_parcalar = Envanter.objects.montaj_icin_yeterli_parcalar_var_mi(ucak_tipi.kod)

                sonuc.append({
                    'ucak_tipi': ucak_tipi.kod,
                    'montaj_icin_yeterli': yeterli,
                    'eksik_parcalar': eksik_parcalar
                })

            return sonuc