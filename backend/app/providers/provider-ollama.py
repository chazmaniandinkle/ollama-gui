import httpx
import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional
from app.providers.base import (
    ProviderBase, 
    ModelInfo, 
    ModelParameter, 
    ModelCapabilities, 
    ChatMessage, 
    ChatRequest, 
    ChatResponse,
    ChatStreamChunk
)
from app.core.config import get_app_settings

logger = logging.getLogger(__name__)

class OllamaProvider(ProviderBase):
    """Ollama provider implementation"""
    
    def __init__(self):
        self.settings = get_app_settings()
        self.provider_settings = self.settings.providers.get("ollama", {})
        
        # Use the first base URL from the configuration
        base_urls = self.provider_settings.get("base_urls", ["http://localhost:11434"])
        self.base_url = base_urls[0] if base_urls else "http://localhost:11434"
        
        self.timeout = self.provider_settings.get("timeout", 60)
        
        # Common model parameters for Ollama
        self.common_parameters = {
            "temperature": ModelParameter(
                type="float",
                default=0.7,
                min=0.0,
                max=2.0,
                description="Controls randomness: lower is more deterministic"
            ),
            "top_p": ModelParameter(
                type="float",
                default=1.0,
                min=0.0,
                max=1.0,
                description="Nucleus sampling: consider only most likely tokens"
            ),
            "top_k": ModelParameter(
                type="int",
                default=40,
                min=1,
                max=100,
                description="Consider only top k most likely tokens"
            ),
            "max_tokens": ModelParameter(
                type="int",
                default=2000,
                min=1,
                max=32000,
                description="Maximum response length in tokens"
            ),
        }
    
    @property
    def provider_name(self) -> str:
        return "ollama"
    
    async def _make_request(
        self, 
        endpoint: str, 
        method: str = "GET", 
        json_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make a request to the Ollama API"""
        url = f"{self.base_url}{endpoint}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                if method == "GET":
                    response = await client.get(url)
                else:  # POST
                    response = await client.post(url, json=json_data)
                
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error when calling Ollama API: {e}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Request error when calling Ollama API: {e}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error when calling Ollama API: {e}")
                raise
    
    async def get_models(self) -> List[ModelInfo]:
        """List available models"""
        try:
            response = await self._make_request("/api/tags")
            models = []
            
            for model_data in response.get("models", []):
                model_name = model_data.get("name", "")
                
                # Create model info
                model_info = ModelInfo(
                    id=f"ollama/{model_name}",
                    provider=self.provider_name,
                    name=model_name,
                    display_name=model_name.capitalize(),
                    context_length=model_data.get("details", {}).get("context_length", 4096),
                    description=model_data.get("details", {}).get("description", None),
                    capabilities=ModelCapabilities(
                        chat=True,
                        function_calling=False,
                        vision=False,
                        embedding=True,
                    ),
                    parameters=self.common_parameters,
                    available=True,
                )
                
                models.append(model_info)
            
            return models
        except Exception as e:
            logger.error(f"Error listing Ollama models: {e}")
            return []
    
    async def get_model_info(self, model_id: str) -> ModelInfo:
        """Get model information"""
        if not model_id.startswith("ollama/"):
            raise ValueError(f"Invalid Ollama model ID: {model_id}")
        
        model_name = model_id.replace("ollama/", "", 1)
        
        # List all models and find the one we want
        models = await self.get_models()
        for model in models:
            if model.name == model_name:
                return model
        
        raise ValueError(f"Model not found: {model_id}")
    
    async def generate_response(self, request: ChatRequest) -> ChatResponse:
        """Generate a chat response"""
        if not request.model.startswith("ollama/"):
            raise ValueError(f"Invalid Ollama model ID: {request.model}")
        
        model_name = request.model.replace("ollama/", "", 1)
        
        # Format the messages for Ollama
        formatted_messages = []
        for msg in request.messages:
            formatted_messages.append({
                "role": msg.role,
                "content": msg.content,
            })
        
        # Format the parameters
        parameters = {}
        for param, value in request.parameters.items():
            if param in ["temperature", "top_p", "top_k", "max_tokens"]:
                parameters[param] = value
        
        # Create the request payload
        payload = {
            "model": model_name,
            "messages": formatted_messages,
            "options": parameters,
            "stream": False,
        }
        
        # Make the request
        response = await self._make_request("/api/chat", "POST", payload)
        
        # Parse the response
        assistant_message = ChatMessage(
            role="assistant",
            content=response.get("message", {}).get("content", ""),
        )
        
        # Get token usage if available
        usage = {}
        if "prompt_eval_count" in response:
            usage["prompt_tokens"] = response["prompt_eval_count"]
        if "eval_count" in response:
            usage["completion_tokens"] = response["eval_count"]
        if usage:
            usage["total_tokens"] = usage.get("prompt_tokens", 0) + usage.get("completion_tokens", 0)
        
        return ChatResponse(
            model=request.model,
            message=assistant_message,
            usage=usage,
        )
    
    async def stream_response(self, request: ChatRequest) -> AsyncGenerator[ChatStreamChunk, None]:
        """Stream a chat response"""
        if not request.model.startswith("ollama/"):
            raise ValueError(f"Invalid Ollama model ID: {request.model}")
        
        model_name = request.model.replace("ollama/", "", 1)
        
        # Format the messages for Ollama
        formatted_messages = []
        for msg in request.messages:
            formatted_messages.append({
                "role": msg.role,
                "content": msg.content,
            })
        
        # Format the parameters
        parameters = {}
        for param, value in request.parameters.items():
            if param in ["temperature", "top_p", "top_k", "max_tokens"]:
                parameters[param] = value
        
        # Create the request payload
        payload = {
            "model": model_name,
            "messages": formatted_messages,
            "options": parameters,
            "stream": True,
        }
        
        # Make streaming request
        url = f"{self.base_url}/api/chat"
        
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, json=payload) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if not line or line.isspace():
                        continue
                    
                    try:
                        chunk = json.loads(line)
                        
                        if "done" in chunk and chunk["done"]:
                            # Final chunk with no content
                            yield ChatStreamChunk(
                                model=request.model,
                                token="",
                                finish_reason="stop",
                            )
                            break
                        
                        if "message" in chunk and "content" in chunk["message"]:
                            # Extract just the delta from the message
                            yield ChatStreamChunk(
                                model=request.model,
                                token=chunk["message"]["content"],
                                finish_reason=None,
                            )
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse streaming response: {line}")
                        continue
    
    async def validate_credentials(self) -> bool:
        """Validate Ollama is accessible"""
        try:
            # Just check if we can hit the /api/tags endpoint
            await self._make_request("/api/tags")
            return True
        except Exception as e:
            logger.error(f"Failed to validate Ollama credentials: {e}")
            return False
