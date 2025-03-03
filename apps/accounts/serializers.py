from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.accounts.models import Kullanici


class KullaniciSerializer(serializers.ModelSerializer):
    takim_listesi = serializers.SerializerMethodField()
    tam_ad = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = Kullanici
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'tam_ad', 'takim_listesi', 'date_joined', 'last_login'
        ]
        read_only_fields = ['date_joined', 'last_login']

    def get_takim_listesi(self, obj):
        # Kullanıcının takımlarını döndür
        return [
            {'id': kt.takim.id, 'ad': kt.takim.ad, 'takim_tipi': kt.takim.takim_tipi}
            for kt in obj.kullanicitakim_set.select_related('takim')
        ]


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("Kullanıcı hesabı aktif değil.")
                data['user'] = user
                return data
            raise serializers.ValidationError("Geçersiz kullanıcı adı veya parola.")
        raise serializers.ValidationError("Kullanıcı adı ve parola gerekli.")


class KullaniciOlusturSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = Kullanici
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'confirm_password'
        ]

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError("Parolalar eşleşmiyor.")
        return data

    def create(self, validated_data):
        user = Kullanici.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password']
        )
        return user