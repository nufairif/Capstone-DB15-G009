from typing import Optional
from fastapi import APIRouter, HTTPException
from database import get_db_connection
from models.schemas import CustomerPayload

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("")
def list_customers(search: Optional[str] = None):
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
        SELECT c.*, COUNT(o.id) as total_orders
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
    """
    params = []
    if search:
        query += " WHERE (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.address LIKE ?)"
        s_like = f"%{search}%"
        params.extend([s_like, s_like, s_like, s_like])

    query += """
        GROUP BY c.id
        ORDER BY c.id DESC
    """
    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


@router.post("")
def create_customer(payload: CustomerPayload):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)",
        (payload.name, payload.phone, payload.email, payload.address),
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.execute("SELECT * FROM customers WHERE id = ?", (new_id,))
    created = dict(cur.fetchone())
    conn.close()
    return created


@router.put("/{customer_id}")
def update_customer(customer_id: int, payload: CustomerPayload):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM customers WHERE id = ?", (customer_id,))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Customer tidak ditemukan")

    cur.execute(
        "UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?",
        (payload.name, payload.phone, payload.email, payload.address, customer_id),
    )
    conn.commit()
    cur.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    updated = dict(cur.fetchone())
    conn.close()
    return updated


@router.delete("/{customer_id}")
def delete_customer(customer_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": customer_id}

