import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))

# Read env to check if prod/dev
try:
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            env_content = f.read()
        if 'DEBUG=True' in env_content.replace(' ', ''):
            os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings.development'
        else:
            os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings.production'
    else:
        os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings.production'
except Exception:
    os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings.production'

django.setup()

from apps.accounts.models import User

def create_admin():
    print("=" * 60)
    print("  KVVES Management System — Create/Reset Admin User")
    print("=" * 60)
    print("")
    
    username = input("Enter username: ").strip()
    if not username:
        print("ERROR: Username cannot be empty.")
        return
        
    if User.objects.filter(username=username).exists():
        print(f"User '{username}' already exists.")
        confirm = input("Do you want to reset the password for this user? (y/n): ").strip().lower()
        if confirm == 'y':
            password = input("Enter new password: ").strip()
            if not password:
                print("ERROR: Password cannot be empty.")
                return
            user = User.objects.get(username=username)
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.role = 'admin'
            user.save()
            print(f"SUCCESS: Password for '{username}' has been reset.")
        return
        
    email = input("Enter email [default: admin@kvves.local]: ").strip()
    if not email:
        email = f"{username}@kvves.local"
        
    password = input("Enter password: ").strip()
    if not password:
        print("ERROR: Password cannot be empty.")
        return
        
    # Create superuser
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        first_name=username.capitalize(),
        last_name='Admin',
        role='admin'
    )
    print(f"SUCCESS: Created admin user '{username}' successfully!")

if __name__ == '__main__':
    create_admin()
