from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParcaTipiViewSet, ParcaDurumuViewSet, ParcaViewSet

router = DefaultRouter()
router.register(r'parca-tipleri', ParcaTipiViewSet)
router.register(r'parca-durumlari', ParcaDurumuViewSet)
router.register(r'parcalar', ParcaViewSet, basename='parca')

urlpatterns = [
    path('', include(router.urls)),
]