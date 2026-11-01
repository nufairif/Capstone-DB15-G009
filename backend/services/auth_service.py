import hashlib
import secrets


def hash_password(raw_password: str) -> str:
    """Mengembalikan SHA-256 hash dari password teks mentah."""
    return hashlib.sha256(raw_password.encode("utf-8")).hexdigest()


def generate_session_token() -> str:
    """Membuat token sesi acak aman untuk autentikasi."""
    return f"frz_{secrets.token_hex(16)}"

