FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/pyproject.toml backend/poetry.lock* /app/

# Install Poetry
RUN pip install --no-cache-dir poetry \
    && poetry config virtualenvs.create false

# Install project dependencies
RUN poetry install --no-interaction --no-ansi --no-dev

# Copy project files
COPY backend /app/

# Create directories for data
RUN mkdir -p /app/data/uploads /app/data/cache /app/data/tmp /app/logs

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
