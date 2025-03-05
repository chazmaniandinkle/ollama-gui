from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Dict, List, Optional
from pydantic import BaseModel, Field

class ModelParameter(BaseModel):
    """Model parameter definition"""
    type: str = Field(..., description="Parameter type (float, int, bool, string)")
    default: Any = Field(..., description="Default value")
    min: Optional[Any] = Field(None, description="Minimum value")
    max: Optional[Any] = Field(None, description="Maximum value")
    options: Optional[List[Any]] = Field(None, description="Valid options for enum types")
    description: Optional[str] = Field(None, description="Parameter description")

class ModelCapabilities(BaseModel):
    """Model capabilities"""
    chat: bool = Field(True, description="Supports chat completion")
    function_calling: bool = Field(False, description="Supports function calling")
    vision: bool = Field(False, description="Supports image input")
    embedding: bool = Field(False, description="Supports embeddings")

class ModelInfo(BaseModel):
    """Model information"""
    id: str = Field(..., description="Unique model identifier")
    provider: str = Field(..., description="Provider name")
    name: str = Field(..., description="Model name")
    display_name: str = Field(..., description="Human-readable model name")
    context_length: int = Field(..., description="Maximum context length in tokens")
    description: Optional[str] = Field(None, description="Model description")
    capabilities: ModelCapabilities = Field(default_factory=ModelCapabilities)
    parameters: Dict[str, ModelParameter] = Field(default_factory=dict)
    available: bool = Field(True, description="Whether the model is available")

class ChatMessage(BaseModel):
    """Chat message"""
    role: str = Field(..., description="Message role (user, assistant, system)")
    content: str = Field(..., description="Message content")
    name: Optional[str] = Field(None, description="Optional name for the message sender")

class ChatRequest(BaseModel):
    """Chat request"""
    messages: List[ChatMessage] = Field(..., description="Chat messages")
    model: str = Field(..., description="Model identifier")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Model parameters")
    stream: bool = Field(False, description="Stream the response")

class ChatResponse(BaseModel):
    """Chat response"""
    model: str = Field(..., description="Model identifier")
    message: ChatMessage = Field(..., description="Response message")
    usage: Dict[str, int] = Field(default_factory=dict, description="Token usage statistics")

class ChatStreamChunk(BaseModel):
    """Chat stream chunk"""
    model: str = Field(..., description="Model identifier")
    token: str = Field(..., description="Text token")
    finish_reason: Optional[str] = Field(None, description="Finish reason if this is the last chunk")

class ProviderBase(ABC):
    """Base class for LLM providers"""
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider name"""
        pass
    
    @abstractmethod
    async def get_models(self) -> List[ModelInfo]:
        """List available models"""
        pass
    
    @abstractmethod
    async def get_model_info(self, model_id: str) -> ModelInfo:
        """Get model information"""
        pass
    
    @abstractmethod
    async def generate_response(self, request: ChatRequest) -> ChatResponse:
        """Generate a chat response"""
        pass
    
    @abstractmethod
    async def stream_response(self, request: ChatRequest) -> AsyncGenerator[ChatStreamChunk, None]:
        """Stream a chat response"""
        pass
    
    @abstractmethod
    async def validate_credentials(self) -> bool:
        """Validate provider credentials"""
        pass
