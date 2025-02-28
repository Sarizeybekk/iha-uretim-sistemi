"""
URL configuration for server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin

from django.urls import path,re_path,include
from drf_yasg import openapi
from rest_framework import permissions
from drf_yasg.views import get_schema_view
schema_view = get_schema_view(
   openapi.Info(
      title="IHA URETIM SISTEMI API",
      default_version='v1',
      description="Your API description",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/accounts/', include('apps.accounts.urls')),
    path('api/teams/',include('apps.teams.urls')),
    path('api/parts/', include('apps.parts.urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/aircrafts/', include('apps.aircrafts.urls')),



    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
]
