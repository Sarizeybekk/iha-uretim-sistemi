from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import gettext as _
from apps.parts.models import Parca
from .models import UcakTipi, UcakDurumu, Ucak, ParcaKullanimi
from .serializers import (
    UcakTipiSerializer, UcakDurumuSerializer, UcakSerializer,
    ParcaKullanimiSerializer, UcakMontajSerializer
)
from .services import UcakMontajService


class UcakTipiViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Uçak tipleri için salt okunur uç nokta.
    """
    queryset = UcakTipi.objects.all()
    serializer_class = UcakTipiSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['kod', 'ad', 'aciklama']


class UcakDurumuViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Uçak durumları için salt okunur uç nokta.
    """
    queryset = UcakDurumu.objects.all()
    serializer_class = UcakDurumuSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['ad', 'aciklama']


class UcakViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Uçaklar için salt okunur uç nokta.
    """
    serializer_class = UcakSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['ucak_tipi', 'durum', 'montaj_yapan_takim']
    search_fields = ['seri_no', 'notlar']
    ordering_fields = ['montaj_tarihi', 'seri_no']
    ordering = ['-montaj_tarihi']

    def get_queryset(self):
        """
        Kullanıcının izinlerine göre görüntüleyebileceği uçakları filtreler.
        """
        user = self.request.user

        # Montaj takımı tüm uçakları görebilir
        if user.takimlar.filter(montaj_yetkisi=True).exists():
            return Ucak.objects.all()

        # Diğer takımlar sadece kendi ürettikleri parçaların olduğu uçakları görebilir
        kullanici_takimlari = user.takimlar.values_list('id', flat=True)

        return Ucak.objects.filter(
            # Takımın ürettiği parçalardan biri kullanılmış uçak
            parcalar__parca__ureticisi__id__in=kullanici_takimlari
        ).distinct()


class MontajViewSet(viewsets.ViewSet):
    """
    Uçak montaj işlemleri için özel viewset.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def montaj(self, request):
        """
        Yeni bir uçak montajı yapar.
        """
        print("Alınan veri:", request.data)

        # Yetki kontrolü
        if not UcakMontajService.montaj_yapabilir_mi(request.user):
            return Response(
                {"error": _("Montaj işlemi için yetkiniz bulunmuyor.")},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UcakMontajSerializer(data=request.data)

        if serializer.is_valid():
            try:
                validated_data = serializer.validated_data

                # Eksik parça kontrolü
                eksik_parcalar = []
                if not validated_data.get('kanat_parca_id'):
                    eksik_parcalar.append('Kanat')
                if not validated_data.get('govde_parca_id'):
                    eksik_parcalar.append('Gövde')
                if not validated_data.get('kuyruk_parca_id'):
                    eksik_parcalar.append('Kuyruk')
                if not validated_data.get('aviyonik_parca_id'):
                    eksik_parcalar.append('Aviyonik')

                # Eğer eksik parça varsa montajı engelle
                if eksik_parcalar:
                    return Response(
                        {"error": _("Montaj yapılamadı. Eksik parçalar: ") + ', '.join(eksik_parcalar)},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Servis için parça listesini oluştur
                parcalar = [
                    validated_data['kanat_parca_id'],
                    validated_data['govde_parca_id'],
                    validated_data['kuyruk_parca_id'],
                    validated_data['aviyonik_parca_id'],
                ]

                # Servis için veri yapısı
                service_data = {
                    'ucak_tipi': validated_data['ucak_tipi'],
                    'seri_no': validated_data['seri_no'],
                    'parcalar': parcalar,
                    'notlar': validated_data.get('notlar', '')
                }

                print("Servise gönderilen veri:", service_data)

                # Montaj işlemi
                ucak = UcakMontajService.ucak_montaj(service_data, request.user)

                return Response(
                    UcakSerializer(ucak).data,
                    status=status.HTTP_201_CREATED
                )

            except Exception as e:
                print("Hata:", str(e))
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        print("Serializer hataları:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def montaj_durumu(self, request):
        """
        Montaj için uygun parçaların durumunu ve envanter seviyelerini döndürür.
        """
        # Tüm uçak tipleri için montaj durumu
        durumlar = []

        # Uçak tiplerini al
        ucak_tipleri = UcakTipi.objects.all()

        for ucak_tipi in ucak_tipleri:
            eksik_parcalar = []
            gerekli_parcalar = ['KANAT', 'GOVDE', 'KUYRUK', 'AVIYONIK']

            # Her parça tipi için kontrol et
            for parca_tipi in gerekli_parcalar:
                #  Kullanılabilir parça var mı kontrol et
                kullanilabilir_parca = Parca.objects.filter(
                    parca_tipi__ad=parca_tipi,
                    durum__ad='KULLANILABILIR',
                    ucak_tipi=ucak_tipi
                ).exists()

                #  Eğer yoksa eksik olarak listeye ekle
                if not kullanilabilir_parca:
                    eksik_parcalar.append(parca_tipi)

            montaj_icin_yeterli = len(eksik_parcalar) == 0

            #  Durumu listeye ekle
            durumlar.append({
                'ucak_tipi': ucak_tipi.kod,
                'montaj_icin_yeterli': montaj_icin_yeterli,
                'eksik_parcalar': eksik_parcalar
            })

        return Response(durumlar, status=status.HTTP_200_OK)
