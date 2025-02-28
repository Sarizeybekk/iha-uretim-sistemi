
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import KullaniciViewSet, LoginView, LogoutView

router = DefaultRouter()
router.register(r'kullanicilar', KullaniciViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
]