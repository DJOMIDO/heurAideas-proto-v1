# backend/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# 1. Copy dependencies and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copy all code
COPY . .

# 3. Make the entrypoint script executable
RUN chmod +x /app/scripts/entrypoint.sh

EXPOSE 8000

# 4. Set the entrypoint to run the script
ENTRYPOINT ["/app/scripts/entrypoint.sh"]