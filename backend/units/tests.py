import tempfile
import os
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework import status

from units.models import Unit, Assignment, Submission

User = get_user_model()


class UnitModelTests(TestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(
            username='lecturer',
            email='lecturer@example.com',
            password='pass123',
            first_name='Dr',
            last_name='Smith',
            role='lecturer'
        )
        self.student = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='pass123',
            first_name='Student',
            last_name='One',
            role='student'
        )
        self.unit = Unit.objects.create(
            name='Test Unit',
            code='UNIT101',
            lecturer=self.lecturer
        )
        self.student.enrolled_units.add(self.unit)

    def test_unit_str(self):
        self.assertEqual(str(self.unit), 'UNIT101 — Test Unit')

    def test_assignment_deadline_validation(self):
        from django.core.exceptions import ValidationError
        past = timezone.now() - timedelta(days=1)
        assignment = Assignment(
            title='Test',
            description='Test desc',
            unit=self.unit,
            deadline=past
        )
        with self.assertRaises(ValidationError):
            assignment.clean()


class ScopingTests(TestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(
            username='lecturer',
            email='lecturer@example.com',
            password='pass123',
            role='lecturer'
        )
        self.student = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='pass123',
            role='student'
        )
        self.unit = Unit.objects.create(
            name='Test Unit',
            code='UNIT101',
            lecturer=self.lecturer
        )
        self.student.enrolled_units.add(self.unit)

    def test_get_units_for_lecturer(self):
        from units.scoping import get_units_for_user
        units = get_units_for_user(self.lecturer)
        self.assertEqual(units.count(), 1)

    def test_get_units_for_student(self):
        from units.scoping import get_units_for_user
        units = get_units_for_user(self.student)
        self.assertEqual(units.count(), 1)

    def test_get_submissions_for_student(self):
        from units.scoping import get_submissions_for_user
        subs = get_submissions_for_user(self.student)
        self.assertEqual(subs.count(), 0)


class APIViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.lecturer = User.objects.create_user(
            username='lecturer',
            email='lecturer@example.com',
            password='pass123',
            role='lecturer'
        )
        self.student = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='pass123',
            role='student'
        )
        self.unit = Unit.objects.create(
            name='Test Unit',
            code='UNIT101',
            lecturer=self.lecturer
        )
        self.student.enrolled_units.add(self.unit)

    def test_unit_list_requires_auth(self):
        response = self.client.get('/api/units/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class FileUploadTests(TestCase):
    def setUp(self):
        self.lecturer = User.objects.create_user(
            username='lecturer',
            email='lecturer@example.com',
            password='pass123',
            role='lecturer'
        )
        self.unit = Unit.objects.create(
            name='Test Unit',
            code='UNIT101',
            lecturer=self.lecturer
        )

    def test_file_validation_rejects_invalid_extension(self):
        from units.serializers import _validate_file
        from rest_framework.exceptions import ValidationError

        class MockFile:
            def __init__(self, name='test.txt'):
                self.name = name
                self.size = 1024
                self._content = b'some content'
                self._pos = 0

            def read(self, n):
                result = self._content[self._pos:self._pos+n]
                self._pos += n
                return result

            def seek(self, pos):
                self._pos = pos

        mock_file = MockFile('virus.exe')
        with self.assertRaises(ValidationError) as ctx:
            _validate_file(mock_file)
        self.assertIn('extension', str(ctx.exception).lower())

    def test_file_validation_accepts_pdf(self):
        from units.serializers import _validate_file

        class MockFile:
            name = 'test.pdf'
            size = 1024

            def read(self, n):
                return b'%PDF-1.4'

            def seek(self, pos):
                pass

        mock_file = MockFile()
        try:
            _validate_file(mock_file)
        except Exception:
            self.fail('Should accept PDF with correct magic bytes')
