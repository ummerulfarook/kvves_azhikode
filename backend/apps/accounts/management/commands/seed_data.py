"""
Django management command to bootstrap the first admin user and seed initial data.

Usage:
    python manage.py seed_data
    python manage.py seed_data --reset    (clears and re-seeds)
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Seeds the database with initial data (admin user, sample members if needed)'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            from apps.members.models import Member
            Member.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('Cleared.'))

        with transaction.atomic():
            # Create/Reset admin
            admin_user = User.objects.filter(username='admin').first()
            if not admin_user:
                admin_user = User.objects.create_superuser(
                    username='admin',
                    email='admin@kvva.local',
                    password='kvva@admin2024',
                    first_name='Admin',
                    last_name='KVVA',
                    role='admin',
                )
                self.stdout.write(self.style.SUCCESS('Created admin user: admin / kvva@admin2024'))
            else:
                admin_user.set_password('kvva@admin2024')
                admin_user.is_superuser = True
                admin_user.is_staff = True
                admin_user.role = 'admin'
                admin_user.save()
                self.stdout.write(self.style.SUCCESS('Reset existing admin password to: kvva@admin2024'))

            # Create/Reset staff user
            staff_user = User.objects.filter(username='staff').first()
            if not staff_user:
                User.objects.create_user(
                    username='staff',
                    email='staff@kvva.local',
                    password='kvva@staff2024',
                    first_name='Staff',
                    last_name='User',
                    role='staff',
                )
                self.stdout.write(self.style.SUCCESS('Created staff user: staff / kvva@staff2024'))
            else:
                staff_user.set_password('kvva@staff2024')
                staff_user.role = 'staff'
                staff_user.save()
                self.stdout.write(self.style.SUCCESS('Reset existing staff password to: kvva@staff2024'))

            # Create/Reset viewer user
            viewer_user = User.objects.filter(username='viewer').first()
            if not viewer_user:
                User.objects.create_user(
                    username='viewer',
                    email='viewer@kvva.local',
                    password='kvva@view2024',
                    first_name='Viewer',
                    last_name='User',
                    role='viewer',
                )
                self.stdout.write(self.style.SUCCESS('Created viewer user: viewer / kvva@view2024'))
            else:
                viewer_user.set_password('kvva@view2024')
                viewer_user.role = 'viewer'
                viewer_user.save()
                self.stdout.write(self.style.SUCCESS('Reset existing viewer password to: kvva@view2024'))

        self.stdout.write(self.style.SUCCESS('\n[SUCCESS] Seeding complete!'))
        self.stdout.write('   Login at: http://localhost:3000/login')
        self.stdout.write('   Admin:  admin / kvva@admin2024')
        self.stdout.write('   Staff:  staff / kvva@staff2024')
        self.stdout.write('   Viewer: viewer / kvva@view2024')
