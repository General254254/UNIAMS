from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('rep', 'Class Representative'),
        ('lecturer', 'Lecturer'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    enrolled_units = models.ManyToManyField(
        'units.Unit',
        blank=True,
        related_name='enrolled_students',
    )

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
