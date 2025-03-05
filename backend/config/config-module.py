import os
import yaml
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from functools import lru_cache
from pydantic import AnyUrl, BaseModel, validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

class DatabaseSettings(BaseModel):
    type: str = "sqlite"
    
    # SQLite settings
    sqlite_path: str = "data/ollama_gui.db"
    
    # PostgreSQL settings
    postgres_host: Optional[str] = "localhost"
    postgres_port: Optional[int] = 5432
    postgres_user: Optional[str] = "ollama_gui"
    postgres_password: Optional[str] = None
    postgres_db: Optional[str] = "ollama_gui"
    postgres_ssl_mode: Optional[str] = "disable"
    
    # Connection pool settings
    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 1800
    
    # Migrations
    auto_migrate: bool = True

class AuthSettings(BaseModel):
    enable: bool = True
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiry: str = "24h"
    
    # Password policy
    password_min_length: int = 8
    password_require_special: bool = False
    
    # API Key settings
    api_key_enable: bool = True

class ProviderSettings(BaseModel):
    enabled: bool = True
    base_urls: List[str]
    timeout: int = 60

class RagSettings(BaseModel):
    enabled: bool = True
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_engine: str = "local"
    embedding_batch_size: int = 10
    chunk_size: int = 1000
    chunk_overlap: int = 100
    vector_db: str = "chroma"
    top_k: int = 3
    
    # Path settings
    vector_db_path: Optional[str] = "data/vector_db"

class UiSettings(BaseModel):
    theme: str = "system"
    message_display: str = "comfortable"
    code_theme: str = "github-dark"
    ctrl_enter_to_send: bool = True
    enable_markdown: bool = True
    enable_latex: bool = True
    default_locale: Optional[str] = None

class AppSettings(BaseSettings):
    # App information
    app_name: str = "Ollama GUI"
    
    # Server settings
    host: str = "127.0.0.1"
    port: int = 8000
    
    # Path settings
    base_dir: Path = Path(__file__).parent.parent.parent
    config_file: Path = Path("config/config.yaml")
    data_dir: Path = Path("data")
    uploads_dir: Path = Path("data/uploads")
    cache_dir: Path = Path("data/cache")
    temp_dir: Path = Path("data/tmp")
    
    # Logging
    log_level: str = "info"
    log_file: Optional[str] = "logs/app.log"
    log_format: str = "json"
    
    # API settings
    cors_allow_origins: List[str] = ["*"]
    max_upload_size: int = 52428800  # 50MB
    
    # Database settings
    database: DatabaseSettings = DatabaseSettings()
    
    # Authentication settings
    auth: AuthSettings
    
    # Provider settings
    providers: Dict[str, ProviderSettings] = {}
    
    # RAG settings
    rag: RagSettings = RagSettings()
    
    # UI settings
    ui: UiSettings = UiSettings()
    
    class Config:
        env_file = ".env"
        env_nested_delimiter = "__"
    
    def __init__(self, **data: Any):
        # Load from YAML config first
        config_data = self._load_yaml_config()
        
        # Override with environment variables via BaseSettings
        super().__init__(**{**config_data, **data})
        
        # Ensure directories exist
        self._create_directories()
    
    def _load_yaml_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        config_path = self.base_dir / self.config_file
        
        if not config_path.exists():
            logger.warning(f"Config file not found: {config_path}")
            return {}
        
        try:
            with open(config_path, "r") as f:
                config = yaml.safe_load(f)
                
            # Process environment variable substitutions in YAML
            def process_env_vars(item):
                if isinstance(item, dict):
                    return {k: process_env_vars(v) for k, v in item.items()}
                elif isinstance(item, list):
                    return [process_env_vars(i) for i in item]
                elif isinstance(item, str) and item.startswith("${") and item.endswith("}"):
                    # Handle ${ENV_VAR} syntax
                    env_var = item[2:-1]
                    return os.environ.get(env_var, "")
                elif isinstance(item, str) and "${" in item:
                    # Handle string with embedded ${ENV_VAR}
                    import re
                    pattern = r'\${([^}]*)}'
                    def replace(match):
                        env_var = match.group(1)
                        return os.environ.get(env_var, "")
                    return re.sub(pattern, replace, item)
                return item
            
            return process_env_vars(config)
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return {}
    
    def _create_directories(self):
        """Create required directories if they don't exist"""
        dirs = [
            self.data_dir,
            self.uploads_dir,
            self.cache_dir,
            self.temp_dir,
            self.rag.vector_db_path,
        ]
        
        for dir_path in dirs:
            full_path = self.base_dir / dir_path
            if not full_path.exists():
                logger.info(f"Creating directory: {full_path}")
                full_path.mkdir(parents=True, exist_ok=True)

@lru_cache()
def get_app_settings() -> AppSettings:
    """
    Return cached application settings
    """
    try:
        return AppSettings()
    except Exception as e:
        logger.error(f"Failed to load settings: {e}")
        raise
