from fastapi import APIRouter, HTTPException
from database import get_db_connection
from models.schemas import LoginPayload
from services.auth_service import hash_password, generate_session_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login_user(payload: LoginPayload):
    conn = get_db_connection()
    cur = conn.cursor()
    ident = payload.username.strip().lower()
    pw_hash = hash_password(payload.password)

    cur.execute(
        """
        SELECT id, username, email, full_name, role
        FROM users
        WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND password_hash = ?
        """,
        (ident, ident, pw_hash),
    )
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=401,
            detail="Username/Email atau password tidak sesuai.",
        )

    user_data = dict(row)
    return {
        "status": "authenticated",
        "token": generate_session_token(),
        "user": user_data,
    }


@router.post("/logout")
def logout_user():
    return {"status": "logged_out", "message": "Sesi berhasil diakhiri."}

