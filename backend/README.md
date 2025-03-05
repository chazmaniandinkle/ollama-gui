# Ollama GUI Backend

The backend server for Ollama GUI, built with FastAPI, providing API endpoints for interacting with LLMs via Ollama and other providers.

## Features

- FastAPI-based REST API and WebSocket server
- Multi-provider system for integration with Ollama, OpenAI, Anthropic, etc.
- Authentication and user management
- SQLModel-based ORM with SQLite and PostgreSQL support
- RAG (Retrieval Augmented Generation) capabilities for document processing
- WebSocket streaming for real-time LLM responses
- Configurable via YAML, environment variables, and database settings

## Directory Structure

```plaintext
backend/
├── app/                  # Application code
│   ├── api/              # API endpoints
│   │   ├── api_v1/       # API version 1
│   │   │   ├── endpoints/# API endpoint implementations
│   │   │   └── api.py    # API router
│   │   └── deps.py       # API dependencies
│   ├── core/             # Core functionality
│   │   ├── config.py     # Configuration management
│   │   ├── security.py   # Authentication and security
│   │   └── provider_registry.py # Provider registry
│   ├── db/               # Database models and session
│   │   ├── models.py     # SQLModel definitions
│   │   └── session.py    # Database session
│   ├── providers/        # LLM provider implementations
│   │   ├── base.py       # Base provider interface
│   │   ├── ollama.py     # Ollama provider
│   │   └── openai.py     # OpenAI provider (optional)
│   ├── rag/              # RAG engine implementation
│   │   ├── engine.py     # Main RAG engine
│   │   ├── embeddings.py # Embedding management
│   │   └── chunking.py   # Document chunking
│   ├── utils/            # Utility functions
│   └── main.py           # Application entry point
├── config/               # Configuration files
│   └── config.yaml       # Main configuration
├── tests/                # Backend tests
│   ├── api/              # API tests
│   ├── providers/        # Provider tests
│   └── conftest.py       # Test configuration
├── alembic/              # Database migrations
│   ├── versions/         # Migration versions
│   └── env.py            # Alembic environment
├── alembic.ini           # Alembic configuration
├── pyproject.toml        # Poetry dependencies
└── README.md             # This file
```

## Prerequisites

- Python 3.10+
- Poetry (dependency management)
- Ollama instance (local or remote)
- SQLite or PostgreSQL database

## Setup

1. Install Poetry if not already installed:

   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. Install dependencies:

   ```bash
   poetry install
   ```

3. Create configuration file:

   ```bash
   mkdir -p config
   cp config/config.example.yaml config/config.yaml
   ```

4. Edit the configuration file to match your environment:

   ```bash
   # Update auth.jwt_secret and other settings
   nano config/config.yaml
   ```

5. Create data directories:

   ```bash
   mkdir -p data/uploads data/cache data/tmp data/vector_db logs
   ```

## Development

1. Activate the Poetry virtual environment:

   ```bash
   poetry shell
   ```

2. Run the development server:

   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

## Testing

Run tests with pytest:

```bash
poetry run pytest
```

Run tests with coverage:

```bash
poetry run pytest --cov=app
```

## Database Migrations

Initialize the database:

```bash
alembic upgrade head
```

Create a new migration after model changes:

```bash
alembic revision --autogenerate -m "Description of changes"
```

## Environment Variables

The backend can be configured using environment variables, which override the configuration file settings. Key environment variables include:

- `APP__HOST` - Host to bind the server to (default: 127.0.0.1)
- `APP__PORT` - Port to bind the server to (default: 8000)
- `DATABASE__TYPE` - Database type: sqlite or postgres (default: sqlite)
- `DATABASE__SQLITE__PATH` - SQLite database path (default: data/ollama_gui.db)
- `AUTH__JWT_SECRET` - Secret key for JWT token generation (required)
- `PROVIDERS__OLLAMA__BASE_URLS` - Comma-separated list of Ollama API URLs

See `.env.example` at the project root for a full list of available environment variables.

## API Documentation

Once the server is up and running, you can view the API documentation at the following locations:

- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## Common Issues

### Unable to Connect to Ollama

Ensure that Ollama is operational and reachable at the URL specified in your configuration. By default, the backend expects Ollama to be available at [http://localhost:11434](http://localhost:11434).

### Database migration errors

If you encounter database migration errors, try deleting the database file (if using SQLite) and running `alembic upgrade head` again.

### JWT token errors

Make sure to set a strong, unique `AUTH__JWT_SECRET` in your configuration or environment variables.
