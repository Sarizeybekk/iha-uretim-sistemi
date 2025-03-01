from rest_framework import permissions
from django.core.exceptions import ValidationError
from .models import Parca, Takim
class ParcaPermission(permissions.BasePermission):
    """
    Parca modelinin clean() metodunu kullanarak takım kısıtlamalarını uygulayan permission sınıfı.
    """
    message = "Bu parça için gerekli izinlere sahip değilsiniz."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == 'POST':
            try:
                parca = Parca(
                    seri_no=request.data.get('seri_no', ''),
                    parca_tipi_id=request.data.get('parca_tipi'),
                    ucak_tipi_id=request.data.get('ucak_tipi'),
                    durum_id=request.data.get('durum'),
                    olusturan=request.user,  # Aktif kullanıcıyı ata
                    notlar=request.data.get('notlar', '')
                )
                parca.clean()
                return True

            except ValidationError as e:
                self.message = str(e)
                return False

        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method in ['PUT', 'PATCH']:
            new_parca_tipi_id = request.data.get('parca_tipi')
            if new_parca_tipi_id and int(new_parca_tipi_id) != obj.parca_tipi.id:
                try:
                    updated_obj = Parca.objects.get(pk=obj.pk)
                    updated_obj.parca_tipi_id = new_parca_tipi_id
                    updated_obj.clean()
                except ValidationError as e:
                    self.message = str(e)
                    return False
            kullanici_takimlari = Takim.objects.filter(kullanicitakim__kullanici=request.user)
            if obj.parca_tipi.sorumlu_takim not in kullanici_takimlari:
                self.message = "Bu parçayı düzenleme yetkiniz yok."
                return False
        elif request.method == 'DELETE':
            kullanici_takimlari = Takim.objects.filter(kullanicitakim__kullanici=request.user)
            if obj.parca_tipi.sorumlu_takim not in kullanici_takimlari:
                self.message = "Bu parçayı silme yetkiniz yok."
                return False

        return True