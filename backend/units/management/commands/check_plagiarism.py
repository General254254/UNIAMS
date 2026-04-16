import logging

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check plagiarism for submissions within a specific assignment (unit-scoped).'

    def add_arguments(self, parser):
        parser.add_argument('--unit', type=int, required=True, help='Unit ID')
        parser.add_argument('--assignment', type=int, required=True, help='Assignment ID')

    def handle(self, *args, **options):
        from plagiarism.extractor import extract_text
        from plagiarism.similarity import compute_similarity_matrix
        from units.models import Assignment, Submission

        unit_id = options['unit']
        assignment_id = options['assignment']

        try:
            assignment = (
                Assignment.objects
                .select_related('unit', 'unit__lecturer')
                .get(id=assignment_id, unit_id=unit_id)
            )
        except Assignment.DoesNotExist:
            self.stdout.write(self.style.ERROR(
                f"Assignment {assignment_id} not found in unit {unit_id}."
            ))
            return

        submissions = list(
            Submission.objects.filter(assignment=assignment).select_related('student')
        )

        if len(submissions) < 2:
            self.stdout.write(self.style.WARNING('Need at least 2 submissions to compare.'))
            return

        self.stdout.write(f"\nExtracting text from {len(submissions)} submissions…")
        texts = []
        for sub in submissions:
            try:
                text = extract_text(sub.file.path)
            except Exception:
                text = ''
            texts.append(text)

        matrix = compute_similarity_matrix(texts)

        THRESHOLD = 0.75
        header = f"\n{'Student A':<30} {'Student B':<30} {'Score':>8}"
        self.stdout.write(header)
        self.stdout.write('-' * 72)

        flagged_pairs = []

        for i in range(len(submissions)):
            for j in range(i + 1, len(submissions)):
                score = float(matrix[i][j])
                name_a = submissions[i].student.get_full_name() or submissions[i].student.username
                name_b = submissions[j].student.get_full_name() or submissions[j].student.username

                # Persist highest score
                for sub in [submissions[i], submissions[j]]:
                    if sub.similarity_score is None or score > sub.similarity_score:
                        sub.similarity_score = score
                        sub.save(update_fields=['similarity_score'])

                line = f"{name_a:<30} {name_b:<30} {score:>8.2%}"
                if score >= THRESHOLD:
                    self.stdout.write(self.style.ERROR(f"⚠  {line}"))
                    flagged_pairs.append((name_a, name_b, score))
                else:
                    self.stdout.write(line)

        if flagged_pairs:
            lecturer = assignment.unit.lecturer
            body = (
                f"Plagiarism alert for {assignment.unit.code} — {assignment.title}:\n\n"
            )
            for a, b, s in flagged_pairs:
                body += f"  • {a} vs {b}: {s:.2%}\n"

            send_mail(
                subject=f"[AMS] Plagiarism Alert — {assignment.title}",
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[lecturer.email],
                fail_silently=True,
            )
            self.stdout.write(self.style.WARNING(
                f"\n{len(flagged_pairs)} flagged pair(s). Alert emailed to {lecturer.email}."
            ))
        else:
            self.stdout.write(self.style.SUCCESS('\nNo plagiarism detected above threshold.'))
