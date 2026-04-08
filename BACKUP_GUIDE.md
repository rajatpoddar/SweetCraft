# 🔐 Database Backup & Restore Guide

## 📋 Overview

Aapki application mein automatic daily backup system hai jo:
- **Har roz subah 2 AM** pe automatically backup leta hai
- **15 din purane backups** automatically delete ho jate hain
- **PostgreSQL aur SQLite dono** support karta hai

---

## 🚀 Quick Start

### 1. PostgreSQL Client Tools Install Karein

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

**CentOS/RHEL:**
```bash
sudo yum install postgresql
```

**macOS:**
```bash
brew install postgresql
```

**Docker Container mein:**
```bash
# Dockerfile mein add karein:
RUN apt-get update && apt-get install -y postgresql-client
```

### 2. Verify Installation
```bash
pg_dump --version
pg_restore --version
```

---

## 🔄 Backup Operations

### Manual Backup Lena

**API se:**
```bash
curl -X POST http://localhost:5000/api/backups/create \
  -H "X-Shop-Username: admin"
```

**Python se:**
```python
from backup_manager import BackupManager
manager = BackupManager()
backup_path = manager.create_backup()
print(f"Backup created: {backup_path}")
```

### Backup List Dekhna

```bash
curl http://localhost:5000/api/backups \
  -H "X-Shop-Username: admin"
```

### Backup Download Karna

```bash
curl -O http://localhost:5000/api/backups/download/shop_backup_20240408_140530.sql \
  -H "X-Shop-Username: admin"
```

---

## 🔙 Restore Operations

### ⚠️ IMPORTANT: Restore se pehle

1. **Current database ka backup le lo** (automatic hota hai)
2. **Confirm karo ki sahi backup file select ki hai**
3. **Application ko temporarily band kar do** (optional but recommended)

### API se Restore

```bash
curl -X POST http://localhost:5000/api/backups/restore/shop_backup_20240408_140530.sql \
  -H "X-Shop-Username: admin"
```

### Manual Restore (PostgreSQL)

```bash
# Environment variables set karein
export PGPASSWORD='your_db_password'

# Restore command
pg_restore -h localhost -p 5432 -U sweetcraft_user \
  -d sweetcraft --clean --if-exists \
  backups/shop_backup_20240408_140530.sql
```

---

## 📊 Backup Status Check

### Stats Dekhna

```bash
curl http://localhost:5000/api/backups/stats \
  -H "X-Shop-Username: admin"
```

**Response:**
```json
{
  "total_backups": 15,
  "total_size_mb": 45.67,
  "oldest_backup": "2024-03-24 02:00:00",
  "newest_backup": "2024-04-08 02:00:00",
  "retention_days": 15
}
```

---

## 🐳 Docker Deployment

### docker-compose.yml mein PostgreSQL client add karein:

```yaml
services:
  backend:
    build: .
    # ... other config
    depends_on:
      - postgres
    volumes:
      - ./backups:/app/backups  # Backup folder mount karein
```

### Dockerfile mein:

```dockerfile
FROM python:3.11-slim

# PostgreSQL client install karein
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# ... rest of your Dockerfile
```

---

## 🔍 Troubleshooting

### Problem: "pg_dump not found"

**Solution:**
```bash
# Check if installed
which pg_dump

# If not found, install:
sudo apt-get install postgresql-client
```

### Problem: "Backup folder empty hai"

**Reasons:**
1. PostgreSQL client tools install nahi hain
2. Database credentials galat hain
3. Scheduler start nahi hua

**Check logs:**
```bash
# Application logs check karein
docker logs sweetcraft-backend

# Manual backup try karein
curl -X POST http://localhost:5000/api/backups/create
```

### Problem: "Connection refused during backup"

**Solution:**
```bash
# Database connection check karein
psql -h localhost -p 5432 -U sweetcraft_user -d sweetcraft

# .env file check karein
cat .env | grep DB_URI
```

### Problem: "Permission denied on backups folder"

**Solution:**
```bash
# Folder permissions fix karein
chmod 755 backups
chown -R $USER:$USER backups
```

---

## 📁 Backup File Formats

### PostgreSQL Backups
- **Format:** Custom compressed format (`.sql`)
- **Size:** Compressed, typically 10-30% of database size
- **Restore:** Requires `pg_restore` command

### SQLite Backups
- **Format:** Binary database file (`.db`)
- **Size:** Same as original database
- **Restore:** Simple file copy

---

## ⏰ Automatic Backup Schedule

Backup scheduler automatically runs:
- **Time:** Daily at 2:00 AM
- **Retention:** 15 days
- **Cleanup:** Old backups auto-delete

### Scheduler ko manually trigger karein:

```python
from backup_manager import BackupManager
manager = BackupManager()
result = manager.perform_daily_backup()
print(result)
```

---

## 🔐 Security Best Practices

1. **Backup folder ko secure rakho:**
   ```bash
   chmod 700 backups
   ```

2. **Backups ko offsite storage pe bhi rakho:**
   - AWS S3
   - Google Cloud Storage
   - External hard drive

3. **Encrypted backups use karein (production):**
   ```bash
   # Backup encrypt karein
   gpg --encrypt --recipient your@email.com backup.sql
   ```

4. **Regular restore testing karein:**
   - Har mahine ek baar test restore karein
   - Verify data integrity

---

## 📞 Support

Agar koi problem ho to:
1. Application logs check karein
2. Database connection verify karein
3. PostgreSQL client tools install check karein
4. Manual backup try karein

**Common Commands:**
```bash
# Logs dekhein
tail -f logs/app.log

# Backup manually create karein
python -c "from backup_manager import BackupManager; BackupManager().create_backup()"

# Database connection test karein
psql -h localhost -U sweetcraft_user -d sweetcraft -c "SELECT version();"
```

---

## ✅ Checklist for Production

- [ ] PostgreSQL client tools installed
- [ ] Backup folder writable
- [ ] Database credentials correct in .env
- [ ] Scheduler running (check logs)
- [ ] Manual backup tested successfully
- [ ] Restore tested on staging
- [ ] Offsite backup configured
- [ ] Monitoring alerts setup

---

**Last Updated:** April 2024
**Version:** 1.0
