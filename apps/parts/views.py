from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import gettext as _
from django.db.models import Q

from .models import ParcaTipi, ParcaDurumu, Parca
from .serializers import (
    ParcaTipiSerializer, ParcaDurumuSerializer, ParcaSerializer,
    ParcaOlusturSerializer, GeriDonusumSerializer
)
from .services import ParcaService


class ParcaTipiViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Parça tipleri için salt okunur uç nokta.
    """
    queryset = ParcaTipi.objects.all()
    serializer_class = ParcaTipiSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['ad', 'aciklama']


class ParcaDurumuViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Parça durumları için salt okunur uç nokta.
    """
    queryset = ParcaDurumu.objects.all()
    serializer_class = ParcaDurumuSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['ad', 'aciklama']


class ParcaViewSet(viewsets.ModelViewSet):
    """
    Parçalar için tam CRUD işlemleri.
    """
    serializer_class = ParcaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['parca_tipi', 'ucak_tipi', 'durum', 'olusturan']
    search_fields = ['seri_no', 'notlar']
    ordering_fields = ['uretim_tarihi', 'seri_no']
    ordering = ['-uretim_tarihi']

    def get_queryset(self):
        """
        Kullanıcının izinlerine göre görüntüleyebileceği parçaları filtreler.
        """
        user = self.request.user
        kullanici_takimlari = user.takimlar.all()

        # Montaj takımı tüm parçaları görebilir
        if kullanici_takimlari.filter(montaj_yetkisi=True).exists():
            return Parca.objects.all()
        sorumlu_parca_tipleri = []
        for takim in kullanici_takimlari:
            if takim.takim_tipi != 'MONTAJ' and takim.takim_tipi != 'DIGER':
                sorumlu_parca_tipleri.append(takim.takim_tipi)
        return Parca.objects.filter(
            Q(olusturan=user) | Q(parca_tipi__ad__in=sorumlu_parca_tipleri)
        )

    def perform_create(self, serializer):
        """
        Parça oluşturma servis katmanına delege edilir.
        """
        # Servis katmanını kullanarak parça oluştur
        data = serializer.validated_data

        try:
            parca = ParcaService.parca_olustur(data, self.request.user)
            serializer.instance = parca
            return parca
        except Exception as e:
            from rest_framework import serializers
            raise serializers.ValidationError(str(e))

    @action(detail=True, methods=['post'])
    def geri_donusum(self, request, pk=None):
        """
        Parçayı geri dönüşüme gönderir.
        """
        serializer = GeriDonusumSerializer(data=request.data)

        if serializer.is_valid():
            try:
                ParcaService.geri_donusume_gonder(pk, request.user)
                return Response(
                    {"message": _("Parça başarıyla geri dönüşüme gönderildi.")},
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

