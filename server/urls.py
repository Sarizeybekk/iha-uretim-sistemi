from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger için şema
schema_view = get_schema_view(
    openapi.Info(
        title="Uçak Parça Yönetimi API",
        default_version='v1',
        description="Uçak parçaları ve montaj süreçleri yönetimi için API",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API URL'leri
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/parts/', include('apps.parts.urls')),
    path('api/v1/aircrafts/', include('apps.aircrafts.urls')),
    path('api/v1/teams/', include('apps.teams.urls')),
    path('api/v1/inventory/', include('apps.inventory.urls')),

    # Swagger dokümantasyonu
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
