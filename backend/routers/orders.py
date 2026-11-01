import sqlite3
from datetime import datetime
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException

from config import VALID_STATUSES
from database import get_db_connection
from models.schemas import OrderCreatePayload, OrderItemPayload, StatusUpdatePayload

router = APIRouter(prefix="/api/orders", tags=["orders"])


def fetch_order_with_items(conn: sqlite3.Connection, order_row: sqlite3.Row) -> Dict[str, object]:
    """Helper untuk mengambil relasi order_items dan memformat objek pesanan."""
    order_dict = dict(order_row)
    cur = conn.cursor()
    cur.execute("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC", (order_dict["id"],))
    items = [dict(r) for r in cur.fetchall()]
    order_dict["items"] = items
    order_dict["greeting_card_requested"] = bool(order_dict.get("greeting_card_requested"))
    return order_dict


@router.get("")
def list_orders(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    conn = get_db_connection()
    cur = conn.cursor()

    query = """
        SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE 1=1
    """
    params = []

    if status and status != "ALL":
        query += " AND o.status = ?"
        params.append(status)
    if category and category != "ALL":
        query += " AND o.category = ?"
        params.append(category)
    if search:
        query += " AND (c.name LIKE ? OR o.order_code LIKE ? OR o.raw_message LIKE ?)"
        s_like = f"%{search}%"
        params.extend([s_like, s_like, s_like])

    query += " ORDER BY o.id DESC"
    cur.execute(query, params)
    order_rows = cur.fetchall()

    results = [fetch_order_with_items(conn, r) for r in order_rows]
    conn.close()
    return results


@router.get("/{order_id}")
def get_order_detail(order_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
        """,
        (order_id,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")

    result = fetch_order_with_items(conn, row)
    conn.close()
    return result


@router.post("")
def create_order(payload: OrderCreatePayload):
    conn = get_db_connection()
    cur = conn.cursor()

    # Cari atau buat customer
    customer_id = payload.customer_id
    if not customer_id:
        cur.execute("SELECT id FROM customers WHERE LOWER(name) = LOWER(?)", (payload.customer_name.strip(),))
        existing = cur.fetchone()
        if existing:
            customer_id = existing["id"]
        else:
            cur.execute(
                "INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)",
                (payload.customer_name.strip(), payload.customer_phone, payload.customer_address),
            )
            customer_id = cur.lastrowid

    # Buat kode unik pesanan
    cur.execute("SELECT COUNT(*) as cnt FROM orders")
    next_num = cur.fetchone()["cnt"] + 1
    order_code = f"FRZ-2026-{next_num:03d}-{int(datetime.now().timestamp()) % 1000:03d}"

    cur.execute(
        """
        INSERT INTO orders (
            order_code, customer_id, raw_message, category, ai_confidence, status,
            greeting_card_requested, greeting_occasion, greeting_sender,
            greeting_recipient, greeting_draft, additional_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            order_code,
            customer_id,
            payload.raw_message,
            payload.category,
            payload.ai_confidence,
            payload.status if payload.status in VALID_STATUSES else "New",
            1 if payload.greeting_card_requested else 0,
            payload.greeting_occasion,
            payload.greeting_sender,
            payload.greeting_recipient,
            payload.greeting_draft,
            payload.additional_notes,
        ),
    )
    order_id = cur.lastrowid
    if order_id is None:
        conn.close()
        raise HTTPException(status_code=500, detail="Gagal membuat pesanan baru")

    items_to_insert = payload.items or [
        OrderItemPayload(product_type=payload.category, quantity=1)
    ]
    for item in items_to_insert:
        cur.execute(
            """
            INSERT INTO order_items (
                order_id, product_type, quantity, color, size, custom_text, font_style, layout_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order_id,
                item.product_type,
                item.quantity,
                item.color,
                item.size,
                item.custom_text,
                item.font_style,
                item.layout_notes,
            ),
        )

    conn.commit()
    conn.close()
    return get_order_detail(order_id)


@router.put("/{order_id}")
def update_order(order_id: int, payload: OrderCreatePayload):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
    existing_order = cur.fetchone()
    if not existing_order:
        conn.close()
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")

    # Update nama/telepon customer terkait
    cur.execute(
        "UPDATE customers SET name = ?, phone = COALESCE(?, phone) WHERE id = ?",
        (payload.customer_name, payload.customer_phone, existing_order["customer_id"]),
    )

    cur.execute(
        """
        UPDATE orders SET
            raw_message = ?,
            category = ?,
            status = ?,
            greeting_card_requested = ?,
            greeting_occasion = ?,
            greeting_sender = ?,
            greeting_recipient = ?,
            greeting_draft = ?,
            additional_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (
            payload.raw_message,
            payload.category,
            payload.status if payload.status in VALID_STATUSES else existing_order["status"],
            1 if payload.greeting_card_requested else 0,
            payload.greeting_occasion,
            payload.greeting_sender,
            payload.greeting_recipient,
            payload.greeting_draft,
            payload.additional_notes,
            order_id,
        ),
    )

    # Ganti daftar item
    cur.execute("DELETE FROM order_items WHERE order_id = ?", (order_id,))
    for item in payload.items:
        cur.execute(
            """
            INSERT INTO order_items (
                order_id, product_type, quantity, color, size, custom_text, font_style, layout_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order_id,
                item.product_type,
                item.quantity,
                item.color,
                item.size,
                item.custom_text,
                item.font_style,
                item.layout_notes,
            ),
        )

    conn.commit()
    conn.close()
    return get_order_detail(order_id)


@router.patch("/{order_id}/status")
def update_order_status(order_id: int, payload: StatusUpdatePayload):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status harus salah satu dari {VALID_STATUSES}")

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (payload.status, order_id),
    )
    conn.commit()
    conn.close()
    return get_order_detail(order_id)


@router.delete("/{order_id}")
def delete_order(order_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM order_items WHERE order_id = ?", (order_id,))
    cur.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": order_id}

