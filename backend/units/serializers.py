from django.utils import timezone
from rest_framework import serializers

from .models import Assignment, RevisionMaterial, Submission, Unit

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _validate_file(file):
    """Validate file size and magic bytes (PDF = %PDF, DOCX = PK\\x03\\x04)."""
    if file.size > MAX_FILE_SIZE:
        raise serializers.ValidationError("File size must not exceed 10 MB.")

    # Always check filename extension first
    name = file.name.lower()
    if not (name.endswith('.pdf') or name.endswith('.docx')):
        raise serializers.ValidationError(
            "Only PDF and DOCX files are allowed (invalid extension)."
        )

    header = file.read(8)
    file.seek(0)
    is_pdf = header[:4] == b'%PDF'
    # DOCX/ZIP starts with PK\x03\x04 but we also verify the extension above
    is_docx = header[:4] == b'PK\x03\x04'
    if not (is_pdf or is_docx):
        raise serializers.ValidationError(
            "Only PDF or DOCX files are allowed (invalid file signature)."
        )
    return file


class UnitSerializer(serializers.ModelSerializer):
    lecturer_name = serializers.CharField(source='lecturer.get_full_name', read_only=True)
    lecturer = serializers.PrimaryKeyRelatedField(read_only=True, required=False)
    assignment_count = serializers.SerializerMethodField()
    total_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = ['id', 'name', 'code', 'lecturer', 'lecturer_name', 'assignment_count', 'total_enrolled', 'created_at']
        read_only_fields = ['id', 'created_at', 'lecturer']

    def validate_code(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Unit code is required.")
        if Unit.objects.filter(code=value).exists():
            raise serializers.ValidationError("A unit with this code already exists.")
        return value

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Unit name is required.")
        return value

    def get_assignment_count(self, obj):
        return obj.assignments.count()

    def get_total_enrolled(self, obj):
        return obj.enrolled_students.count()


class AssignmentSerializer(serializers.ModelSerializer):
    submission_count = serializers.SerializerMethodField()
    total_enrolled = serializers.SerializerMethodField()
    user_submission = serializers.SerializerMethodField()
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'unit', 'unit_code', 'unit_name',
            'deadline', 'file', 'created_at', 'submission_count', 
            'total_enrolled', 'user_submission',
        ]
        read_only_fields = ['created_at', 'unit', 'unit_code', 'unit_name']

    def get_file(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_submission_count(self, obj):
        return obj.submissions.count()

    def get_total_enrolled(self, obj):
        return obj.unit.enrolled_students.count()

    def get_user_submission(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user') or request.user.is_anonymous:
            return None
        submission = obj.submissions.filter(student=request.user).first()
        if submission:
            return SubmissionSerializer(submission, context=self.context).data
        return None

    def validate_file(self, value):
        return _validate_file(value)

    def validate_deadline(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Deadline must be in the future.")
        return value


class RevisionMaterialSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    unit_code = serializers.CharField(source='unit.code', read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = RevisionMaterial
        fields = [
            'id', 'title', 'unit', 'unit_code', 'file',
            'description', 'uploaded_by', 'uploaded_by_name', 'uploaded_at',
        ]
        read_only_fields = ['uploaded_at', 'uploaded_by', 'unit', 'unit_code']

    def get_file(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def validate_file(self, value):
        return _validate_file(value)


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    unit_code = serializers.CharField(source='assignment.unit.code', read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = [
            'id', 'student', 'student_name', 'assignment', 'assignment_title',
            'unit_code', 'file', 'submitted_at', 'similarity_score',
        ]
        read_only_fields = ['submitted_at', 'student', 'similarity_score', 'unit_code']

    def get_file(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def validate_file(self, value):
        return _validate_file(value)

    def validate(self, attrs):
        assignment = attrs.get('assignment')
        if assignment and assignment.deadline < timezone.now():
            raise serializers.ValidationError(
                {'detail': 'Submission deadline has passed.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)
