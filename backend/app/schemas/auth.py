# -*- coding: utf-8 -*-
"""FinPath AI — Authentication Pydantic Schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120, description="Full name of the user")
    email: EmailStr = Field(..., description="Valid corporate or personal email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (minimum 8 characters)")


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, max_length=128, description="Account password")
    remember_me: bool = Field(default=True, description="Extend session token duration")


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    is_demo: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

