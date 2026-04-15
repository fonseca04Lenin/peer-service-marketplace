import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
        ('bookings', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='WalletTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(
                    choices=[
                        ('deposit',    'Deposit'),
                        ('withdrawal', 'Withdrawal'),
                        ('payment',    'Payment'),
                        ('earning',    'Earning'),
                        ('refund',     'Refund'),
                    ],
                    max_length=20,
                )),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('status', models.CharField(
                    choices=[
                        ('pending',   'Pending'),
                        ('completed', 'Completed'),
                        ('failed',    'Failed'),
                        ('cancelled', 'Cancelled'),
                    ],
                    default='pending',
                    max_length=20,
                )),
                ('note', models.CharField(blank=True, max_length=300)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('booking', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='wallet_transactions',
                    to='bookings.booking',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='wallet_transactions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
    ]
