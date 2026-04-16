from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


# ── Upload path callables ──────────────────────────────────────────────────────

def assignment_upload_path(instance, filename):
    return f"units/{instance.unit.id}/assignments/{filename}"


def revision_upload_path(instance, filename):
    return f"units/{instance.unit.id}/revisions/{filename}"


def submission_upload_path(instance, filename):
    return (
        f"units/{instance.assignment.unit.id}"
        f"/submissions/{instance.assignment.id}"
        f"/{instance.student.id}/{filename}"
    )


# ── Models ────────────────────────────────────────────────────────────────────

class Unit(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    lecturer = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='units_taught',
        limit_choices_to={'role': 'lecturer'},
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.code} — {self.name}"


class Assignment(models.Model):
    title = models.CharField(max_length=300)
    description = models.TextField()
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='assignments')
    deadline = models.DateTimeField()
    file = models.FileField(upload_to=assignment_upload_path)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['unit', 'deadline']),
        ]

    def clean(self):
        if self.deadline and self.deadline <= timezone.now():
            raise ValidationError("Deadline must be in the future.")

    def __str__(self):
        return f"{self.title} ({self.unit.code})"


class RevisionMaterial(models.Model):
    title = models.CharField(max_length=300)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='revision_materials')
    file = models.FileField(upload_to=revision_upload_path)
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='revision_materials_uploaded',
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} — {self.unit.code}"


class Submission(models.Model):
    student = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='submissions',
        limit_choices_to={'role': 'student'},
    )
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    file = models.FileField(upload_to=submission_upload_path)
    submitted_at = models.DateTimeField(auto_now_add=True)
    similarity_score = models.FloatField(null=True, blank=True)

    class Meta:
        unique_together = [['student', 'assignment']]
        indexes = [
            models.Index(fields=['assignment', 'student']),
        ]
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.get_full_name()} → {self.assignment.title}"
