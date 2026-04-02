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
        from urllib.parse import urlparse
        parsed = urlparse(self.db_uri)
        env = os.environ.copy()
        env['PGPASSWORD'] = parsed.password or ''
        cmd = [
            'pg_dump',
            '-h', parsed.hostname,
            '-p', str(parsed.port or 5432),
            '-U', parsed.username,
            '-d', parsed.path.lstrip('/'),
            '-f', backup_path
        ]
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"pg_dump failed: {result.stderr}")

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
        try:
            backup_path = os.path.join(self.backup_dir, backup_filename)
            if not os.path.exists(backup_path):
                logger.error(f"Backup not found: {backup_filename}")
                return False

            safety = f"shop_backup_before_restore_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            if self.is_postgres:
                # Restore PostgreSQL dump
                from urllib.parse import urlparse
                parsed = urlparse(self.db_uri)
                env = os.environ.copy()
                env['PGPASSWORD'] = parsed.password or ''
                cmd = ['psql', '-h', parsed.hostname, '-p', str(parsed.port or 5432),
                       '-U', parsed.username, '-d', parsed.path.lstrip('/'), '-f', backup_path]
                result = subprocess.run(cmd, env=env, capture_output=True, text=True)
                if result.returncode != 0:
                    raise Exception(f"psql restore failed: {result.stderr}")
            else:
                if os.path.exists(self.sqlite_path):
                    shutil.copy2(self.sqlite_path, os.path.join(self.backup_dir, safety + '.db'))
                shutil.copy2(backup_path, self.sqlite_path)

            logger.info(f"✅ Restored from: {backup_filename}")
            return True
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
