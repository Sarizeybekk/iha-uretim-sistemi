
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnvanterViewSet

router = DefaultRouter()
router.register(r'envanter', EnvanterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]