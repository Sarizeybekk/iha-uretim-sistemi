
from rest_framework import permissions

class IsAdminOrSuperUser(permissions.BasePermission):
    """
    Sadece admin veya superuser'lara izin verir.
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class IsMontajTakimiUyesi(permissions.BasePermission):
    """
    Sadece montaj takımı üyelerine izin verir.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return request.user.takimlar.filter(montaj_yetkisi=True).exists()


class IsTakimUyesi(permissions.BasePermission):
    """
    Kullanıcının belirli bir takımın üyesi olup olmadığını kontrol eder.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # obj bir takım ise
        if hasattr(obj, 'uyeler'):
            return request.user in obj.uyeler.all()

        # obj bir parça ise
        if hasattr(obj, 'parca_tipi') and hasattr(obj, 'olusturan'):
            # Kendi oluşturduğu parçalara her zaman erişebilir
            if obj.olusturan == request.user:
                return True

            # Montaj takımı üyeleri tüm parçalara erişebilir
            if request.user.takimlar.filter(montaj_yetkisi=True).exists():
                return True

            # Kullanıcının takımları ile parçanın tipini karşılaştır
            kullanici_takimlari = request.user.takimlar.all()
            for takim in kullanici_takimlari:
                if takim.takim_tipi == obj.parca_tipi.ad:
                    return True

            return False

        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Nesnenin sahibine düzenleme izni verir, diğerleri sadece okuyabilir.
    """

    def has_object_permission(self, request, view, obj):
        # Okuma izinleri herkese açık
        if request.method in permissions.SAFE_METHODS:
            return True

        # Nesnenin sahibi sadece düzenleyebilir
        if hasattr(obj, 'olusturan'):
            return obj.olusturan == request.user

        # KullaniciTakim nesnesi için
        if hasattr(obj, 'kullanici'):
            return obj.kullanici == request.user

        return False


class IsAuthenticated(permissions.IsAuthenticated):
    """
    IsAuthenticated izin sınıfının üzerine özel özellikler eklenmiş versiyonu.
    """
    message = "Bu işlemi gerçekleştirmek için giriş yapmalısınız."