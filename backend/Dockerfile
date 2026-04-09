# backend/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
# This will copy scripts/entrypoint.sh to /app/scripts/entrypoint.sh
COPY . .

# Make the entrypoint script executable (correct path)
RUN chmod +x /app/scripts/entrypoint.sh

EXPOSE 8000

# Set the entrypoint to run the application (correct path)
ENTRYPOINT ["/app/scripts/entrypoint.sh"]