from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class PartsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.parts'
    verbose_name = _('Parçalar')

    def ready(self):
        import apps.parts.signals

