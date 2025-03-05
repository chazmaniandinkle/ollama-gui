from datetime import datetime
import uuid
from typing import List, Optional
from sqlmodel import Field, SQLModel, Relationship, JSON, Column, String


class User(SQLModel, table=True):
    """User model for authentication and authorization"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: str = Field(default="user")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = Field(default=None)
    settings: dict = Field(default_factory=dict, sa_column=Column(JSON))
    profile_image: Optional[str] = Field(default=None)
    
    # Relationships
    conversations: List["Conversation"] = Relationship(back_populates="user")
    documents: List["Document"] = Relationship(back_populates="user")
    tags: List["Tag"] = Relationship(back_populates="user")


class Tag(SQLModel, table=True):
    """Tag model for organizing conversations and documents"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)
    color: str = Field(default="#4a6ee0")
    user_id: uuid.UUID = Field(foreign_key="user.id")
    
    # Relationships
    user: User = Relationship(back_populates="tags")
    conversations: List["Conversation"] = Relationship(back_populates="tags", link_model="ConversationTagLink")
    documents: List["Document"] = Relationship(back_populates="tags", link_model="DocumentTagLink")


class Model(SQLModel, table=True):
    """Model information from a provider"""
    id: str = Field(primary_key=True)  # e.g., "ollama/llama3"
    provider: str = Field(index=True)  # e.g., "ollama"
    name: str = Field(index=True)  # e.g., "llama3"
    display_name: str  # e.g., "Llama 3"
    capabilities: dict = Field(sa_column=Column(JSON))
    context_length: int
    parameters: dict = Field(sa_column=Column(JSON))
    available: bool = Field(default=True)
    last_checked: datetime = Field(default_factory=datetime.utcnow)
    usage_count: int = Field(default=0)
    description: Optional[str] = Field(default=None)
    
    # Relationships
    conversations: List["Conversation"] = Relationship(back_populates="model")


class Conversation(SQLModel, table=True):
    """Conversation model for storing chat history"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    summary: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    model_id: str = Field(foreign_key="model.id")
    system_prompt: Optional[str] = Field(default=None)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    is_pinned: bool = Field(default=False)
    is_archived: bool = Field(default=False)
    
    # Relationships
    user: User = Relationship(back_populates="conversations")
    model: Model = Relationship(back_populates="conversations")
    messages: List["Message"] = Relationship(back_populates="conversation")
    tags: List[Tag] = Relationship(back_populates="conversations", link_model="ConversationTagLink")


class ConversationTagLink(SQLModel, table=True):
    """Link table for many-to-many relationship between Conversation and Tag"""
    conversation_id: uuid.UUID = Field(foreign_key="conversation.id", primary_key=True)
    tag_id: uuid.UUID = Field(foreign_key="tag.id", primary_key=True)


class Message(SQLModel, table=True):
    """Message model for storing individual chat messages"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="conversation.id", index=True)
    role: str = Field(index=True)  # user, assistant, system
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    token_count: Optional[int] = Field(default=None)
    metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")


class Document(SQLModel, table=True):
    """Document model for RAG"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    filename: str
    title: str
    content_type: str
    size: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))
    embedding_status: str = Field(default="pending")  # pending, processing, completed, error
    
    # Relationships
    user: User = Relationship(back_populates="documents")
    chunks: List["Chunk"] = Relationship(back_populates="document")
    tags: List[Tag] = Relationship(back_populates="documents", link_model="DocumentTagLink")


class DocumentTagLink(SQLModel, table=True):
    """Link table for many-to-many relationship between Document and Tag"""
    document_id: uuid.UUID = Field(foreign_key="document.id", primary_key=True)
    tag_id: uuid.UUID = Field(foreign_key="tag.id", primary_key=True)


class Chunk(SQLModel, table=True):
    """Document chunk for RAG"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="document.id", index=True)
    content: str
    metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))
    embedding_id: Optional[str] = Field(default=None)  # ID in vector store
    
    # Relationships
    document: Document = Relationship(back_populates="chunks")


class UserPreference(SQLModel, table=True):
    """User preference model for storing user-specific settings"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    key: str
    value: str = Field(sa_column=Column(String(length=1024)))
    updated_at: datetime = Field(default_factory=datetime.utcnow)
