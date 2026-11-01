# -*- coding: utf-8 -*-
"""FinPath AI — Transaction ORM Model."""

from sqlalchemy import Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    finpath_id: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    time: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    user_latency: Mapped[float] = mapped_column(Float, nullable=False)
    server_latency: Mapped[float] = mapped_column(Float, nullable=False)
    bank_latency: Mapped[float] = mapped_column(Float, nullable=False)
    load: Mapped[int] = mapped_column(Integer, index=True, nullable=False)

    # Actual simulated outcomes
    success: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    failed_node: Mapped[str] = mapped_column(String(24), index=True, nullable=False)

    # Pre-evaluated ML predictions from Model 1 and Model 2
    predicted_success: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    success_probability: Mapped[float] = mapped_column(Float, nullable=False)
    failure_probability: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_failed_node: Mapped[str] = mapped_column(String(24), index=True, nullable=False)

    __table_args__ = (
        Index("ix_transactions_status_node", "success", "failed_node"),
        Index("ix_transactions_time_status", "time", "success"),
    )

