import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, Path
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from app.api.deps import get_current_user, get_db
from app.core.provider_registry import get_provider
from app.db.models import User, Conversation, Message
from app.providers.base import ChatMessage, ChatRequest
from app.rag.engine import get_rag_engine

router = APIRouter()

class SendMessageRequest(BaseModel):
    message: str
    parameters: Optional[Dict[str, Any]] = None
    stream: bool = False
    files: Optional[List[str]] = None
    context: Optional[Dict[str, Any]] = None

class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class SendMessageResponse(BaseModel):
    status: bool = True
    data: Dict[str, Any]
    error: Optional[Dict[str, Any]] = None

@router.post("/{conversation_id}", response_model=SendMessageResponse)
async def send_message(
    conversation_id: uuid.UUID = Path(...),
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a user message and receive an assistant response.
    Non-streaming version.
    """
    # Get the conversation
    conversation = db.exec(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .where(Conversation.user_id == current_user.id)
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get the provider for the model
    provider_name = conversation.model.provider
    provider = await get_provider(provider_name)
    
    if not provider:
        raise HTTPException(status_code=400, detail=f"Provider {provider_name} not available")
    
    # Process any RAG context if requested
    context_content = ""
    if request.context:
        # Process context from RAG engine
        rag_engine = get_rag_engine()
        
        # Check if web search is requested
        if request.context.get("web_search"):
            web_results = await rag_engine.search_web(request.message)
            if web_results:
                context_content += "Web search results:\n" + "\n".join(web_results) + "\n\n"
        
        # Check if knowledge documents are requested
        if knowledge_ids := request.context.get("knowledge_ids"):
            doc_results = await rag_engine.retrieve_from_docs(
                request.message, knowledge_ids, top_k=3
            )
            if doc_results:
                context_content += "Document references:\n" + "\n".join(doc_results) + "\n\n"
    
    # Build the messages list
    messages = []
    
    # Add system prompt if it exists
    if conversation.system_prompt:
        messages.append(ChatMessage(role="system", content=conversation.system_prompt))
    
    # Add context if it exists
    if context_content:
        messages.append(ChatMessage(role="system", content=f"Additional context:\n{context_content}"))
    
    # Get the conversation history (last 10 messages)
    history = db.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(10)
    ).all()
    
    # Add history messages in chronological order
    for msg in reversed(history):
        messages.append(ChatMessage(role=msg.role, content=msg.content))
    
    # Add the current user message
    messages.append(ChatMessage(role="user", content=request.message))
    
    # Save the user message to the database
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=request.message,
        created_at=datetime.utcnow()
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Update the conversation's updated_at timestamp
    conversation.updated_at = datetime.utcnow()
    db.add(conversation)
    db.commit()
    
    # Prepare the request to the provider
    chat_request = ChatRequest(
        messages=messages,
        model=conversation.model_id,
        parameters=request.parameters or {},
        stream=False
    )
    
    try:
        # Get the response from the provider
        chat_response = await provider.generate_response(chat_request)
        
        # Save the assistant message to the database
        assistant_message = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=chat_response.message.content,
            created_at=datetime.utcnow(),
            token_count=chat_response.usage.get("completion_tokens"),
            metadata={
                "token_usage": chat_response.usage,
                "context_source": "rag" if context_content else None,
                "context_documents": request.context.get("knowledge_ids") if request.context else None,
            }
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)
        
        # Update model usage count
        conversation.model.usage_count += 1
        db.add(conversation.model)
        db.commit()
        
        # Return the response
        return SendMessageResponse(
            status=True,
            data={
                "user_message": {
                    "id": user_message.id,
                    "role": user_message.role,
                    "content": user_message.content,
                    "created_at": user_message.created_at
                },
                "assistant_message": {
                    "id": assistant_message.id,
                    "role": assistant_message.role,
                    "content": assistant_message.content,
                    "created_at": assistant_message.created_at,
                    "metadata": assistant_message.metadata
                }
            }
        )
    except Exception as e:
        # Log the error
        logger.error(f"Error generating response: {e}")
        
        # Return an error response
        return SendMessageResponse(
            status=False,
            data={},
            error={
                "code": "provider_error",
                "message": str(e)
            }
        )

@router.post("/{conversation_id}/stream")
async def stream_response(
    conversation_id: uuid.UUID = Path(...),
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a user message and stream back the assistant's response.
    """
    # Implementation would be similar to the non-streaming version,
    # but would use StreamingResponse and the provider's stream_response method
    
    # This is a placeholder for the actual implementation
    async def generate():
        yield "data: {\"token\": \"Streaming\"}\n\n"
        yield "data: {\"token\": \" response\"}\n\n"
        yield "data: {\"token\": \" placeholder\"}\n\n"
        yield "data: {\"finish_reason\": \"stop\"}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.websocket("/{conversation_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: str,
    token: str = Query(None),
):
    """
    WebSocket endpoint for streaming responses.
    """
    await websocket.accept()
    
    try:
        # Authenticate the user
        # Note: This is a placeholder for actual authentication
        if not token:
            await websocket.close(code=4000, reason="Missing authentication token")
            return
        
        # Process messages
        while True:
            data = await websocket.receive_json()
            
            # Echo back the message (placeholder)
            await websocket.send_json({"message": "Received", "data": data})
            
    except WebSocketDisconnect:
        # Handle disconnect
        pass
    except Exception as e:
        # Handle other errors
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason="Server error")
