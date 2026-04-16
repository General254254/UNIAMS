from django.contrib import admin

from .models import Assignment, RevisionMaterial, Submission, Unit


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'lecturer', 'created_at']
    list_filter = ['created_at']
    search_fields = ['code', 'name', 'lecturer__username', 'lecturer__email']


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'unit', 'deadline', 'created_at']
    list_filter = ['unit', 'deadline']
    search_fields = ['title', 'unit__code', 'unit__name']


@admin.register(RevisionMaterial)
class RevisionMaterialAdmin(admin.ModelAdmin):
    list_display = ['title', 'unit', 'uploaded_by', 'uploaded_at']
    list_filter = ['unit', 'uploaded_at']
    search_fields = ['title', 'unit__code', 'uploaded_by__username']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'assignment', 'submitted_at', 'similarity_score']
    list_filter = ['assignment__unit', 'submitted_at']
    search_fields = [
        'student__username', 'student__first_name', 'student__last_name',
        'assignment__title',
    ]
