# -*- coding: utf-8 -*-
"""
FinPath AI — Authentication Routes
==================================
Provides secure registration, login, demo session initialization, and user profile endpoints.
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.database.init_db import _ensure_demo_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Register a new FinPath AI analyst account and return a JWT session token."""
    normalized_email = payload.email.strip().lower()
    existing = db.scalar(select(User).where(func.lower(User.email) == normalized_email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        hashed_password=get_password_hash(payload.password),
        role="Transaction Risk Analyst",
        is_active=True,
        is_demo=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    expires_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=expires_minutes),
    )
    return TokenResponse(
        access_token=token,
        expires_in=expires_minutes * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Authenticate an existing user with email and password."""
    normalized_email = payload.email.strip().lower()
    user = db.scalar(select(User).where(func.lower(User.email) == normalized_email))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been deactivated.",
        )

    expires_minutes = (
        settings.ACCESS_TOKEN_EXPIRE_MINUTES * 7
        if payload.remember_me
        else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    token = create_access_token(
        subject=user.id,
        extra_claims={"email": user.email, "role": user.role},
        expires_delta=timedelta(minutes=expires_minutes),
    )
    return TokenResponse(
        access_token=token,
        expires_in=expires_minutes * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/demo", response_model=TokenResponse)
def demo_login(db: Session = Depends(get_db)) -> TokenResponse:
    """
    Issue a temporary sandboxed JWT session for the Demo Analyst account
    so visitors can explore FinPath AI without creating an account or
    exposing hardcoded credentials in the frontend.
    """
    demo_user = _ensure_demo_user(db)
    expires_minutes = 120
    token = create_access_token(
        subject=demo_user.id,
        extra_claims={"email": demo_user.email, "role": demo_user.role, "demo": True},
        expires_delta=timedelta(minutes=expires_minutes),
    )
    return TokenResponse(
        access_token=token,
        expires_in=expires_minutes * 60,
        user=UserResponse.model_validate(demo_user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the currently authenticated user profile."""
    return UserResponse.model_validate(current_user)

