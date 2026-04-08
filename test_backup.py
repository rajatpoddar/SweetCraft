#!/usr/bin/env python3
"""
Backup System Test Script
Run this to verify your backup configuration
"""

import os
import sys
from backup_manager import BackupManager
from dotenv import load_dotenv

load_dotenv()

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def test_backup_system():
    print_header("🔍 BACKUP SYSTEM DIAGNOSTIC")
    
    # 1. Check environment
    print("\n1️⃣ Checking Environment Variables...")
    db_uri = os.getenv('DB_URI', '')
    if not db_uri:
        print("   ❌ DB_URI not set in .env file")
        return False
    
    is_postgres = db_uri.startswith('postgresql')
    print(f"   ✅ Database Type: {'PostgreSQL' if is_postgres else 'SQLite'}")
    print(f"   📝 DB_URI: {db_uri[:30]}...")
    
    # 2. Check PostgreSQL tools (if using postgres)
    if is_postgres:
        print("\n2️⃣ Checking PostgreSQL Client Tools...")
        import subprocess
        try:
            result = subprocess.run(['pg_dump', '--version'], 
                                  capture_output=True, text=True, check=True)
            print(f"   ✅ pg_dump found: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("   ❌ pg_dump NOT FOUND!")
            print("   📦 Install: sudo apt-get install postgresql-client")
            return False
        
        try:
            result = subprocess.run(['pg_restore', '--version'], 
                                  capture_output=True, text=True, check=True)
            print(f"   ✅ pg_restore found: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("   ❌ pg_restore NOT FOUND!")
            return False
    
    # 3. Check backup directory
    print("\n3️⃣ Checking Backup Directory...")
    backup_dir = 'backups'
    if not os.path.exists(backup_dir):
        print(f"   ⚠️  Creating backup directory: {backup_dir}")
        os.makedirs(backup_dir, exist_ok=True)
    
    if os.access(backup_dir, os.W_OK):
        print(f"   ✅ Backup directory writable: {os.path.abspath(backup_dir)}")
    else:
        print(f"   ❌ Backup directory NOT writable!")
        return False
    
    # 4. Initialize backup manager
    print("\n4️⃣ Initializing Backup Manager...")
    try:
        manager = BackupManager()
        print("   ✅ Backup Manager initialized")
    except Exception as e:
        print(f"   ❌ Failed to initialize: {e}")
        return False
    
    # 5. Check existing backups
    print("\n5️⃣ Checking Existing Backups...")
    backups = manager.list_backups()
    if backups:
        print(f"   📦 Found {len(backups)} existing backup(s):")
        for b in backups[:3]:  # Show first 3
            print(f"      • {b['filename']} ({b['size_kb']:.2f} KB) - {b['created']}")
    else:
        print("   ℹ️  No existing backups found")
    
    # 6. Get stats
    stats = manager.get_backup_stats()
    print(f"\n   📊 Backup Statistics:")
    print(f"      Total Backups: {stats['total_backups']}")
    print(f"      Total Size: {stats['total_size_mb']} MB")
    print(f"      Retention: {stats['retention_days']} days")
    
    # 7. Test database connection (for PostgreSQL)
    if is_postgres:
        print("\n6️⃣ Testing Database Connection...")
        try:
            from urllib.parse import urlparse
            import subprocess
            parsed = urlparse(db_uri)
            env = os.environ.copy()
            env['PGPASSWORD'] = parsed.password or ''
            
            cmd = [
                'psql',
                '-h', parsed.hostname or 'localhost',
                '-p', str(parsed.port or 5432),
                '-U', parsed.username or 'postgres',
                '-d', parsed.path.lstrip('/'),
                '-c', 'SELECT version();'
            ]
            
            result = subprocess.run(cmd, env=env, capture_output=True, 
                                  text=True, timeout=10)
            
            if result.returncode == 0:
                print("   ✅ Database connection successful")
            else:
                print(f"   ❌ Database connection failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"   ❌ Connection test failed: {e}")
            return False
    
    # 8. Create test backup
    print("\n7️⃣ Creating Test Backup...")
    print("   ⏳ This may take a few seconds...")
    try:
        backup_path = manager.create_backup()
        if backup_path:
            size_kb = os.path.getsize(backup_path) / 1024
            print(f"   ✅ Test backup created successfully!")
            print(f"   📁 Location: {backup_path}")
            print(f"   📊 Size: {size_kb:.2f} KB")
        else:
            print("   ❌ Backup creation failed (check logs)")
            return False
    except Exception as e:
        print(f"   ❌ Backup failed: {e}")
        return False
    
    # 9. Final summary
    print_header("✅ BACKUP SYSTEM STATUS: OPERATIONAL")
    print("\n📋 Summary:")
    print("   • Database connection: ✅ Working")
    print("   • Backup tools: ✅ Installed")
    print("   • Backup directory: ✅ Writable")
    print("   • Test backup: ✅ Created")
    print("\n🎉 Your backup system is fully functional!")
    print("\n📚 Next Steps:")
    print("   1. Backups will run automatically daily at 2:00 AM")
    print("   2. Old backups (>15 days) will be auto-deleted")
    print("   3. Check BACKUP_GUIDE.md for restore instructions")
    print("   4. Consider setting up offsite backup storage")
    
    return True

if __name__ == '__main__':
    try:
        success = test_backup_system()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
