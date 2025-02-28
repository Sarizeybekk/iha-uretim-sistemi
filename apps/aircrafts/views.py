
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from apps.aircrafts.models import UcakTipi, UcakDurumu, Ucak, ParcaKullanimi
from apps.parts.models import Parca, ParcaDurumu
from apps.teams.models import Takim
from .serializers import UcakTipiSerializer, UcakDurumuSerializer, UcakSerializer, ParcaKullanimiSerializer


class UcakTipiViewSet(viewsets.ModelViewSet):

    queryset = UcakTipi.objects.all()
    serializer_class = UcakTipiSerializer
    permission_classes = [permissions.IsAuthenticated]


class UcakDurumuViewSet(viewsets.ModelViewSet):

    queryset = UcakDurumu.objects.all()
    serializer_class = UcakDurumuSerializer
    permission_classes = [permissions.IsAuthenticated]


class UcakViewSet(viewsets.ModelViewSet):

    queryset = Ucak.objects.all()
    serializer_class = UcakSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):

        kullanici = self.request.user
        montaj_yapan_takim = get_object_or_404(Takim, id=self.request.data.get('montaj_yapan_takim'))

        # Montaj yapan takımın yetkisi var mı kontrol et
        if not montaj_yapan_takim.montaj_yetkisi:
            return Response(
                {"error": "Sadece montaj yetkisi olan takımlar uçak oluşturabilir."},
                status=status.HTTP_403_FORBIDDEN
            )


        kullanici_takimlari = Takim.objects.filter(kullanicitakim__kullanici=kullanici)


        if not kullanici_takimlari.filter(id=montaj_yapan_takim.id).exists():
            return Response(
                {"error": f"{kullanici.username} kullanıcısı {montaj_yapan_takim.ad} takımında değil."},
                status=status.HTTP_403_FORBIDDEN
            )


        montajda_durumu = get_object_or_404(UcakDurumu, ad='MONTAJ')

        serializer.save(durum=montajda_durumu)

    @action(detail=True, methods=['post'])
    def monte_et(self, request, pk=None):

        ucak = self.get_object()
        parca_idleri = request.data.get('parca_idleri', [])


        parcalar = []
        for parca_id in parca_idleri:
            try:
                parca = Parca.objects.get(id=parca_id)
                parcalar.append(parca)
            except Parca.DoesNotExist:
                return Response(
                    {"error": f"ID: {parca_id} olan parça bulunamadı."},
                    status=status.HTTP_404_NOT_FOUND
                )


        for parca in parcalar:
            if parca.durum.ad != 'KULLANILABILIR':
                return Response(
                    {"error": f"{parca.seri_no} parçası kullanılabilir durumda değil."},
                    status=status.HTTP_400_BAD_REQUEST
                )


        for parca in parcalar:
            if parca.ucak_tipi.id != ucak.ucak_tipi.id:
                return Response(
                    {"error": f"{parca.seri_no} parçası {ucak.ucak_tipi.kod} ile uyumlu değil."},
                    status=status.HTTP_400_BAD_REQUEST
                )


        parca_tipleri = set(parca.parca_tipi.ad for parca in parcalar)
        gerekli_parca_tipleri = {'KANAT', 'GOVDE', 'KUYRUK', 'AVIYONIK'}

        if not gerekli_parca_tipleri.issubset(parca_tipleri):
            eksik_parcalar = gerekli_parca_tipleri - parca_tipleri
            return Response(
                {"error": f"Eksik parça tipleri: {', '.join(eksik_parcalar)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


        with transaction.atomic():

            kullaniliyor_durumu = get_object_or_404(ParcaDurumu, ad='KULLANILIYOR')


            for parca in parcalar:

                parca.durum = kullaniliyor_durumu
                parca.save()


                ParcaKullanimi.objects.create(
                    parca=parca,
                    ucak=ucak,
                    aktif=True
                )


            tamamlandi_durumu = get_object_or_404(UcakDurumu, ad='TAMAMLANDI')
            ucak.durum = tamamlandi_durumu
            ucak.save()

        return Response({"message": f"{ucak.seri_no} uçağının montajı tamamlandı."})

    @action(detail=True, methods=['post'])
    def teslim_et(self, request, pk=None):

        ucak = self.get_object()

        if ucak.durum.ad != 'TAMAMLANDI':
            return Response(
                {"error": "Sadece tamamlanmış uçaklar teslim edilebilir."},
                status=status.HTTP_400_BAD_REQUEST
            )


        teslim_edildi_durumu = get_object_or_404(UcakDurumu, ad='TESLIM_EDILDI')
        ucak.durum = teslim_edildi_durumu
        ucak.save()

        return Response({"message": f"{ucak.seri_no} uçağı teslim edildi."})