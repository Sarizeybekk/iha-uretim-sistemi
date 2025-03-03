from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import login, logout
from django.utils.translation import gettext as _
from apps.accounts.models import Kullanici
from apps.accounts.serializers import (
    KullaniciSerializer, LoginSerializer, KullaniciOlusturSerializer
)


class KullaniciViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Kullanıcılar için salt okunur uç nokta.
    """
    queryset = Kullanici.objects.all()
    serializer_class = KullaniciSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['username', 'first_name', 'last_name', 'email']

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Giriş yapmış kullanıcının bilgilerini döndürür.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def takimlarim(self, request):
        """
        Giriş yapmış kullanıcının takımlarını döndürür.
        """
        from apps.teams.models import KullaniciTakim
        from apps.teams.serializers import KullaniciTakimSerializer

        kullanici_takimlar = KullaniciTakim.objects.filter(kullanici=request.user)
        serializer = KullaniciTakimSerializer(kullanici_takimlar, many=True)
        return Response(serializer.data)


class LoginView(APIView):
    """
    Kullanıcı girişi için API görünümü.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)

            user_serializer = KullaniciSerializer(user)
            return Response(user_serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Kullanıcı çıkışı için API görünümü.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(APIView):
    """
    Yeni kullanıcı kaydı için API görünümü.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = KullaniciOlusturSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Otomatik giriş yap
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user)

            user_serializer = KullaniciSerializer(user)
            return Response(user_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)