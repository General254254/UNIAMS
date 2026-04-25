import io
import zipfile

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Assignment, RevisionMaterial, Submission, Unit
from .scoping import (
    get_assignments_for_user,
    get_submissions_for_user,
    get_units_for_user,
)
from .serializers import (
    AssignmentSerializer,
    RevisionMaterialSerializer,
    SubmissionSerializer,
    UnitSerializer,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _is_unit_lecturer(user, unit):
    return user.role == 'lecturer' and unit.lecturer == user


def _is_unit_lecturer_or_rep(user, unit):
    """Lecturer owns the unit, or rep is enrolled in it."""
    if user.role == 'lecturer':
        return unit.lecturer == user
    if user.role == 'rep':
        return user.enrolled_units.filter(id=unit.id).exists()
    return False


def _check_unit_access(user, unit_id):
    """Return unit if user may access it, else raise 404."""
    return get_object_or_404(get_units_for_user(user), id=unit_id)


# ── Unit endpoints ────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def unit_list(request):
    if request.method == 'GET':
        units = get_units_for_user(request.user).prefetch_related('assignments')
        return Response(UnitSerializer(units, many=True, context={'request': request}).data)
    
    if request.method == 'POST':
        if request.user.role != 'lecturer':
            return Response({'detail': 'Only lecturers can create units.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = UnitSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(lecturer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def all_units(request):
    """Return all units so students can discover and enroll."""
    return Response(UnitSerializer(Unit.objects.all(), many=True, context={'request': request}).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_unit(request, unit_id):
    """Allow students to enroll in a unit."""
    unit = get_object_or_404(Unit, id=unit_id)

    # Lecturers cannot enroll - they own units instead
    if request.user.role == 'lecturer':
        return Response(
            {'detail': 'Lecturers cannot enroll in units. Create or own a unit instead.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if already enrolled
    if request.user.enrolled_units.filter(id=unit.id).exists():
        return Response(
            {'detail': 'Already enrolled in this unit.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Cannot enroll in a unit you teach
    if unit.lecturer == request.user:
        return Response(
            {'detail': 'Cannot enroll in a unit you teach.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    request.user.enrolled_units.add(unit)
    return Response({'detail': 'Enrolled successfully.'}, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unit_detail(request, unit_id):
    unit = _check_unit_access(request.user, unit_id)
    return Response(UnitSerializer(unit, context={'request': request}).data)


# ── Assignment endpoints ──────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def assignment_list_create(request, unit_id):
    unit = _check_unit_access(request.user, unit_id)

    if request.method == 'GET':
        data = AssignmentSerializer(unit.assignments.all(), many=True, context={'request': request}).data
        return Response(data)

    # POST — lecturer or rep of this unit
    if not _is_unit_lecturer_or_rep(request.user, unit):
        return Response(
            {'detail': 'Only the unit lecturer or class rep can create assignments.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    serializer = AssignmentSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save(unit=unit)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def assignment_detail(request, unit_id, assignment_id):
    unit = _check_unit_access(request.user, unit_id)
    assignment = get_object_or_404(Assignment, id=assignment_id, unit=unit)

    if request.method == 'GET':
        return Response(AssignmentSerializer(assignment, context={'request': request}).data)

    if not _is_unit_lecturer(request.user, unit):
        return Response(
            {'detail': 'Only the unit lecturer can modify assignments.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'PATCH':
        serializer = AssignmentSerializer(assignment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # DELETE
    assignment.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Revision material endpoints ───────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def revision_list_create(request, unit_id):
    unit = _check_unit_access(request.user, unit_id)

    if request.method == 'GET':
        data = RevisionMaterialSerializer(unit.revision_materials.all(), many=True, context={'request': request}).data
        return Response(data)

    if not _is_unit_lecturer_or_rep(request.user, unit):
        return Response(
            {'detail': 'Only the unit lecturer or class rep can upload revision materials.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    serializer = RevisionMaterialSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(unit=unit, uploaded_by=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def revision_detail(request, unit_id, revision_id):
    unit = _check_unit_access(request.user, unit_id)
    revision = get_object_or_404(RevisionMaterial, id=revision_id, unit=unit)

    if request.method == 'GET':
        return Response(RevisionMaterialSerializer(revision, context={'request': request}).data)

    if not _is_unit_lecturer(request.user, unit):
        return Response(
            {'detail': 'Only the unit lecturer can delete revision materials.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    revision.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── Submission endpoints ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def submission_create(request):
    if request.user.role != 'student':
        return Response(
            {'detail': 'Only students can submit assignments.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = SubmissionSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    assignment = serializer.validated_data['assignment']

    # Deadline guard
    if assignment.deadline < timezone.now():
        return Response(
            {'detail': 'Submission deadline has passed.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Unit enrollment guard
    if not request.user.enrolled_units.filter(id=assignment.unit.id).exists():
        return Response(
            {'detail': 'You are not enrolled in this unit.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_submissions(request):
    subs = (
        get_submissions_for_user(request.user)
        .select_related('assignment', 'assignment__unit', 'student')
    )
    return Response(SubmissionSerializer(subs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def assignment_submissions(request, unit_id, assignment_id):
    unit = _check_unit_access(request.user, unit_id)

    if request.user.role not in ['rep', 'lecturer']:
        return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
    if request.user.role == 'lecturer' and unit.lecturer != request.user:
        return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    assignment = get_object_or_404(Assignment, id=assignment_id, unit=unit)
    subs = Submission.objects.filter(assignment=assignment).select_related('student')
    return Response(SubmissionSerializer(subs, many=True, context={'request': request}).data)


# ── ZIP download ──────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_submissions_zip(request, unit_id, assignment_id):
    unit = _check_unit_access(request.user, unit_id)

    if request.user.role not in ['rep', 'lecturer']:
        return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
    if request.user.role == 'lecturer' and unit.lecturer != request.user:
        return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    assignment = get_object_or_404(Assignment, id=assignment_id, unit=unit)
    submissions = Submission.objects.filter(assignment=assignment).select_related('student')

    if not submissions.exists():
        return Response({'detail': 'No submissions yet.'}, status=status.HTTP_204_NO_CONTENT)

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for sub in submissions:
            name = sub.student.get_full_name().replace(' ', '_') or sub.student.username
            ext = sub.file.name.rsplit('.', 1)[-1] if '.' in sub.file.name else 'pdf'
            try:
                zf.write(sub.file.path, f"{name}.{ext}")
            except (FileNotFoundError, OSError):
                continue

    buffer.seek(0)
    zip_name = f"{unit.code}_{assignment.title}_submissions.zip".replace(' ', '_')
    response = HttpResponse(buffer.read(), content_type='application/zip')
    response['Content-Disposition'] = f'attachment; filename="{zip_name}"'
    return response


# ── Plagiarism report ─────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_plagiarism_check(request, unit_id, assignment_id):
    from plagiarism.extractor import extract_text
    from plagiarism.similarity import compute_similarity_matrix

    unit = _check_unit_access(request.user, unit_id)
    if not _is_unit_lecturer(request.user, unit):
        return Response({'detail': 'Only lecturers can run plagiarism checks.'}, status=status.HTTP_403_FORBIDDEN)

    assignment = get_object_or_404(Assignment, id=assignment_id, unit=unit)
    submissions = list(Submission.objects.filter(assignment=assignment).select_related('student'))

    if len(submissions) < 2:
        return Response({'detail': 'Need at least 2 submissions to compare.'}, status=status.HTTP_400_BAD_REQUEST)

    texts = [extract_text(sub.file.path) for sub in submissions]
    matrix = compute_similarity_matrix(texts)

    for i in range(len(submissions)):
        max_score = 0.0
        for j in range(len(submissions)):
            if i != j:
                max_score = max(max_score, float(matrix[i][j]))
        
        sub = submissions[i]
        sub.similarity_score = max_score
        sub.save(update_fields=['similarity_score'])

    return Response({'detail': f'Plagiarism check completed for {len(submissions)} submissions.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def plagiarism_report(request, unit_id, assignment_id):
    from plagiarism.extractor import extract_text
    from plagiarism.similarity import compute_similarity_matrix

    unit = _check_unit_access(request.user, unit_id)

    if not _is_unit_lecturer(request.user, unit):
        return Response(
            {'detail': 'Only the unit lecturer can view plagiarism reports.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    assignment = get_object_or_404(Assignment, id=assignment_id, unit=unit)
    submissions = list(
        Submission.objects.filter(assignment=assignment).select_related('student')
    )

    if len(submissions) < 2:
        return Response({
            'assignment': assignment.title,
            'unit': unit.code,
            'submissions': SubmissionSerializer(submissions, many=True).data,
            'threshold': 0.75,
            'pairs': [],
            'flagged_count': 0,
        })

    texts = []
    for sub in submissions:
        try:
            text = extract_text(sub.file.path) if sub.file else ''
        except Exception:
            text = ''
        texts.append(text)

    matrix = compute_similarity_matrix(texts)

    THRESHOLD = 0.75
    pairs = []
    flagged_count = 0
    for i in range(len(submissions)):
        for j in range(i + 1, len(submissions)):
            score = float(matrix[i][j])
            pair = {
                'student_a': submissions[i].student.get_full_name() or submissions[i].student.username,
                'student_b': submissions[j].student.get_full_name() or submissions[j].student.username,
                'score': round(score, 4),
                'flagged': score >= THRESHOLD,
            }
            pairs.append(pair)
            if score >= THRESHOLD:
                flagged_count += 1

    return Response({
        'assignment': assignment.title,
        'unit': unit.code,
        'submissions': SubmissionSerializer(submissions, many=True).data,
        'threshold': THRESHOLD,
        'pairs': pairs,
        'flagged_count': flagged_count,
    })
