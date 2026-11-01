-- ============================================================================
-- SQL Schema (DDL) — AI-Assisted Custom Order Management Toko Firaza (DB15-G009)
-- Kompatibel dengan PostgreSQL, MySQL, dan SQLite
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(60) NOT NULL DEFAULT 'Admin Operasional',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(120),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code VARCHAR(32) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    raw_message TEXT,
    category VARCHAR(40) NOT NULL DEFAULT 'Custom Sajadah',
    ai_confidence REAL DEFAULT 0.95,
    status VARCHAR(32) NOT NULL DEFAULT 'New',
    greeting_card_requested BOOLEAN DEFAULT 0,
    greeting_occasion VARCHAR(100),
    greeting_sender VARCHAR(120),
    greeting_recipient VARCHAR(120),
    greeting_draft TEXT,
    additional_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_type VARCHAR(120) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    color VARCHAR(60),
    size VARCHAR(60),
    custom_text VARCHAR(120),
    font_style VARCHAR(80),
    layout_notes VARCHAR(150),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
