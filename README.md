# SweetCraft SaaS

Business management solution for sweet shops and bakeries. Built with Flask + React.

## Features

- Staff management with salary & attendance tracking
- Party orders with advance payment
- Customer credit (Udhari) ledger
- Vendor (Mahajan) management with bill uploads
- Daily expense tracking
- Comprehensive reports with PDF download
- Automatic daily database backups (15-day retention)
- PWA support (installable, works offline)
- Multi-language: English & Hindi
- Dark mode

## Tech Stack

- **Backend**: Flask, SQLAlchemy, PostgreSQL, Gunicorn
- **Frontend**: React 18, Vite, Tailwind CSS
- **Infra**: Docker, Docker Compose, Nginx

## Quick Start

### With Docker (Recommended)

```bash
git clone https://github.com/yourusername/SweetCraft-SaaS.git
cd SweetCraft-SaaS

cp .env.example .env
# Edit .env with your passwords and settings

docker-compose up -d
```

App runs on `http://localhost:8834`

### Local Development

**Backend:**
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `FLASK_SECRET_KEY` | Long random string for session security |
| `ADMIN_PASSWORD` | Shop admin default password |
| `SUPERADMIN_PASSWORD` | Super admin password |
| `FRONTEND_URL` | Your frontend domain (for CORS) |
| `DB_URI` | PostgreSQL or SQLite connection string |

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `admin` | from `.env` |
| Shop Admin | set during shop creation | set during shop creation |

> **Change default passwords immediately after first login.**

## Deployment

### VPS / Cloud Server

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and deploy
git clone https://github.com/yourusername/SweetCraft-SaaS.git
cd SweetCraft-SaaS
cp .env.example .env && nano .env
docker-compose up -d
```

For HTTPS, use Nginx + Let's Encrypt in front of the containers.

### Render / Railway

- Backend: Python, build `pip install -r requirements.txt`, start `gunicorn -w 1 --threads 4 -b 0.0.0.0:5000 app:app`
- Frontend: Node, build `npm install && npm run build`, publish `dist/`

## Backup System

Automatic daily backups run at 2:00 AM. Last 15 days are retained.

Manual backup via API:
```bash
curl -X POST http://localhost:5534/api/backups/create
curl http://localhost:5534/api/backups/list
```

## License

MIT — see [LICENSE](LICENSE)
