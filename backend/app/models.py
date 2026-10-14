from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    whatsapp: Optional[str] = Field(default=None)
    role: str = Field(default="admin", index=True) # "super_admin" | "admin"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    client_id: str = Field(default="default_client", index=True)

class Invite(SQLModel, table=True):
    __tablename__ = "invites"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(unique=True, index=True)
    role: str = Field(default="admin") # Apenas admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(index=True)
    used: bool = Field(default=False)
    used_at: Optional[datetime] = Field(default=None)
    used_by_email: Optional[str] = Field(default=None)
    created_by_user_id: Optional[int] = Field(default=None)
    client_id: str = Field(default="default_client", index=True)

class Post(SQLModel, table=True):
    __tablename__ = "posts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    slug: str = Field(unique=True, index=True)
    content: str
    summary: str
    cover_image_url: Optional[str] = Field(default=None)
    tags: Optional[str] = Field(default=None)
    published: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    client_id: str = Field(default="default_client", index=True)

class Comment(SQLModel, table=True):
    __tablename__ = "comments"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="posts.id", index=True)
    author_name: str
    author_email: Optional[str] = Field(default=None)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved: bool = Field(default=True)
    client_id: str = Field(default="default_client", index=True)
    author_avatar_url: Optional[str] = Field(default=None)


