from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TakimViewSet, KullaniciTakimViewSet

router = DefaultRouter()
router.register(r'takimlar', TakimViewSet)
router.register(r'kullanici-takimlar', KullaniciTakimViewSet)

urlpatterns = [
    path('', include(router.urls)),
]