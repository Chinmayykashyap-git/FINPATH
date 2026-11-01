# -*- coding: utf-8 -*-
"""
FinPath AI — Transaction Monitor Routes
=======================================
Provides searchable, filterable, sortable, paginated transaction records,
CSV export, and detailed transaction drawer inspection.
"""

import csv
import io
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.ml.engine import ml_engine
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import (
    PaginatedTransactionsResponse,
    TransactionDetailResponse,
    TransactionItem,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])

ALLOWED_SORT_COLUMNS = {
    "finpath_id": Transaction.finpath_id,
    "time": Transaction.time,
    "user_latency": Transaction.user_latency,
    "server_latency": Transaction.server_latency,
    "bank_latency": Transaction.bank_latency,
    "load": Transaction.load,
    "success": Transaction.success,
    "predicted_success": Transaction.predicted_success,
    "failure_probability": Transaction.failure_probability,
    "failed_node": Transaction.failed_node,
}


def _apply_filters(
    stmt,
    search: Optional[str],
    status_filter: Optional[str],
    predicted_filter: Optional[str],
    failed_node: Optional[str],
    hour: Optional[int],
):
    if search and search.strip():
        q = f"%{search.strip()}%"
        stmt = stmt.where(Transaction.finpath_id.ilike(q))

    if status_filter in ("success", "1"):
        stmt = stmt.where(Transaction.success == 1)
    elif status_filter in ("failed", "failure", "0"):
        stmt = stmt.where(Transaction.success == 0)

    if predicted_filter in ("success", "1"):
        stmt = stmt.where(Transaction.predicted_success == 1)
    elif predicted_filter in ("failed", "failure", "0"):
        stmt = stmt.where(Transaction.predicted_success == 0)

    if failed_node and failed_node not in ("all", "All"):
        stmt = stmt.where(Transaction.failed_node == failed_node)

    if hour is not None:
        stmt = stmt.where(Transaction.time == hour)

    return stmt


@router.get("", response_model=PaginatedTransactionsResponse)
def list_transactions(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=5, le=100, description="Items per page"),
    search: Optional[str] = Query(default=None, description="Search by Transaction ID (e.g. FP-00000120)"),
    status_filter: Optional[str] = Query(default=None, description="Filter by actual status: 'success' or 'failed'"),
    predicted_filter: Optional[str] = Query(default=None, description="Filter by predicted status: 'success' or 'failed'"),
    failed_node: Optional[str] = Query(default=None, description="Filter by failure component: 'User', 'Server', 'Bank', 'None'"),
    hour: Optional[int] = Query(default=None, ge=0, le=23, description="Filter by transaction hour (0-23)"),
    sort_by: str = Query(default="finpath_id", description="Column to sort by"),
    sort_order: str = Query(default="asc", description="Sort order: 'asc' or 'desc'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedTransactionsResponse:
    """List transactions with search, multi-column filtering, sorting, and pagination."""
    count_stmt = _apply_filters(
        select(func.count(Transaction.id)),
        search,
        status_filter,
        predicted_filter,
        failed_node,
        hour,
    )
    total = db.scalar(count_stmt) or 0

    stmt = _apply_filters(
        select(Transaction),
        search,
        status_filter,
        predicted_filter,
        failed_node,
        hour,
    )

    sort_col = ALLOWED_SORT_COLUMNS.get(sort_by, Transaction.finpath_id)
    order_fn = desc if sort_order.lower() == "desc" else asc
    stmt = stmt.order_by(order_fn(sort_col))

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    rows = db.scalars(stmt).all()

    total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

    return PaginatedTransactionsResponse(
        items=[TransactionItem.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/export")
def export_transactions_csv(
    search: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None),
    predicted_filter: Optional[str] = Query(default=None),
    failed_node: Optional[str] = Query(default=None),
    hour: Optional[int] = Query(default=None, ge=0, le=23),
    limit: int = Query(default=2000, ge=1, le=25000, description="Max rows to export"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export filtered transactions to CSV."""
    stmt = _apply_filters(
        select(Transaction),
        search,
        status_filter,
        predicted_filter,
        failed_node,
        hour,
    ).order_by(asc(Transaction.id)).limit(limit)

    rows = db.scalars(stmt).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Transaction ID",
            "Hour (UTC)",
            "User Latency (ms)",
            "Server Latency (ms)",
            "Bank Latency (ms)",
            "System Load (req/s)",
            "Actual Status",
            "Predicted Status",
            "Success Probability",
            "Failure Probability",
            "Actual Failure Component",
            "Predicted Failure Component",
        ]
    )
    for r in rows:
        writer.writerow(
            [
                r.finpath_id,
                f"{r.time:02d}:00",
                r.user_latency,
                r.server_latency,
                r.bank_latency,
                r.load,
                "Success" if r.success == 1 else "Failed",
                "Success" if r.predicted_success == 1 else "Failed",
                r.success_probability,
                r.failure_probability,
                r.failed_node,
                r.predicted_failed_node,
            ]
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="finpath_transactions_export.csv"'},
    )


@router.get("/{transaction_id}", response_model=TransactionDetailResponse)
def get_transaction_detail(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionDetailResponse:
    """
    Retrieve full transaction details by `finpath_id` (or numeric ID) along with
    live Model 1 & Model 2 evaluation and training-distribution percentile comparison.
    """
    tx = db.scalar(select(Transaction).where(Transaction.finpath_id == transaction_id))
    if not tx and transaction_id.isdigit():
        tx = db.scalar(select(Transaction).where(Transaction.id == int(transaction_id)))

    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction '{transaction_id}' not found.",
        )

    live_analysis = ml_engine.full_analysis(
        time=tx.time,
        user_latency=tx.user_latency,
        server_latency=tx.server_latency,
        bank_latency=tx.bank_latency,
        load=tx.load,
    )
    return TransactionDetailResponse(
        transaction=TransactionItem.model_validate(tx),
        live_analysis=live_analysis,
    )

