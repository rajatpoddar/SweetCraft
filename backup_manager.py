"""
Automatic Database Backup Manager
Handles daily backups with 15-day retention policy
Supports both SQLite and PostgreSQL
"""

import os
import shutil
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BackupManager:
    def __init__(self, backup_dir='backups'):
        self.backup_dir = backup_dir
        self.retention_days = 15
        self.db_uri = os.getenv('DB_URI', '')
        self.is_postgres = self.db_uri.startswith('postgresql')
        
        # SQLite path (only used if not postgres)
        self.sqlite_path = 'instance/shop.db'
        
        Path(self.backup_dir).mkdir(parents=True, exist_ok=True)
        logger.info(f"Backup initialized | Mode: {'PostgreSQL' if self.is_postgres else 'SQLite'}")

    def create_backup(self):
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            if self.is_postgres:
                backup_filename = f"shop_backup_{timestamp}.sql"
                backup_path = os.path.join(self.backup_dir, backup_filename)
                self._postgres_backup(backup_path)
            else:
                if not os.path.exists(self.sqlite_path):
                    logger.error(f"SQLite DB not found: {self.sqlite_path}")
                    return None
                backup_filename = f"shop_backup_{timestamp}.db"
                backup_path = os.path.join(self.backup_dir, backup_filename)
                self._sqlite_backup(self.sqlite_path, backup_path)

            if os.path.exists(backup_path):
                size_kb = os.path.getsize(backup_path) / 1024
                logger.info(f"✅ Backup created: {backup_filename} ({size_kb:.2f} KB)")
                return backup_path
            return None

        except Exception as e:
            logger.error(f"❌ Backup failed: {e}")
            return None

    def _sqlite_backup(self, source_db, dest_db):
        import sqlite3
        src = sqlite3.connect(source_db)
        dst = sqlite3.connect(dest_db)
        try:
            with dst:
                src.backup(dst)
        finally:
            src.close()
            dst.close()

    def _postgres_backup(self, backup_path):
        """Create PostgreSQL backup using pg_dump"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(self.db_uri)
            
            # Check if pg_dump is available
            try:
                subprocess.run(['pg_dump', '--version'], capture_output=True, check=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                logger.error("❌ pg_dump not found! Install PostgreSQL client tools.")
                raise Exception("pg_dump command not available. Install postgresql-client package.")
            
            env = os.environ.copy()
            env['PGPASSWORD'] = parsed.password or ''
            
            cmd = [
                'pg_dump',
                '-h', parsed.hostname or 'localhost',
                '-p', str(parsed.port or 5432),
                '-U', parsed.username or 'postgres',
                '-d', parsed.path.lstrip('/'),
                '-F', 'c',  # Custom format (compressed)
                '-f', backup_path
            ]
            
            logger.info(f"Running pg_dump for database: {parsed.path.lstrip('/')}")
            result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                raise Exception(f"pg_dump failed: {result.stderr}")
            
            logger.info(f"✅ PostgreSQL backup completed successfully")
            
        except subprocess.TimeoutExpired:
            raise Exception("Backup timeout - database too large or connection slow")
        except Exception as e:
            logger.error(f"PostgreSQL backup error: {str(e)}")
            raise

    def cleanup_old_backups(self):
        try:
            deleted = 0
            cutoff = datetime.now() - timedelta(days=self.retention_days)
            for f in os.listdir(self.backup_dir):
                if not (f.startswith('shop_backup_') and (f.endswith('.db') or f.endswith('.sql'))):
                    continue
                fpath = os.path.join(self.backup_dir, f)
                if datetime.fromtimestamp(os.path.getmtime(fpath)) < cutoff:
                    os.remove(fpath)
                    deleted += 1
                    logger.info(f"🗑️ Deleted old backup: {f}")
            return deleted
        except Exception as e:
            logger.error(f"❌ Cleanup failed: {e}")
            return 0

    def list_backups(self):
        try:
            files = sorted(
                [f for f in os.listdir(self.backup_dir)
                 if f.startswith('shop_backup_') and (f.endswith('.db') or f.endswith('.sql'))],
                reverse=True
            )
            result = []
            for f in files:
                fpath = os.path.join(self.backup_dir, f)
                stat = os.stat(fpath)
                result.append({
                    'filename': f,
                    'path': fpath,
                    'size_kb': stat.st_size / 1024,
                    'created': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                    'age_days': (datetime.now() - datetime.fromtimestamp(stat.st_mtime)).days
                })
            return result
        except Exception as e:
            logger.error(f"❌ List failed: {e}")
            return []

    def restore_backup(self, backup_filename):
        """Restore database from backup file"""
        try:
            backup_path = os.path.join(self.backup_dir, backup_filename)
            if not os.path.exists(backup_path):
                logger.error(f"Backup not found: {backup_filename}")
                return False

            # Create safety backup before restore
            safety = f"shop_backup_before_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            logger.info(f"Creating safety backup: {safety}")
            self.create_backup()
            
            if self.is_postgres:
                # Restore PostgreSQL dump
                from urllib.parse import urlparse
                parsed = urlparse(self.db_uri)
                
                # Check if pg_restore is available
                try:
                    subprocess.run(['pg_restore', '--version'], capture_output=True, check=True)
                except (subprocess.CalledProcessError, FileNotFoundError):
                    logger.error("❌ pg_restore not found! Install PostgreSQL client tools.")
                    raise Exception("pg_restore command not available. Install postgresql-client package.")
                
                env = os.environ.copy()
                env['PGPASSWORD'] = parsed.password or ''
                
                # First, drop and recreate database (optional - for clean restore)
                # For safer restore, use --clean flag
                cmd = [
                    'pg_restore',
                    '-h', parsed.hostname or 'localhost',
                    '-p', str(parsed.port or 5432),
                    '-U', parsed.username or 'postgres',
                    '-d', parsed.path.lstrip('/'),
                    '--clean',  # Drop objects before recreating
                    '--if-exists',  # Don't error if objects don't exist
                    backup_path
                ]
                
                logger.info(f"Restoring PostgreSQL backup: {backup_filename}")
                result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=300)
                
                if result.returncode != 0:
                    logger.warning(f"pg_restore warnings: {result.stderr}")
                    # pg_restore often returns non-zero even on success due to warnings
                    # Check if actual errors occurred
                    if "ERROR" in result.stderr:
                        raise Exception(f"pg_restore failed with errors: {result.stderr}")
                
                logger.info(f"✅ PostgreSQL restore completed")
            else:
                # SQLite restore
                if os.path.exists(self.sqlite_path):
                    shutil.copy2(self.sqlite_path, os.path.join(self.backup_dir, safety + '.db'))
                shutil.copy2(backup_path, self.sqlite_path)

            logger.info(f"✅ Restored from: {backup_filename}")
            return True
            
        except subprocess.TimeoutExpired:
            logger.error("❌ Restore timeout")
            return False
        except Exception as e:
            logger.error(f"❌ Restore failed: {e}")
            return False

    def get_backup_stats(self):
        backups = self.list_backups()
        if not backups:
            return {'total_backups': 0, 'total_size_mb': 0, 'oldest_backup': None, 'newest_backup': None}
        return {
            'total_backups': len(backups),
            'total_size_mb': round(sum(b['size_kb'] for b in backups) / 1024, 2),
            'oldest_backup': backups[-1]['created'],
            'newest_backup': backups[0]['created'],
            'retention_days': self.retention_days
        }

    def perform_daily_backup(self):
        logger.info("🔄 Starting daily backup...")
        backup_path = self.create_backup()
        deleted = self.cleanup_old_backups()
        stats = self.get_backup_stats()
        logger.info(f"📊 Stats: {stats['total_backups']} backups, {stats['total_size_mb']} MB")
        return {'success': backup_path is not None, 'backup_path': backup_path, 'deleted_count': deleted, 'stats': stats}
