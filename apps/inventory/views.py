from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.inventory.models import Envanter
from apps.parts.models import ParcaTipi
from apps.aircrafts.models import UcakTipi
from .serializers import EnvanterSerializer


class EnvanterViewSet(viewsets.ModelViewSet):

    queryset = Envanter.objects.all()
    serializer_class = EnvanterSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dusuk_stok(self, request):

        dusuk_stok_envanter = Envanter.objects.filter(mevcut_adet__lt=models.F('minimum_esik'))
        serializer = self.get_serializer(dusuk_stok_envanter, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def eksik_parca_kontrol(self, request):

        ucak_tipi_id = request.data.get('ucak_tipi_id')

        if not ucak_tipi_id:
            return Response(
                {"hata": "ucak_tipi_id parametresi gereklidir"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ucak_tipi = UcakTipi.objects.get(id=ucak_tipi_id)
        except UcakTipi.DoesNotExist:
            return Response(
                {"hata": f"ID'si {ucak_tipi_id} olan uçak tipi bulunamadı"},
                status=status.HTTP_404_NOT_FOUND
            )


        parca_tipleri = ParcaTipi.objects.all()

        eksik_parcalar = []
        dusuk_stok_parcalar = []

        for parca_tipi in parca_tipleri:

            try:
                envanter = Envanter.objects.get(parca_tipi=parca_tipi, ucak_tipi=ucak_tipi)

                if envanter.mevcut_adet == 0:
                    eksik_parcalar.append({
                        "parca_tipi_id": parca_tipi.id,
                        "parca_tipi_adi": str(parca_tipi),
                        "mevcut_adet": 0
                    })

                elif envanter.dusuk_stok:
                    dusuk_stok_parcalar.append({
                        "parca_tipi_id": parca_tipi.id,
                        "parca_tipi_adi": str(parca_tipi),
                        "mevcut_adet": envanter.mevcut_adet,
                        "minimum_esik": envanter.minimum_esik
                    })
            except Envanter.DoesNotExist:

                eksik_parcalar.append({
                    "parca_tipi_id": parca_tipi.id,
                    "parca_tipi_adi": str(parca_tipi),
                    "mevcut_adet": 0
                })


        sonuc = {
            "ucak_tipi": {
                "id": ucak_tipi.id,
                "kod": ucak_tipi.kod,
                "ad": ucak_tipi.ad
            },
            "eksik_parcalar": eksik_parcalar,
            "dusuk_stok_parcalar": dusuk_stok_parcalar,
            "durum": "eksik" if eksik_parcalar else "tamam"
        }

        return Response(sonuc)