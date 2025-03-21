# Generated by Django 5.0.6 on 2024-09-03 22:15

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="UserDatabase",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("schema_file", models.FileField(upload_to="schemas/")),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
