from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class AircraftsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.aircrafts'
    verbose_name = _('Uçaklar')

    def ready(self):
        import  apps.aircrafts.signals