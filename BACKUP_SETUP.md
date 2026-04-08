# 🔧 PostgreSQL Backup Setup - Complete Guide

## ❓ Aapki Current Problem

Aapne dekha ki:
1. ✅ **Production mein PostgreSQL use kar rahe ho** - Correct!
2. ❌ **Backup folder empty hai** - Kyunki PostgreSQL client tools missing hain
3. ❓ **Instance folder empty hai** - Kyunki PostgreSQL external database hai, SQLite nahi

---

## 🎯 Solution: PostgreSQL Client Tools Install Karein

### Step 1: Check Your Environment

```bash
# Check if pg_dump installed hai
pg_dump --version

# Check if pg_restore installed hai  
pg_restore --version
```

Agar "command not found" aaye, to install karna padega.

---

## 📦 Installation Guide

### For Ubuntu/Debian (Most Common)

```bash
# Update package list
sudo apt-get update

# Install PostgreSQL client tools
sudo apt-get install -y postgresql-client

# Verify installation
pg_dump --version
pg_restore --version
```

### For Docker Deployment

**Option 1: Update Dockerfile**

```dockerfile
FROM python:3.11-slim

# Install PostgreSQL client tools
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Rest of your Dockerfile...
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["python", "app.py"]
```

**Option 2: Install in Running Container**

```bash
# Enter container
docker exec -it sweetcraft-backend bash

# Install inside container
apt-get update
apt-get install -y postgresql-client

# Verify
pg_dump --version

# Exit container
exit
```

### For CentOS/RHEL

```bash
sudo yum install -y postgresql
```

### For macOS

```bash
brew install postgresql
```

---

## 🧪 Test Your Backup System

### Method 1: Run Test Script

```bash
# Run the diagnostic script
python test_backup.py
```

Ye script check karega:
- ✅ Database connection
- ✅ PostgreSQL tools installation
- ✅ Backup directory permissions
- ✅ Create test backup

### Method 2: Manual Test

```bash
# Test database connection
psql -h localhost -p 5432 -U sweetcraft_user -d sweetcraft -c "SELECT version();"

# Create manual backup
python -c "from backup_manager import BackupManager; BackupManager().create_backup()"

# Check backup folder
ls -lh backups/
```

### Method 3: API Test

```bash
# Create backup via API
curl -X POST http://localhost:5000/api/backups/create \
  -H "X-Shop-Username: admin"

# List backups
curl http://localhost:5000/api/backups \
  -H "X-Shop-Username: admin"

# Get stats
curl http://localhost:5000/api/backups/stats \
  -H "X-Shop-Username: admin"
```

---

## 🔍 Understanding Your Database Setup

### PostgreSQL vs SQLite

**SQLite (Development):**
- Database file: `instance/shop.db`
- Backup: Simple file copy
- Location: Local file system

**PostgreSQL (Production):**
- Database: External server
- Backup: SQL dump via `pg_dump`
- Location: Separate database server

### Why Instance Folder is Empty?

```
PostgreSQL Setup:
┌─────────────────┐
│  Your App       │
│  (Flask)        │
└────────┬────────┘
         │
         │ Network Connection
         │
┌────────▼────────┐
│  PostgreSQL     │
│  Server         │
│  (External)     │
└─────────────────┘

Instance folder is NOT used!
Database is on separate server.
```

---

## 📋 Backup Configuration Check

### 1. Check .env File

```bash
cat .env | grep DB_URI
```

Should show:
```
DB_URI=postgresql://user:password@host:5432/database
```

### 2. Check Backup Manager Logs

```bash
# Check application logs
tail -f logs/app.log

# Or if using Docker
docker logs sweetcraft-backend | grep -i backup
```

### 3. Verify Scheduler is Running

```python
# In Python shell
from app import scheduler
print(scheduler.get_jobs())
```

Should show:
```
[<Job (id=daily_backup name=Daily Database Backup)>]
```

---

## 🚀 Quick Fix Commands

### If Backup Not Working

```bash
# 1. Install PostgreSQL client
sudo apt-get update && sudo apt-get install -y postgresql-client

# 2. Test database connection
export PGPASSWORD='your_db_password'
psql -h localhost -U sweetcraft_user -d sweetcraft -c "SELECT 1;"

# 3. Create manual backup
python -c "from backup_manager import BackupManager; m = BackupManager(); print(m.create_backup())"

# 4. Check backup folder
ls -lh backups/

# 5. Restart application
# If using Docker:
docker-compose restart backend
```

---

## 📊 Monitoring Backups

### Daily Check Script

