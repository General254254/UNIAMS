"""
Queryset scoping helpers — always filter data to the authenticated user's units.
Never return objects from units the user is not enrolled in.
"""
from units.models import Assignment, RevisionMaterial, Submission, Unit


def get_units_for_user(user):
    """Return queryset of units visible to this user based on their role."""
    if user.role == 'lecturer':
        return Unit.objects.filter(lecturer=user)
    return user.enrolled_units.all()


def get_assignments_for_user(user):
    """Return assignments scoped to the user's units."""
    return Assignment.objects.filter(unit__in=get_units_for_user(user))


def get_revisions_for_user(user):
    """Return revision materials scoped to the user's units."""
    return RevisionMaterial.objects.filter(unit__in=get_units_for_user(user))


def get_submissions_for_user(user):
    """
    Return submissions scoped by role:
      - student  → only their own submissions
      - rep/lecturer → all submissions in their units
    """
    if user.role == 'student':
        return Submission.objects.filter(student=user)
    return Submission.objects.filter(assignment__in=get_assignments_for_user(user))
