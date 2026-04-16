import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import CustomUser
from units.models import Unit

def setup_db():
    if not CustomUser.objects.filter(username='admin').exists():
        CustomUser.objects.create_superuser('admin', 'admin@example.com', 'admin')
        print("Created superuser 'admin' with password 'admin'")
    
    if not CustomUser.objects.filter(username='student').exists():
        stu = CustomUser.objects.create_user('student', 'student@example.com', 'student')
        stu.first_name = 'Test'
        stu.last_name = 'Student'
        stu.role = 'student'
        stu.save()
        print("Created user 'student' with password 'student'")

    if not CustomUser.objects.filter(username='lecturer').exists():
        lec = CustomUser.objects.create_user('lecturer', 'lecturer@example.com', 'lecturer')
        lec.first_name = 'Test'
        lec.last_name = 'Lecturer'
        lec.role = 'lecturer'
        lec.save()
        print("Created user 'lecturer' with password 'lecturer'")

    # Seed unit
    lec = CustomUser.objects.get(username='lecturer')
    if not Unit.objects.filter(code='CS101').exists():
        u = Unit.objects.create(code='CS101', name='Intro to Computer Science', lecturer=lec)
        
        # enroll student
        stu = CustomUser.objects.get(username='student')
        stu.enrolled_units.add(u)
        print("Created Unit 'CS101' and enrolled 'student'")

if __name__ == '__main__':
    setup_db()
