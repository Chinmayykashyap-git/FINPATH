# -*- coding: utf-8 -*-
"""FinPath AI — Transaction Pydantic Schemas."""

from typing import Any, Dict, List
from pydantic import BaseModel


class TransactionItem(BaseModel):
    id: int
    finpath_id: str
    time: int
    user_latency: float
    server_latency: float
    bank_latency: float
    load: int
    success: int
    failed_node: str
    predicted_success: int
    success_probability: float
    failure_probability: float
    predicted_failed_node: str

    class Config:
        from_attributes = True


class PaginatedTransactionsResponse(BaseModel):
    items: List[TransactionItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class TransactionDetailResponse(BaseModel):
    transaction: TransactionItem
    live_analysis: Dict[str, Any]

