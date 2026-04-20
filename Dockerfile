FROM python:3.10-slim
WORKDIR /app

# Install postgresql-client so pg_dump is available for backups
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Production: 4 workers x 2 threads = handles concurrent requests well
# Adjust -w based on CPU cores: (2 * CPU_cores) + 1 is the recommended formula
CMD ["gunicorn", "-w", "4", "--threads", "2", "--timeout", "120", "--keep-alive", "5", "-b", "0.0.0.0:5000", "app:app"]
