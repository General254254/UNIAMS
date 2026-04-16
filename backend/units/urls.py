from django.urls import path

from . import views

urlpatterns = [
    # Units
    path('units/', views.unit_list, name='unit-list'),
    path('units/all/', views.all_units, name='all-units'),
    path('units/<int:unit_id>/', views.unit_detail, name='unit-detail'),
    path('units/<int:unit_id>/enroll/', views.enroll_unit, name='enroll-unit'),

    # Assignments
    path('units/<int:unit_id>/assignments/', views.assignment_list_create, name='assignment-list'),
    path('units/<int:unit_id>/assignments/<int:assignment_id>/', views.assignment_detail, name='assignment-detail'),
    path('units/<int:unit_id>/assignments/<int:assignment_id>/submissions/', views.assignment_submissions, name='assignment-submissions'),
    path('units/<int:unit_id>/assignments/<int:assignment_id>/download-zip/', views.download_submissions_zip, name='download-zip'),
    path('units/<int:unit_id>/assignments/<int:assignment_id>/plagiarism-report/', views.plagiarism_report, name='plagiarism-report'),
    path('units/<int:unit_id>/assignments/<int:assignment_id>/check-plagiarism/', views.trigger_plagiarism_check, name='check-plagiarism'),

    # Revision Materials
    path('units/<int:unit_id>/revisions/', views.revision_list_create, name='revision-list'),
    path('units/<int:unit_id>/revisions/<int:revision_id>/', views.revision_detail, name='revision-detail'),

    # Submissions
    path('submissions/', views.submission_create, name='submission-create'),
    path('submissions/mine/', views.my_submissions, name='my-submissions'),
]
