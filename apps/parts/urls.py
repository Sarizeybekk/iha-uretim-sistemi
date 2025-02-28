from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParcaViewSet, ParcaTipiViewSet, ParcaDurumuViewSet

router = DefaultRouter()
router.register(r'parca-tipleri', ParcaTipiViewSet)
router.register(r'parca-durumlari', ParcaDurumuViewSet)
router.register(r'parcalar', ParcaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('toplam-parca-sayisi/', ParcaViewSet.as_view({'get': 'toplam_parca_sayisi'}), name='toplam-parca-sayisi'),
]
