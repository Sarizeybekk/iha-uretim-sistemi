from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import gettext as _

from .models import Envanter,UcakTipi
from .serializers import EnvanterSerializer, EnvanterDurumuSerializer
from .services import EnvanterService


class EnvanterViewSet(viewsets.ModelViewSet):
    """
    Envanter kayıtları
    """
    queryset = Envanter.objects.all()
    serializer_class = EnvanterSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['parca_tipi', 'ucak_tipi']
    search_fields = ['parca_tipi__ad', 'ucak_tipi__kod']
    ordering_fields = ['mevcut_adet', 'son_guncelleme']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def dusuk_stok(self, request):
        """
        Düşük stok seviyesindeki envanter kayıtlarını döndürür.
        """
        envanter = Envanter.objects.dusuk_stok_alarmlari()
        serializer = self.get_serializer(envanter, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def ucak_tipi_bazinda_durum(self, request):
        """
        Uçak tipi bazında envanter durumunu döndürür.
        """
        ucak_tipi_kodu = request.query_params.get('ucak_tipi', None)

        durum = EnvanterService.ucak_tipi_bazinda_durum(ucak_tipi_kodu)

        if not durum:
            return Response(
                {"error": _("Belirtilen uçak tipi bulunamadı.")},
                status=status.HTTP_404_NOT_FOUND
            )

        if isinstance(durum, list):
            return Response(durum)

        serializer = EnvanterDurumuSerializer(durum)
        return Response(serializer.data)
