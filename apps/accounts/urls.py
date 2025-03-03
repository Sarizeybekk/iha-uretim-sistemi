from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import KullaniciViewSet, LoginView, LogoutView, RegisterView

router = DefaultRouter()
router.register(r'kullanicilar', KullaniciViewSet)

urlpatterns = [
    path('auth/', include([
        path('login/', LoginView.as_view(), name='login'),
        path('logout/', LogoutView.as_view(), name='logout'),
        path('register/', RegisterView.as_view(), name='register'),
    ])),
    path('', include(router.urls)),
]