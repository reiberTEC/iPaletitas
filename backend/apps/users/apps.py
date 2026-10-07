from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"           # ← importante: ruta completa
    verbose_name = "Usuarios"