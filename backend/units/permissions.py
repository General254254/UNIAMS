from rest_framework.permissions import BasePermission


class IsLecturer(BasePermission):
    """Allow access only to users with the 'lecturer' role."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'lecturer'
        )


class IsRepOrLecturer(BasePermission):
    """Allow access to class reps and lecturers."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ['rep', 'lecturer']
        )


class IsEnrolledInUnit(BasePermission):
    """
    Object-level: the user must be enrolled in the unit related to the object.
    Resolves unit from obj.unit or obj.assignment.unit.
    Lecturers pass only if they own the unit.
    """

    def has_object_permission(self, request, view, obj):
        unit = getattr(obj, 'unit', None)
        if unit is None and hasattr(obj, 'assignment'):
            unit = getattr(obj.assignment, 'unit', None)
        if unit is None:
            return False
        if request.user.role == 'lecturer':
            return unit.lecturer == request.user
        return request.user.enrolled_units.filter(id=unit.id).exists()


class IsLecturerOfUnit(BasePermission):
    """Object-level: only the lecturer who owns the unit may write."""

    def has_object_permission(self, request, view, obj):
        unit = getattr(obj, 'unit', None)
        return bool(unit and unit.lecturer == request.user)
