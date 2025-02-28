
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.contrib.auth import authenticate, login, logout
from .models import Kullanici
from .serializers import KullaniciSerializer, LoginSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class KullaniciViewSet(viewsets.ModelViewSet):
    queryset = Kullanici.objects.all()
    serializer_class = KullaniciSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':  # Register
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def profile(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class LoginView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        request_body=LoginSerializer,
        responses={
            200: openapi.Response('Başarılı giriş', KullaniciSerializer),
            400: 'Geçersiz girdi',
            401: 'Kimlik doğrulama başarısız'
        },
        operation_description="Kullanıcı girişi yapma"
    )

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request, user)
                return Response({
                    'message': 'Giriş başarılı',
                    'user': KullaniciSerializer(user).data
                })
            return Response({'error': 'Geçersiz kullanıcı adı veya şifre'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'message': 'Başarıyla çıkış yapıldı'}, status=status.HTTP_200_OK)
