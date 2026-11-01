import sqlite3
from config import DB_PATH, SCHEMA_PATH
from services.auth_service import hash_password


def get_db_connection() -> sqlite3.Connection:
    """Membuka koneksi ke database SQLite lokal dengan row factory dictionary."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db_and_seed():
    """Inisialisasi tabel SQLite berdasarkan schema.sql dan seed data awal Toko Firaza jika kosong."""
    conn = get_db_connection()
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())

    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM users")
    if cur.fetchone()["cnt"] == 0:
        users_seed = [
            (
                "admin",
                "admin@firaza.id",
                hash_password("admin123"),
                "Admin Firaza",
                "Super Admin",
            ),
            (
                "produksi",
                "produksi@firaza.id",
                hash_password("firaza2026"),
                "Farhan (Produksi)",
                "Production Lead",
            ),
            (
                "cs",
                "cs@firaza.id",
                hash_password("cs123"),
                "Rina (Customer Service)",
                "CS & Order Specialist",
            ),
        ]
        cur.executemany(
            "INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)",
            users_seed,
        )
        conn.commit()

    cur.execute("SELECT COUNT(*) as cnt FROM orders")
    if cur.fetchone()["cnt"] == 0:
        customers_seed = [
            ("Rina Wati", "081234567890", "rina.wati@email.com", "Jl. Dago No. 45, Bandung"),
            ("Farhan Nufairi", "085711223344", "farhan@email.com", "Jl. Sudirman No. 12, Jakarta Selatan"),
            ("Budi Santoso", "081399887766", "budi.santoso@email.com", "Jl. Malioboro No. 88, Yogyakarta"),
            ("Siti Aminah", "082144556677", "siti.aminah@email.com", "Jl. Diponegoro No. 19, Surabaya"),
            ("Dr. Andika Pratama", "087812341234", "andika.dr@email.com", "Jl. Pemuda No. 10, Semarang"),
        ]
        cur.executemany(
            "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)",
            customers_seed,
        )

        orders_seed = [
            (
                "FRZ-2026-001",
                1,
                "Assalamualaikum kak, saya Rina mau pesen hampers pernikahan 2 paket wrn navy. Isinya handuk custom uk dewasa bdr nama 'Nabila & Dimas' font sambung di tengah bawah. Sekalian kartu ucapan selamat menikah dari Rina ya.",
                "Hampers",
                0.98,
                "New",
                1,
                "Pernikahan",
                "Rina Wati",
                "Nabila & Dimas",
                "Selamat menempuh hidup baru untuk Nabila & Dimas. Semoga cinta dan kasih sayang selalu menyertai langkah kalian menuju keluarga yang sakinah, mawaddah, warahmah. Salam hangat dari Rina Wati.",
                "Kirim pakai box eksklusif pita satin biru navy",
            ),
            (
                "FRZ-2026-002",
                2,
                "Halo min, mau order sjdh custom dewasa 3 pcs wrn hijau emerald. Bdr nama 'H. Ahmad Dahlan' pake font kaligrafi arab di pojok kanan bawah ya. Atas nama Farhan.",
                "Custom Sajadah",
                0.96,
                "Design/Preparation",
                0,
                None,
                None,
                None,
                None,
                "Benang bordir warna emas (gold) kontras",
            ),
            (
                "FRZ-2026-003",
                3,
                "Pagi kak, pesen handuk mandi custom uk 70x140 wrn maroon 4 pcs. Bordir tulisan 'Keluarga Budi' font kapital semua di bagian list bawah handuk.",
                "Custom Handuk",
                0.95,
                "Production",
                0,
                None,
                None,
                None,
                None,
                "Bahan katun bambu 550 gsm",
            ),
            (
                "FRZ-2026-004",
                4,
                "Kak mau beli sajadah travel ready stock warna dusty pink 5 pcs polos aja ga usah bordir nama. Atas nama Siti.",
                "Ready Stock",
                0.99,
                "Completed",
                0,
                None,
                None,
                None,
                None,
                "Pengiriman instan GoSend",
            ),
            (
                "FRZ-2026-005",
                5,
                "Assalamualaikum min, pesen paket souvenir hampers tasyakuran 15 paket warna cream ukuran reguler. Bordir tulisan 'Keluarga Dr. Andika' font serif klasik di tengah bawah. Sekalian kartu ucapan tasyakuran pindah rumah.",
                "Hampers",
                0.97,
                "Design/Preparation",
                1,
                "Tasyakuran Pindah Rumah",
                "Dr. Andika Pratama",
                "Sahabat & Keluarga",
                "Bingkisan spesial di momen Tasyakuran Pindah Rumah ini. Semoga bermanfaat dan selalu membawa kebahagiaan serta keberkahan. Salam hangat dari Dr. Andika Pratama.",
                "Partai souvenir 15 box",
            ),
        ]
        cur.executemany(
            """
            INSERT INTO orders (
                order_code, customer_id, raw_message, category, ai_confidence, status,
                greeting_card_requested, greeting_occasion, greeting_sender,
                greeting_recipient, greeting_draft, additional_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            orders_seed,
        )

        items_seed = [
            (1, "Hampers Handuk Custom", 2, "Navy", "Dewasa 70x140", "Nabila & Dimas", "Sambung (Script)", "Tengah bawah"),
            (2, "Sajadah Turki Custom", 3, "Hijau Emerald", "Dewasa 70x110", "H. Ahmad Dahlan", "Kaligrafi Arab", "Pojok kanan bawah"),
            (3, "Handuk Mandi Custom", 4, "Maroon", "70x140", "Keluarga Budi", "Kapital", "Di bagian list bawah handuk"),
            (4, "Sajadah Travel Polos", 5, "Dusty Pink", "Travel 50x100", None, None, "Polos tanpa bordir"),
            (5, "Souvenir Hampers Tasyakuran", 15, "Cream", "Reguler", "Keluarga Dr. Andika", "Serif Klasik", "Tengah bawah"),
        ]
        cur.executemany(
            """
            INSERT INTO order_items (
                order_id, product_type, quantity, color, size, custom_text, font_style, layout_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            items_seed,
        )
        conn.commit()
    conn.close()

