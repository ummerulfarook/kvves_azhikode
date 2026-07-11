import os
import sys
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

# Setup DJANGO_SETTINGS_MODULE
try:
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            env_content = f.read()
        cleaned_env = env_content.replace(' ', '').replace('\r', '').lower()
        if 'debug=true' in cleaned_env:
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
        else:
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.production')
    else:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.production')
except Exception:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.production')

# Bootstrap Django
import django
django.setup()

from django.conf import settings

def perform_backup():
    print("=" * 60)
    print(f"Starting Database Backup: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    db_config = settings.DATABASES['default']
    db_engine = db_config['ENGINE']
    
    # Backup directory in the project root
    backup_dir = Path(settings.BASE_DIR).parent / 'backups'
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    if 'sqlite3' in db_engine:
        db_path = Path(db_config['NAME'])
        if db_path.exists():
            backup_file = backup_dir / f"sqlite_backup_{timestamp}.db"
            shutil.copy2(db_path, backup_file)
            print(f"SUCCESS: SQLite backup created at {backup_file}")
        else:
            print(f"ERROR: SQLite database file not found at {db_path}")
            sys.exit(1)
            
    elif 'postgresql' in db_engine:
        db_name = db_config['NAME']
        db_user = db_config['USER']
        db_password = db_config.get('PASSWORD', '')
        db_host = db_config.get('HOST', 'localhost')
        db_port = db_config.get('PORT', '5432')
        
        backup_file = backup_dir / f"pg_backup_{db_name}_{timestamp}.sql"
        
        # Setup env variables for pg_dump authentication
        env = os.environ.copy()
        if db_password:
            env['PGPASSWORD'] = db_password
            
        cmd = [
            'pg_dump',
            '-h', db_host,
            '-p', str(db_port),
            '-U', db_user,
            '-F', 'c',  # Custom archive format (compressed, restorable with pg_restore)
            '-b',       # Include large objects
            '-v',       # Verbose
            '-f', str(backup_file),
            db_name
        ]
        
        try:
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"SUCCESS: PostgreSQL backup created at {backup_file}")
            else:
                print("ERROR: pg_dump utility failed.")
                print(result.stderr)
                sys.exit(1)
        except FileNotFoundError:
            print("ERROR: 'pg_dump' utility not found in system PATH.")
            print("Please ensure PostgreSQL command-line tools are installed and in system environment variables.")
            sys.exit(1)
    else:
        print(f"ERROR: Unsupported database engine: {db_engine}")
        sys.exit(1)

    # Pruning backups older than 90 days (3 months)
    print("\nCleaning up old backups...")
    MAX_AGE_DAYS = 90
    now = datetime.now()
    deleted_count = 0
    
    for file in backup_dir.glob('*_backup_*'):
        if file.is_file():
            file_age = now - datetime.fromtimestamp(file.stat().st_mtime)
            if file_age.days > MAX_AGE_DAYS:
                try:
                    file.unlink()
                    print(f"  Removed old backup: {file.name} ({file_age.days} days old)")
                    deleted_count += 1
                except Exception as e:
                    print(f"  Failed to remove old backup {file.name}: {e}")
                    
    print(f"Cleanup finished. Removed {deleted_count} old backup file(s).")
    print("=" * 60)

if __name__ == '__main__':
    perform_backup()
