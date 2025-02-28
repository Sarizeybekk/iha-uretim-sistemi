from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Takim, KullaniciTakim
from .serializers import TakimSerializer, KullaniciTakimSerializer

class TakimViewSet(viewsets.ModelViewSet):
    queryset = Takim.objects.all()
    serializer_class = TakimSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def uyeler(self, request, pk=None):
        takim = self.get_object()
        uyeler = takim.uyeler.all()
        return Response({"uyeler": [user.username for user in uyeler]})

    @action(detail=False, methods=['get'])
    def istatistikler(self, request):
        toplam_takim = Takim.objects.count()
        toplam_kullanici = KullaniciTakim.objects.count()
        return Response({
            "toplam_takim": toplam_takim,
            "toplam_kullanici": toplam_kullanici
        })

class KullaniciTakimViewSet(viewsets.ModelViewSet):
    queryset = KullaniciTakim.objects.all()
    serializer_class = KullaniciTakimSerializer
    permission_classes = [permissions.IsAuthenticated]
