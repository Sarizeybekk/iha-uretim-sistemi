
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UcakTipiViewSet, UcakDurumuViewSet, UcakViewSet

router = DefaultRouter()
router.register(r'ucak-tipleri', UcakTipiViewSet)
router.register(r'ucak-durumlari', UcakDurumuViewSet)
router.register(r'ucaklar', UcakViewSet)

urlpatterns = [
    path('', include(router.urls)),
]