# 🚀 SweetCraft SaaS - Deployment Guide

Complete deployment guide for various platforms.

---

## 📋 Pre-Deployment Checklist

- [ ] Update `.env` file with production credentials
- [ ] Change default Super Admin password
- [ ] Update `API_BASE_URL` in frontend if needed
- [ ] Test application locally with Docker
- [ ] Backup any existing data
- [ ] Configure domain name (if applicable)

---

## 🐳 Docker Deployment (Recommended)

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/SweetCraft-SaaS.git
cd SweetCraft-SaaS

# Create .env file
cp .env.example .env
# Edit .env with your settings

# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./instance:/app/instance
      - ./static/uploads:/app/static/uploads
    environment:
      - FLASK_ENV=production
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

---

## ☁️ VPS Deployment (DigitalOcean, AWS EC2, Linode)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/SweetCraft-SaaS.git
cd SweetCraft-SaaS

# Configure environment
nano .env
# Update with production settings

# Build and run
docker-compose up -d

# Enable auto-restart on server reboot
sudo systemctl enable docker
```

### 3. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 4. Set Up Domain & SSL

```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

**Nginx Configuration** (`/etc/nginx/sites-available/sweetcraft`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sweetcraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🌐 Heroku Deployment

### Backend

```bash
# Login to Heroku
heroku login

# Create app
heroku create sweetcraft-backend

# Add buildpack
heroku buildpacks:set heroku/python

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=your-secret-key

# Deploy
git push heroku main

# Open app
heroku open
```

### Frontend

Deploy to **Vercel** or **Netlify**:

**Vercel:**
```bash
cd frontend
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
cd frontend
npm run build
# Drag and drop 'dist' folder to Netlify
```

---

## 🚂 Railway Deployment

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Configure:
   - **Backend Service:**
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `python app.py`
     - Add environment variables
   - **Frontend Service:**
     - Root Directory: `frontend`
     - Build Command: `npm install && npm run build`
     - Start Command: `npx serve -s dist -l $PORT`
5. Deploy!

---

## 🎨 Render Deployment

### Backend

1. Go to [Render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - Name: `sweetcraft-backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
   - Add environment variables
5. Create Web Service

### Frontend

1. New → Static Site
2. Connect GitHub repository
3. Configure:
   - Name: `sweetcraft-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `frontend/dist`
4. Create Static Site

---

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to VPS
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/SweetCraft-SaaS
          git pull origin main
          docker-compose down
          docker-compose up -d --build
```

---

## 📊 Monitoring & Maintenance

### Check Application Status

```bash
# View running containers
docker ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
git pull origin main
docker-compose up -d --build
```

### Database Backup

```bash
# Backup database
docker-compose exec backend python -c "
from app import db
import shutil
shutil.copy('instance/shop.db', 'instance/shop_backup.db')
"

# Or manually
cp instance/shop.db instance/shop_backup_$(date +%Y%m%d).db
```

### Monitor Resources

```bash
# Check disk usage
df -h

# Check memory
free -h

# Check Docker stats
docker stats
```

---

## 🔧 Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild containers
docker-compose down
docker-compose up --build
```

### Database issues

```bash
# Reset database (WARNING: Deletes all data)
rm instance/shop.db
docker-compose restart backend
```

### Port conflicts

```bash
# Check what's using port 80
sudo lsof -i :80

# Kill process
sudo kill -9 <PID>
```

---

## 🔐 Security Best Practices

1. **Change default credentials immediately**
2. **Use strong SECRET_KEY in .env**
3. **Enable HTTPS with SSL certificate**
4. **Regular database backups**
5. **Keep Docker images updated**
6. **Use firewall rules**
7. **Monitor application logs**
8. **Limit SSH access**

---

## 📞 Support

For deployment issues:
- Check logs: `docker-compose logs -f`
- GitHub Issues: [Create an issue](https://github.com/yourusername/SweetCraft-SaaS/issues)
- Email: support@poddarsolutions.com

---

**Happy Deploying! 🚀**
