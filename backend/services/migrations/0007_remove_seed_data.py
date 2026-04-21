from django.db import migrations

SEED_USERNAMES = [
    "omaha_provider_1",
    "omaha_provider_2",
    "omaha_provider_3",
    "omaha_provider_4",
]


def remove_seed_data(apps, schema_editor):
    User = apps.get_model("users", "User")
    Service = apps.get_model("services", "Service")
    for username in SEED_USERNAMES:
        try:
            provider = User.objects.get(username=username)
            Service.objects.filter(provider=provider).delete()
            provider.delete()
        except User.DoesNotExist:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ("services", "0006_seed_omaha_services"),
    ]

    operations = [
        migrations.RunPython(remove_seed_data, reverse_code=migrations.RunPython.noop),
    ]
