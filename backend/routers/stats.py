from fastapi import APIRouter
from config import VALID_STATUSES, VALID_CATEGORIES
from database import get_db_connection

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def get_dashboard_stats():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) as total FROM orders")
    total_orders = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) as total FROM customers")
    total_customers = cur.fetchone()["total"]

    cur.execute("SELECT COALESCE(SUM(quantity), 0) as total FROM order_items")
    total_pcs = cur.fetchone()["total"]

    status_counts = {st: 0 for st in VALID_STATUSES}
    cur.execute("SELECT status, COUNT(*) as cnt FROM orders GROUP BY status")
    for r in cur.fetchall():
        status_counts[r["status"]] = r["cnt"]

    category_counts = {cat: 0 for cat in VALID_CATEGORIES}
    cur.execute("SELECT category, COUNT(*) as cnt FROM orders GROUP BY category")
    for r in cur.fetchall():
        category_counts[r["category"]] = r["cnt"]

    conn.close()
    return {
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_pcs": total_pcs,
        "by_status": status_counts,
        "by_category": category_counts,
    }

