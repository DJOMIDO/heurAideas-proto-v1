# backend/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# 1. Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# 2. Copy dependencies and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy all code
COPY . .

# 4. Force convert script line endings to Unix format (LF)
# This ensures that even if Windows users submit CRLF files, they will be automatically fixed here
RUN dos2unix /app/scripts/entrypoint.sh

# 5. Make the entrypoint script executable
RUN chmod +x /app/scripts/entrypoint.sh

EXPOSE 8000

# 6. Set the entrypoint to run the script
ENTRYPOINT ["/app/scripts/entrypoint.sh"]