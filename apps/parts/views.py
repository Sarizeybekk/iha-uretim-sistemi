from rest_framework.decorators import action
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import Parca, ParcaTipi, ParcaDurumu
from .serializers import ParcaSerializer, ParcaTipiSerializer, ParcaDurumuSerializer
from django.core.exceptions import ValidationError
from .permission import ParcaPermission
class ParcaTipiViewSet(viewsets.ModelViewSet):
    queryset = ParcaTipi.objects.all()
    serializer_class = ParcaTipiSerializer
    permission_classes = [permissions.IsAuthenticated]


class ParcaDurumuViewSet(viewsets.ModelViewSet):
    queryset = ParcaDurumu.objects.all()
    serializer_class = ParcaDurumuSerializer
    permission_classes = [permissions.IsAuthenticated]


class ParcaViewSet(viewsets.ModelViewSet):
    queryset = Parca.objects.all()
    serializer_class = ParcaSerializer
    permission_classes = [permissions.IsAuthenticated,ParcaPermission]

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValidationError as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['get'])
    def toplam_parca_sayisi(self, request):
        """
        Sistemdeki toplam parça sayısını döndürür.
        """
        toplam_sayi = Parca.objects.count()
        return Response({"toplam_parca_sayisi": toplam_sayi})
