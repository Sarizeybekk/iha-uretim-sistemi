from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import gettext as _

from .models import Takim, KullaniciTakim
from .serializers import TakimSerializer, KullaniciTakimSerializer


class TakimViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Takımlar için salt okunur uç nokta.
    """
    queryset = Takim.objects.all()
    serializer_class = TakimSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['takim_tipi', 'montaj_yetkisi']
    search_fields = ['ad', 'aciklama']

    @action(detail=True, methods=['get'])
    def uyeler(self, request, pk=None):
        """
        Belirli bir takımın üyelerini döndürür.
        """
        takim = self.get_object()
        kullanici_takimlar = KullaniciTakim.objects.filter(takim=takim)
        serializer = KullaniciTakimSerializer(kullanici_takimlar, many=True)
        return Response(serializer.data)


class KullaniciTakimViewSet(viewsets.ModelViewSet):
    """
    Kullanıcı-Takım ilişkileri için CRUD işlemleri.
    """
    serializer_class = KullaniciTakimSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['kullanici', 'takim']
    search_fields = ['kullanici__username', 'takim__ad']

    def get_queryset(self):
        if self.request.user.is_staff:
            return KullaniciTakim.objects.all()
        return KullaniciTakim.objects.filter(kullanici=self.request.user)