Create `check_backups.sh`:

```bash
#!/bin/bash
echo "🔍 Checking Backup Status..."
echo ""

# Count backups
BACKUP_COUNT=$(ls -1 backups/shop_backup_*.sql 2>/dev/null | wc -l)
echo "📦 Total Backups: $BACKUP_COUNT"

# Latest backup
LATEST=$(ls -t backups/shop_backup_*.sql 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
    echo "📅 Latest Backup: $(basename $LATEST)"
    echo "📊 Size: $(du -h $LATEST | cut -f1)"
    echo "🕐 Modified: $(stat -c %y $LATEST | cut -d. -f1)"
else
    echo "⚠️  No backups found!"
fi

# Check if backup is recent (within 25 hours)
if [ -n "$LATEST" ]; then
    AGE=$(($(date +%s) - $(stat -c %Y $LATEST)))
    if [ $AGE -gt 90000 ]; then
        echo "⚠️  WARNING: Latest backup is older than 25 hours!"
    else
        echo "✅ Backup is recent"
    fi
fi
```

Run it:
```bash
chmod +x check_backups.sh
./check_backups.sh
```

---

## 🔄 Restore Process

### Emergency Restore

```bash
# 1. Stop application
docker-compose stop backend

# 2. List available backups
ls -lh backups/

# 3. Restore from backup
export PGPASSWORD='your_db_password'
pg_restore -h localhost -p 5432 -U sweetcraft_user \
  -d sweetcraft --clean --if-exists \
  backups/shop_backup_20240408_140530.sql

# 4. Start application
docker-compose start backend
```

### Via API (Safer)

```bash
# This creates safety backup before restore
curl -X POST http://localhost:5000/api/backups/restore/shop_backup_20240408_140530.sql \
  -H "X-Shop-Username: admin"
```

---

## 🐛 Troubleshooting

### Problem: "pg_dump: command not found"

```bash
# Solution
sudo apt-get install postgresql-client

# Verify
which pg_dump
```

### Problem: "Connection refused"

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -p 5432 -U sweetcraft_user -d sweetcraft

# Check .env file
cat .env | grep DB_URI
```

### Problem: "Permission denied"

```bash
# Fix backup folder permissions
sudo chown -R $USER:$USER backups
chmod 755 backups
```

### Problem: "Backup file is 0 bytes"

```bash
# Check database has data
psql -h localhost -U sweetcraft_user -d sweetcraft -c "SELECT COUNT(*) FROM staff;"

# Check pg_dump works manually
pg_dump -h localhost -U sweetcraft_user -d sweetcraft -f test_backup.sql

# Check for errors
cat test_backup.sql
```

---

## ✅ Production Checklist

Before going live, verify:

- [ ] PostgreSQL client tools installed (`pg_dump --version`)
- [ ] Database connection working (`psql -h ... -c "SELECT 1;"`)
- [ ] Backup folder exists and writable (`ls -ld backups`)
- [ ] Manual backup successful (`python test_backup.py`)
- [ ] Scheduler running (check logs)
- [ ] Automatic backup tested (wait for 2 AM or trigger manually)
- [ ] Restore tested on staging environment
- [ ] Offsite backup configured (S3, etc.)
- [ ] Monitoring alerts setup
- [ ] Team knows restore procedure

---

## 📞 Need Help?

Run diagnostics:
```bash
python test_backup.py
```

Check logs:
```bash
# Application logs
tail -100 logs/app.log | grep -i backup

# Docker logs
docker logs sweetcraft-backend --tail 100 | grep -i backup
```

Manual backup test:
```bash
python -c "
from backup_manager import BackupManager
import logging
logging.basicConfig(level=logging.DEBUG)
m = BackupManager()
result = m.create_backup()
print(f'Backup result: {result}')
"
```

---

## 🎓 Key Takeaways

1. **PostgreSQL ≠ SQLite**
   - PostgreSQL: External server, needs `pg_dump`
   - SQLite: Local file, simple copy

2. **Instance folder empty is NORMAL for PostgreSQL**
   - Database is on separate server
   - Not stored in local files

3. **Backup needs PostgreSQL client tools**
   - Install: `apt-get install postgresql-client`
   - Verify: `pg_dump --version`

4. **Automatic backups run at 2 AM daily**
   - Check logs to confirm
   - Manual trigger: API or Python script

5. **Always test restore before emergency**
   - Practice on staging
   - Verify data integrity

---

**Created:** April 2024  
**For:** SweetCraft SaaS Application  
**Database:** PostgreSQL Production Setup
