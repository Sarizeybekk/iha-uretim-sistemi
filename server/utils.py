
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.utils.translation import gettext as _
from django.db import IntegrityError, transaction


def custom_exception_handler(exc, context):
    """
    Özel istisna işleyici.
    """
    response = exception_handler(exc, context)

    # Eğer DRF işleyicisi bir yanıt döndürmediyse
    if response is None:
        if isinstance(exc, IntegrityError):
            # Veritabanı bütünlük hatalarını (benzersizlik vb.) işle
            return Response(
                {'detail': _('Veritabanı bütünlük hatası: {}'.format(str(exc)))},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'detail': _('Beklenmeyen bir hata oluştu.')},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # DRF işleyicisi zaten bir Response döndürdüyse, özelleştirilebilir
    return response


def atomic_transaction(func):
    """
    Bir fonksiyonu atomik bir işlem olarak çalıştıran dekoratör.
    """

    def wrapped(*args, **kwargs):
        with transaction.atomic():
            return func(*args, **kwargs)

    return wrapped


class EnumChoices:
    """
    Django model alanları için kolayca kullanılabilir enum seçenekleri.
    """

    @classmethod
    def choices(cls):
        return [(key, value) for key, value in vars(cls).items() if not key.startswith('_')]

    @classmethod
    def values(cls):
        return [key for key, value in vars(cls).items() if not key.startswith('_')]

    @classmethod
    def display_dict(cls):
        return {key: value for key, value in vars(cls).items() if not key.startswith('_')}