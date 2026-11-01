import csv
import json
import random
from pathlib import Path

from src.llm_extractor import generate_greeting_card_template

RANDOM_SEED = 42
random.seed(RANDOM_SEED)

GREETINGS = [
    "Halo kak", "Assalamualaikum min", "Pagi kak", "Siang sis", "Malam min",
    "Permisi kak", "Halo admin Firaza", "Kak mau tanya dong", "Min mau order",
    "Kak", "Sis", "Bun", "Assalamu'alaikum kak", "Halo min, mau pesen",
    "Permisi min", "Sore kak", "Kak admin", "Halo Firaza",
]

COLORS = [
    "navy", "maroon", "hijau emerald", "hitam", "putih tulang", "cream",
    "coklat susu", "abu-abu", "dusty pink", "sage green", "biru muda",
    "ungu lilac", "gold", "tosca", "terracotta", "burgundy", "olive", "mocca",
]

NAMES = [
    "Budi Santoso", "Siti Aminah", "Rizky Pratama", "Aisyah Putri", "Keluarga Hendra",
    "Nabila & Dimas", "H. Ahmad Dahlan", "Hj. Fatimah", "Farhan Nufairi", "Mikail Zakaria",
    "Guruh Hizbullah", "Anisa Rahma", "Daffa Putra", "Zahra Aulia", "Bapak Suharto",
    "Ibu Kartini", "Dr. Andika", "Ustadz Yusuf", "Keluarga Besar Sutrisno", "Rina Wati",
    "Hendri & Lestari", "Keluarga Bpk. Bambang", "Dewi Sartika", "Fajar Nugroho",
    "Ilham Ramadhan", "Putri Maharani", "Syifa Hadju", "Reza Rahadian", "Taufik Hidayat",
    "H. Sulaiman", "Hj. Khadijah", "dr. Nadia", "Ir. Kurniawan", "Alya & Bagas",
]

FONTS = [
    "sambung", "script", "kapital semua", "huruf balok", "kaligrafi arab",
    "latin tegak", "font nomor 2", "font elegan", "monoline", "serif klasik",
]

LAYOUTS = [
    "pojok kanan bawah", "tengah atas", "bawah tengah", "pojok kiri bawah",
    "di bagian kubah sajadah", "di list bawah handuk", "posisi standar tengah",
]

OCCASIONS = [
    "pernikahan", "tasyakuran pernikahan", "ulang tahun", "lebaran idul fitri",
    "pulang haji / umroh", "aqiqah anak", "kelulusan wisuda", "anniversary",
    "kenang-kenangan kantor", "tahlilan 40 hari", "pindah rumah baru",
]

PHONES = [
    "081234567890", "085711223344", "081399887766", "082144556677",
    "087812341234", "089655443322", None, None, None,
]


def inject_realistic_slang_and_typo(text: str, prob: float = 0.5) -> str:
    """Mengubah sebagian kata menjadi singkatan belanja online / typo realistis."""
    if random.random() > prob:
        return text

    replacements = [
        ("warna", random.choice(["wrn", "wrna", "warnanya", "kelir"])),
        ("ukuran", random.choice(["uk", "ukrn", "size", "sz"])),
        ("bordir", random.choice(["bdr", "bordr", "tulisan", "ukir nama"])),
        ("sajadah", random.choice(["sjdh", "sajdah", "sejadah"])),
        ("handuk", random.choice(["hndk", "handk", "anduk"])),
        ("hampers", random.choice(["hmpers", "hamper", "paket kado", "gift box"])),
        ("ready stock", random.choice(["rdy", "ready", "stok ready", "polosan"])),
        ("berapa", random.choice(["brp", "brpa"])),
        ("dengan", random.choice(["dgn", "ama", "sama"])),
        ("untuk", random.choice(["utk", "buat", "bt"])),
        ("terima kasih", random.choice(["makasih", "mksh", "thx", "tks"])),
        ("pesanan", random.choice(["psnan", "orderan"])),
        ("kartu ucapan", random.choice(["kartu ucpan", "greeting card", "krtu ucapan", "kartu"])),
    ]

    modified = text
    for old, new in replacements:
        if old in modified.lower() and random.random() < 0.55:
            idx = modified.lower().find(old)
            if idx != -1:
                modified = modified[:idx] + new + modified[idx + len(old):]
    return modified


def generate_ready_stock_sample(hard: bool = False) -> str:
    g = random.choice(GREETINGS)
    color = random.choice(COLORS)
    qty = random.choice([1, 2, 3, 4, 5, 6, 10, 12, 20])
    item = random.choice([
        "sajadah travel", "sajadah dewasa", "sajadah turki bulu",
        "handuk mandi dewasa", "handuk muka", "handuk olahraga",
        "sajadah anak", "handuk microfiber", "handuk hotel",
    ])
    if hard:
        # Kasus menantang: menyebut kata 'bordir' atau 'hampers' dalam bentuk negasi
        hard_templates = [
            f"{g}, kemarin aku liat ada {item} custom bordir, tapi aku mau beli {qty} pcs warna {color} yang polosan aja tanpa bordir nama dan bukan hampers ya.",
            f"Min, {item} warna {color} kalau ga usah dibordir nama dan gak pake box hampers bisa langsung kirim instan hari ini kan? Mau {qty} pcs.",
            f"{g}, butuh {qty} biji {item} warna {color} buru-buru buat dipakai sendiri, jadi ambil yang stok langsung kirim aja ga pake ukir tulisan.",
            f"Kak, {item} {color} {qty} pcs ga pake nama, kirim ke Bandung hari ini ready?",
        ]
        return inject_realistic_slang_and_typo(random.choice(hard_templates), prob=0.6)

    templates = [
        f"{g}, {item} warna {color} yang ready stock tanpa bordir ada {qty} pcs? Mau langsung dikirim hari ini.",
        f"{g}, mau beli {item} polosan aja ga usah pake nama, warna {color} {qty} biji ready kan?",
        f"Order ready stock ya min:\nProduk: {item}\nWarna: {color}\nJumlah: {qty} pcs (polos tanpa custom).",
        f"{g} stok {item} warna {color} masih ada? Aku mau ambil {qty} pcs yang ready aja biar cepet sampe.",
        f"Beli {item} {qty} pcs warna {color} polos gak pake bordir nama ya kak, kirim instan bisa?",
        f"{g}, kalau {item} yang ready stock tanpa ukir nama harga satuan berapa? Mau pesen {qty} warna {color}.",
    ]
    return inject_realistic_slang_and_typo(random.choice(templates))


def generate_custom_sajadah_sample(hard: bool = False) -> str:
    g = random.choice(GREETINGS)
    color = random.choice(COLORS)
    qty = random.choice([1, 2, 3, 4, 5, 8, 10])
    name = random.choice(NAMES)
    font = random.choice(FONTS)
    layout = random.choice(LAYOUTS)
    size = random.choice(["dewasa", "travel", "anak", "besar 70x110", "reguler", "turki 70x120"])

    if hard:
        hard_templates = [
            f"{g}, yang alas sholat ukuran {size} warna {color} mau dikasih nama '{name}' {qty} pcs ya, hurufnya {font} di {layout}. Gak usah pake box kado.",
            f"Min, awalnya mau beli handuk tapi ga jadi, jadinya pesen sajadah {size} warna {color} {qty} pcs aja dibordir '{name}' font {font}.",
            f"Pesanan baru: {qty}x sajadah {size} ({color}) -> tulis '{name}' [{font}, {layout}]. Bukan paket hampers ya min.",
            f"{g}, sajadah {color} yang ready bisa sekalian ditambahin bordir nama '{name}' gak? Mau {qty} pcs ukuran {size} font {font}.",
        ]
        return inject_realistic_slang_and_typo(random.choice(hard_templates), prob=0.6)

    templates = [
        f"{g}, mau pesen sajadah custom ukuran {size} warna {color} {qty} pcs. Bordir nama '{name}' pake font {font} di {layout} ya.",
        f"Format Order Sajadah Custom:\n- Jumlah: {qty} pcs\n- Warna: {color}\n- Ukuran: {size}\n- Tulisan bordir: {name}\n- Font: {font}\n- Posisi: {layout}",
        f"{g} pesen sajadah bordir nama dong {qty} biji. Warnanya {color}, tulisannya '{name}', hurufnya {font} taruh di {layout}.",
        f"Mau custom sajadah {size} kak, warna {color} jumlah {qty}. Nama yang dicetak: {name} (font {font}). Jangan salah eja ya min.",
        f"{g}, bikinin sajadah pake nama '{name}' dong {qty} pcs warna {color}. Posisi tulisannya di {layout} pake font {font}.",
        f"Order sajadah personalisasi {qty} pcs warna {color} ukuran {size}, request bordir nama {name} font {font}.",
    ]
    return inject_realistic_slang_and_typo(random.choice(templates))


def generate_custom_handuk_sample(hard: bool = False) -> str:
    g = random.choice(GREETINGS)
    color = random.choice(COLORS)
    qty = random.choice([1, 2, 3, 4, 5, 6, 12])
    name = random.choice(NAMES)
    font = random.choice(FONTS)
    layout = random.choice(LAYOUTS)
    size = random.choice(["mandi dewasa 70x140", "tanggung 50x100", "olahraga 30x70", "bayi", "jumbo"])

    if hard:
        hard_templates = [
            f"{g}, kemarin udah beli sajadah, sekarang mau pesen handuk {size} warna {color} {qty} pcs pake ukir nama '{name}' font {font} ya.",
            f"Min, handuk {color} {size} yang biasa dipakai di hotel itu tolong kasih tulisan '{name}' di {layout} sebanyak {qty} pcs. Tanpa box hampers ya.",
            f"Order {qty} pcs handuk katun bambu {color} uk {size}, tambah jahit nama '{name}' huruf {font} di {layout}.",
            f"{g}, kalo handuk ready stock warna {color} minta dibordir nama '{name}' {qty} biji bisa selesai besok? Pake font {font} ya.",
        ]
        return inject_realistic_slang_and_typo(random.choice(hard_templates), prob=0.6)

    templates = [
        f"{g}, mau order handuk custom ukuran {size} warna {color} {qty} pcs, bordir nama '{name}' font {font} di {layout}.",
        f"Pesen handuk bordir nama ya kak:\nJumlah: {qty} pcs\nUkuran: {size}\nWarna: {color}\nNama di handuk: {name}\nFont: {font}",
        f"{g} mau bikin handuk pake nama '{name}' {qty} pcs warna {color}. Ukuran {size} ya, tulisannya pake huruf {font} di {layout}.",
        f"Min, order handuk personalisasi warna {color} ({size}) sebanyak {qty} pcs. Bordir tulisan: {name}, gaya font {font}.",
        f"{g}, kalau handuk {size} warna {color} dibordir nama '{name}' {qty} pcs bisa selesai kapan? Sekalian aku pesen ya font {font}.",
        f"Mau pesen handuk mandi custom {qty} biji warna {color}, bordir nama {name} di {layout} pake font {font} ya kak.",
    ]
    return inject_realistic_slang_and_typo(random.choice(templates))


def generate_hampers_sample(hard: bool = False) -> str:
    g = random.choice(GREETINGS)
    color = random.choice(COLORS)
    qty = random.choice([1, 2, 3, 5, 10, 15, 20, 25])
    recipient = random.choice(NAMES)
    sender = random.choice(NAMES)
    occasion = random.choice(OCCASIONS)
    font = random.choice(FONTS)
    paket = random.choice([
        "hampers sajadah & handuk", "paket kado handuk couple", "hampers lebaran sajadah",
        "box hampers pernikahan", "souvenir hampers tasyakuran", "paket gift set sajadah",
    ])

    if hard:
        hard_templates = [
            f"{g}, mau pesen sajadah sama handuk warna {color} {qty} set yang dikemas pake hardbox pita sama kartu ucapan buat {occasion} untuk '{recipient}' dari {sender}.",
            f"Min, bikinin bingkisan kado {occasion} isi handuk bordir '{recipient}' warna {color} {qty} paket lengkap sama box eksklusif dan ucapan dari {sender}.",
            f"Aku mau order {qty} paket souvenir {occasion} warna {color}, dalamnya dibordir '{recipient}' font {font} plus selipin kartu dari {sender} ya.",
        ]
        return inject_realistic_slang_and_typo(random.choice(hard_templates), prob=0.6)

    templates = [
        f"{g}, mau pesen {paket} {qty} box warna {color}. Bordir nama '{recipient}' font {font}. Sekalian kartu ucapan buat acara {occasion} dari {sender} ya.",
        f"Order Hampers Firaza:\n- Paket: {paket} ({qty} paket)\n- Warna: {color}\n- Custom Nama: {recipient}\n- Request Kartu Ucapan: Acara {occasion}, penerima {recipient}, pengirim {sender}.",
        f"{g} mau beli {paket} buat kado {occasion} {qty} set warna {color}. Tolong bordir nama '{recipient}' sama bikinin kartu ucapan yang manis dari {sender}.",
        f"Min, pesen {qty} box {paket} warna {color}. Di produknya bordir '{recipient}' (font {font}), terus selipin greeting card tema {occasion} atas nama {sender}.",
        f"{g}, butuh {paket} {qty} paket warna {color} untuk {occasion}. Nama di bordir: {recipient}. Jangan lupa kartu ucapannya ya kak dari {sender} buat {recipient}.",
    ]
    return inject_realistic_slang_and_typo(random.choice(templates))


def generate_other_sample(hard: bool = False) -> str:
    g = random.choice(GREETINGS)
    color = random.choice(COLORS)
    if hard:
        hard_templates = [
            f"{g}, pesanan handuk custom bordir nama saya yang warna {color} kemarin kok resinya belum jalan-jalan ya di ekspedisi?",
            f"Min, kalau sajadah custom warna {color} yang udah dibordir itu cara nyucinya boleh pake mesin cuci gak biar gak rusak?",
            f"{g}, katalog harga paket hampers lebaran sama pilihan warna handuk dewasa bisa minta dikirim brosur PDF-nya dulu gak buat dirapatin di kantor?",
            f"Kak, toko offline Firaza yang jual sajadah dan handuk custom di Bandung itu sebelah mana ya? Mau mampir liat bahan dulu.",
        ]
        return inject_realistic_slang_and_typo(random.choice(hard_templates), prob=0.6)

    templates = [
        f"{g}, lokasi toko offline Firaza di sebelah mana ya? Bisa dateng langsung gak?",
        f"{g}, kalau kirim ke Surabaya kira-kira ongkirnya berapa per kg dan pake ekspedisi apa?",
        f"Min, resi pesanan saya yang kemarin atas nama Budi kok belum update ya di aplikasi?",
        f"{g}, toko buka dari jam berapa sampai jam berapa? Hari minggu libur atau tetap buka?",
        f"Kak ada lowongan kerja buat bagian admin atau jahit bordir gak di Toko Firaza?",
        f"{g}, cara pencucian sajadah dan handuk bordir biar benangnya awet dan gak luntur gimana ya?",
        f"Min, pembayaran bisa lewat transfer bank apa aja? Bisa COD gak kalau daerah Bandung?",
        f"{g}, katalog warna dan pilihan font lengkapnya bisa dilihat di mana ya? Boleh minta PDF-nya?",
        f"Halo kak, pesanan saya kemarin salah satu warnanya ketuker, prosedur retur atau tukar barang gimana ya?",
        f"{g}, kalau mau jadi reseller atau dropshipper Toko Firaza syaratnya apa aja min?",
    ]
    return inject_realistic_slang_and_typo(random.choice(templates))


CATEGORY_GENERATORS = {
    "Ready Stock": generate_ready_stock_sample,
    "Custom Sajadah": generate_custom_sajadah_sample,
    "Custom Handuk": generate_custom_handuk_sample,
    "Hampers": generate_hampers_sample,
    "Other": generate_other_sample,
}


def build_classification_datasets(train_per_class: int = 480, test_per_class: int = 120):
    """
    Membuat dataset klasifikasi skala penuh:
    - Train: 480 x 5 = 2.400 baris
    - Test : 120 x 5 = 600 baris
    Total  : 3.000 baris (dengan 20% kalimat menantang/ambigu).
    """
    train_rows = []
    test_rows = []

    for category, gen_fn in CATEGORY_GENERATORS.items():
        for i in range(train_per_class):
            is_hard = (i % 5 == 0)  # 20% sampel hard/ambiguous
            train_rows.append({"text": gen_fn(hard=is_hard), "category": category})
        for i in range(test_per_class):
            is_hard = (i % 5 == 0)
            test_rows.append({"text": gen_fn(hard=is_hard), "category": category})

    random.shuffle(train_rows)
    random.shuffle(test_rows)
    return train_rows, test_rows


def _create_single_extraction_record(record_id: str, idx: int) -> dict:
    """Membuat 1 record JSON ekstraksi yang kaya dan bervariasi."""
    categories = ["Custom Sajadah", "Custom Handuk", "Hampers", "Ready Stock", "Other"]
    cat = categories[idx % len(categories)]

    sender = NAMES[idx % len(NAMES)]
    recipient = NAMES[(idx + 7) % len(NAMES)]
    color = COLORS[idx % len(COLORS)].title()
    font = FONTS[idx % len(FONTS)].title()
    layout = LAYOUTS[idx % len(LAYOUTS)].capitalize()
    occasion = OCCASIONS[idx % len(OCCASIONS)].title()
    phone = PHONES[idx % len(PHONES)]
    qty = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20][idx % 10]

    if cat == "Other":
        raw_msg = generate_other_sample(hard=(idx % 4 == 0))
        return {
            "id": record_id,
            "raw_message": raw_msg,
            "expected_category": "Other",
            "expected_extraction": {
                "customer_name": None,
                "customer_phone": None,
                "order_status": "New",
                "items": [],
                "greeting_card": {
                    "is_requested": False,
                    "occasion": None,
                    "sender_name": None,
                    "recipient_name": None,
                    "draft_message": None,
                },
                "additional_notes": "Pertanyaan umum pelanggan",
            },
        }

    if cat == "Ready Stock":
        prod = "Sajadah Travel" if idx % 2 == 0 else "Handuk Mandi Polos"
        size = "Travel" if idx % 2 == 0 else "Dewasa"
        raw_msg = (
            f"Halo kak, saya {sender} mau pesan {prod} warna {color} ukuran {size} "
            f"sebanyak {qty} pcs yang ready stock polos tanpa bordir nama ya."
        )
        return {
            "id": record_id,
            "raw_message": inject_realistic_slang_and_typo(raw_msg, prob=0.35),
            "expected_category": "Ready Stock",
            "expected_extraction": {
                "customer_name": sender,
                "customer_phone": phone,
                "order_status": "New",
                "items": [
                    {
                        "product_type": prod,
                        "quantity": qty,
                        "color": color,
                        "size": size,
                        "custom_text": None,
                        "font_style": None,
                        "layout_notes": None,
                    }
                ],
                "greeting_card": {
                    "is_requested": False,
                    "occasion": None,
                    "sender_name": None,
                    "recipient_name": None,
                    "draft_message": None,
                },
                "additional_notes": "Pesanan ready stock langsung kirim",
            },
        }

    if cat == "Hampers":
        prod = "Hampers Custom Firaza"
        size = ["Dewasa", "70x140", "Reguler", "Travel"][idx % 4]
        raw_msg = (
            f"Assalamualaikum min, saya {sender} mau pesen hampers {occasion.lower()} {qty} paket "
            f"warna {color.lower()} ukuran {size}. Bordir tulisan '{recipient}' pake font {font.lower()} "
            f"di {layout.lower()}. Tolong buatkan kartu ucapan untuk acara {occasion.lower()} dari {sender} buat {recipient}."
        )
        draft_card = generate_greeting_card_template(
            occasion=occasion,
            recipient=recipient,
            sender=sender,
        )
        return {
            "id": record_id,
            "raw_message": inject_realistic_slang_and_typo(raw_msg, prob=0.35),
            "expected_category": "Hampers",
            "expected_extraction": {
                "customer_name": sender,
                "customer_phone": phone,
                "order_status": "New",
                "items": [
                    {
                        "product_type": prod,
                        "quantity": qty,
                        "color": color,
                        "size": size,
                        "custom_text": recipient,
                        "font_style": font,
                        "layout_notes": layout,
                    }
                ],
                "greeting_card": {
                    "is_requested": True,
                    "occasion": occasion,
                    "sender_name": sender,
                    "recipient_name": recipient,
                    "draft_message": draft_card,
                },
                "additional_notes": f"Paket hampers acara {occasion}",
            },
        }

    # Custom Sajadah atau Custom Handuk
    if cat == "Custom Sajadah":
        prod = "Sajadah Custom"
        size = ["Dewasa", "Travel", "Anak", "70x110", "Reguler"][idx % 5]
    else:
        prod = "Handuk Custom"
        size = ["70x140", "50x100", "30x70", "Dewasa", "Jumbo"][idx % 5]

    raw_msg = (
        f"Kak mau order {prod} ukuran {size} warna {color.lower()} sebanyak {qty} pcs. "
        f"Request bordir nama '{recipient}' pake font {font.lower()} posisi {layout.lower()}. "
        f"Atas nama {sender}."
    )
    return {
        "id": record_id,
        "raw_message": inject_realistic_slang_and_typo(raw_msg, prob=0.35),
        "expected_category": cat,
        "expected_extraction": {
            "customer_name": sender,
            "customer_phone": phone,
            "order_status": "New",
            "items": [
                {
                    "product_type": prod,
                    "quantity": qty,
                    "color": color,
                    "size": size,
                    "custom_text": recipient,
                    "font_style": font,
                    "layout_notes": layout,
                }
            ],
            "greeting_card": {
                "is_requested": False,
                "occasion": None,
                "sender_name": None,
                "recipient_name": None,
                "draft_message": None,
            },
            "additional_notes": None,
        },
    }


def build_extraction_datasets(train_count: int = 500, test_count: int = 100):
    """Membuat 500 data extraction_dataset.json dan 100 data extraction_test_set.json."""
    train_records = [
        _create_single_extraction_record(f"TRN-EXT-{i + 1:04d}", i)
        for i in range(train_count)
    ]
    test_records = [
        _create_single_extraction_record(f"TST-EXT-{i + 1:04d}", i + 1000)
        for i in range(test_count)
    ]
    return train_records, test_records


def build_comprehensive_knowledge_base() -> list:
    """
    Membuat 85 dokumen Knowledge Base Katalog, SKU, Harga, Aturan Font, SOP, & FAQ Toko Firaza
    untuk Vector Database pada Sistem RAG.
    """
    docs = [
        {
            "doc_id": "CAT-001",
            "title": "Katalog Utama Sajadah Custom Bordir Toko Firaza",
            "category": "Custom Sajadah",
            "content": "Sajadah Custom Toko Firaza tersedia dalam ukuran Dewasa Reguler (70x110 cm), Besar/Turki (70x120 cm), Travel Lipat (50x100 cm), dan Anak (45x90 cm). Pilihan warna: Hijau Emerald, Navy, Maroon, Hitam, Gold, Cream, Dusty Pink, Sage Green, dan Tosca. Maksimal bordir nama 25 karakter. Pilihan font: Kaligrafi Arab, Sambung (Script), Latin Tegak, dan Huruf Balok.",
        },
        {
            "doc_id": "CAT-002",
            "title": "Katalog Utama Handuk Personalisasi (Custom Bordir) Toko Firaza",
            "category": "Custom Handuk",
            "content": "Handuk Custom Toko Firaza menggunakan bahan 100% katun bambu dan microfiber premium daya serap tinggi. Ukuran tersedia: Handuk Mandi Dewasa (70x140 cm), Handuk Tanggung (50x100 cm), Handuk Olahraga/Muka (30x70 cm), dan Handuk Bayi/Jumbo. Pilihan warna: Putih Tulang, Navy, Maroon, Abu-abu, Coklat Susu, Biru Muda, Ungu Lilac, dan Terracotta. Bordir nama dapat diletakkan di bagian list bawah handuk, tengah bawah, atau pojok kanan bawah dengan pilihan font Script, Serif Klasik, Monoline, atau Kapital.",
        },
        {
            "doc_id": "CAT-003",
            "title": "Katalog Paket Hampers & Gift Set Eksklusif Toko Firaza",
            "category": "Hampers",
            "content": "Paket Hampers Toko Firaza dirancang untuk acara Pernikahan, Tasyakuran, Lebaran Idul Fitri, Pulang Haji/Umroh, Aqiqah, Ulang Tahun, dan Anniversary. Pilihan paket: (1) Hampers Sajadah & Handuk Single, (2) Paket Kado Handuk Couple (2 pcs handuk 70x140 cm), (3) Box Hampers Lebaran Sajadah Turki, dan (4) Souvenir Hampers Tasyakuran. Setiap pemesanan Hampers sudah termasuk Exclusive Hardbox, pita satin, dan Gratis Kartu Ucapan (Greeting Card) cetak custom.",
        },
        {
            "doc_id": "CAT-004",
            "title": "Katalog Produk Ready Stock (Polos Tanpa Bordir)",
            "category": "Ready Stock",
            "content": "Produk Ready Stock Toko Firaza merupakan sajadah travel, sajadah dewasa polos, handuk mandi dewasa, dan handuk microfiber tanpa kustomisasi bordir nama. Produk Ready Stock dapat langsung dikirim pada hari yang sama (same-day/instant delivery) selama pesanan masuk sebelum pukul 15.00 WIB.",
        },
        {
            "doc_id": "CAT-005",
            "title": "SOP 4 Tahap Siklus Produksi & Pelacakan Status Pesanan",
            "category": "Other",
            "content": "Setiap pesanan di Toko Firaza melewati 4 tahapan siklus produksi di Web Dashboard: (1) New: Pesanan baru dicatat dan diekstrak oleh AI dari chat pelanggan, (2) Design/Preparation: Admin memvalidasi warna, ukuran, ejaan nama bordir, pilihan font, dan draf kartu ucapan, (3) Production: Proses pembordiran komputer, quality control benang, dan pengemasan box hampers, (4) Completed: Pesanan selesai dikemas dan siap diserahkan ke kurir/pelanggan.",
        },
        {
            "doc_id": "CAT-006",
            "title": "Panduan Pencucian & Perawatan Sajadah serta Handuk Bordir",
            "category": "Other",
            "content": "Agar benang bordir nama pada sajadah dan handuk Toko Firaza tetap awet dan tidak luntur: cuci menggunakan air dingin atau hangat maksimal 30 derajat Celcius, hindari pemutih pakaian (bleach), jangan menyikat langsung area benang bordir, dan setrika dengan suhu rendah dari bagian belakang kain.",
        },
    ]

    # Tambahkan 25 dokumen SKU Spesifik Sajadah & Handuk
    sku_items = [
        ("SKU-SJD-01", "Sajadah Turki Bulu Premium Dewasa 70x120 cm", "Custom Sajadah", "Bahan bludru bulu lembut ketebalan 14mm anti-slip, cocok untuk bordir nama emas/gold di bagian kubah atas atau pojok kanan bawah. Harga Rp145.000 (sudah termasuk bordir nama 1 baris)."),
        ("SKU-SJD-02", "Sajadah Dewasa Reguler Tenun Rajut 70x110 cm", "Custom Sajadah", "Bahan tenun rajut padat ringan dengan rumbai kepang, tersedia 12 pilihan warna. Harga Rp95.000 termasuk custom bordir nama maksimal 25 karakter."),
        ("SKU-SJD-03", "Sajadah Travel Pouch Lipat Anti-Air 50x100 cm", "Custom Sajadah", "Bahan polyester taslan water-repellent dilengkapi pouch serut mini. Bordir nama bisa di sajadah sekaligus di pouch. Harga Rp65.000/pcs."),
        ("SKU-SJD-04", "Sajadah Anak Custom Karakter & Nama 45x90 cm", "Custom Sajadah", "Dirancang khusus untuk anak-anak dengan warna cerah (Biru Muda, Dusty Pink, Tosca, Sage Green) dan bordir nama font Huruf Balok atau Sambung. Harga Rp75.000/pcs."),
        ("SKU-SJD-05", "Sajadah Suede Minimalis Polos & Custom 70x110 cm", "Custom Sajadah", "Permukaan suede beludru halus tanpa motif ramai sehingga hasil bordir nama terlihat sangat kontras dan mewah. Harga Rp120.000/pcs."),
        ("SKU-HND-01", "Handuk Mandi Dewasa Katun Bambu 70x140 cm", "Custom Handuk", "Gramasi tebal 550 gsm antibakteri alami dan super lembut. Sangat populer untuk bordir nama pasangan atau individu di bagian list bawah handuk. Harga Rp135.000/pcs."),
        ("SKU-HND-02", "Handuk Tanggung Travel & Gym 50x100 cm", "Custom Handuk", "Ukuran medium praktis dibawa bepergian, bahan 100% combed cotton daya serap tinggi. Harga Rp85.000 termasuk bordir nama."),
        ("SKU-HND-03", "Handuk Olahraga & Muka Sport 30x70 cm", "Custom Handuk", "Cocok untuk souvenir komunitas olahraga, lari, tenis, atau gym dengan bordir nama di pojok kanan bawah. Harga Rp45.000/pcs (diskon grosir untuk minimal 12 pcs)."),
        ("SKU-HND-04", "Handuk Bayi Hooded & Jumbo Halus 60x120 cm", "Custom Handuk", "Hypoallergenic aman untuk kulit bayi baru lahir, sering dipesan untuk kado lahiran dan aqiqah dengan bordir nama bayi. Harga Rp110.000/pcs."),
        ("SKU-HND-05", "Handuk Hotel Luxury Putih & Warna 70x140 cm", "Custom Handuk", "Standar hotel bintang 5 gramasi 600 gsm, tersedia warna Putih Tulang, Navy, Maroon, dan Abu-abu. Harga Rp150.000/pcs."),
        ("SKU-HMP-01", "Paket Hampers Wedding Couple Handuk 70x140 (Isi 2)", "Hampers", "Berisi 2 pcs Handuk Dewasa 70x140 cm bordir nama pasangan (misal: Nabila & Dimas), dikemas dalam Exclusive Hardbox berpita satin + Gratis Kartu Ucapan Pernikahan. Harga Rp295.000/box."),
        ("SKU-HMP-02", "Paket Hampers Lebaran Idul Fitri Sajadah & Tasbih", "Hampers", "Berisi 1 Sajadah Turki Custom Bordir Nama + Tasbih Kayu Kokka 33 butir + Hardbox Edisi Ramadhan + Kartu Ucapan Lebaran. Harga Rp185.000/box."),
        ("SKU-HMP-03", "Paket Hampers Sajadah & Handuk Single Eksklusif", "Hampers", "Kombinasi 1 Sajadah Reguler Custom + 1 Handuk Tanggung 50x100 Custom Bordir senada dalam box mika/hardbox + Kartu Ucapan. Harga Rp210.000/box."),
        ("SKU-HMP-04", "Paket Souvenir Tasyakuran Haji, Umroh & Pengajian", "Hampers", "Paket hemat pemesanan minimal 10 box, berisi Sajadah Travel atau Handuk 30x70 dengan bordir nama acara/keluarga + kemasan tile/box + kartu ucapan terima kasih. Harga mulai Rp55.000/paket."),
        ("SKU-HMP-05", "Paket Gift Box Kelulusan Wisuda & Ulang Tahun", "Hampers", "Berisi Handuk Mandi Custom Bordir Nama + Gelar Wisuda (misal: Rizky Pratama, S.Kom) + Boneka Mini + Kartu Ucapan Selamat. Harga Rp165.000/box."),
    ]
    for doc_id, title, cat, content in sku_items:
        docs.append({"doc_id": doc_id, "title": title, "category": cat, "content": content})

    # Tambahkan 18 dokumen Spesifikasi Warna & Benang Bordir Kontras
    for idx, color in enumerate(COLORS):
        c_title = color.title()
        thread_rec = "Emas (Gold), Putih, atau Silver" if color in ["navy", "maroon", "hijau emerald", "hitam", "burgundy", "coklat susu"] else "Hitam, Navy, Coklat Tua, atau Gold Gelap"
        docs.append({
            "doc_id": f"CLR-{idx + 1:03d}",
            "title": f"Spesifikasi Warna Produk {c_title} & Rekomendasi Benang Bordir",
            "category": "Custom Sajadah" if idx % 2 == 0 else "Custom Handuk",
            "content": (
                f"Warna {c_title} tersedia untuk lini Sajadah Custom, Handuk Custom, Ready Stock, maupun Hampers Toko Firaza. "
                f"Untuk produk warna dasar {c_title}, tim desain Firaza merekomendasikan warna benang bordir kontras: {thread_rec} "
                f"agar tulisan nama terlihat jelas, elegan, dan mudah terbaca."
            ),
        })

    # Tambahkan 10 dokumen Spesifikasi Gaya Font Bordir
    for idx, font in enumerate(FONTS):
        f_title = font.title()
        docs.append({
            "doc_id": f"FNT-{idx + 1:03d}",
            "title": f"Aturan Bordir Gaya Huruf / Font {f_title}",
            "category": "Custom Sajadah",
            "content": (
                f"Pilihan font '{f_title}' di Toko Firaza mendukung bordir komputer presisi tinggi. "
                f"Batas maksimal yang disarankan untuk 1 baris adalah 20-25 karakter agar ukuran huruf tidak terlalu kecil. "
                f"Jika nama lebih panjang (misal nama keluarga atau gelar lengkap), admin akan menyusun menjadi 2 baris simetris pada tahap Design/Preparation."
            ),
        })

    # Tambahkan 11 dokumen Template Kartu Ucapan per Momen Acara
    for idx, occ in enumerate(OCCASIONS):
        occ_title = occ.title()
        sample_draft = generate_greeting_card_template(occ_title, "Nama Penerima", "Nama Pengirim")
        docs.append({
            "doc_id": f"CRD-{idx + 1:03d}",
            "title": f"Standar & Contoh Draf Kartu Ucapan Momen {occ_title}",
            "category": "Hampers",
            "content": (
                f"Untuk pesanan Hampers atau kado bertema {occ_title}, sistem Generative AI Toko Firaza otomatis membuat draf kartu ucapan. "
                f"Contoh draf resmi: \"{sample_draft}\" Kartu dicetak di atas kertas Art Carton 260gr bertekstur mewah ukuran A6."
            ),
        })

    # Tambahkan 15 dokumen FAQ & Kebijakan Operasional Toko Firaza
    faqs = [
        ("FAQ-001", "Kebijakan Minimal Order & Diskon Grosir Souvenir", "Other", "Pemesanan satuan (1 pcs) tetap dilayani untuk semua produk Ready Stock maupun Custom Bordir. Untuk pemesanan souvenir/grosir minimal 12 pcs mendapat diskon 10%, dan minimal 50 pcs mendapat diskon 20%."),
        ("FAQ-002", "Estimasi Waktu Pengerjaan (SLA Produksi Custom)", "Other", "Pesanan Ready Stock dikirim di hari yang sama (maksimal H+1). Pesanan Custom Sajadah & Handuk satuan (1-5 pcs) membutuhkan waktu produksi 2-3 hari kerja. Pesanan Hampers partai besar (>20 paket) membutuhkan waktu 4-7 hari kerja."),
        ("FAQ-003", "Garansi Kesalahan Ejaan Bordir dari Pihak Toko", "Other", "Jika terjadi kesalahan ejaan nama, warna, atau jenis font yang disebabkan oleh kelalaian produksi Toko Firaza (tidak sesuai dengan ringkasan order yang telah disetujui), Toko Firaza memberikan garansi 100% ganti baru gratis tanpa biaya ongkir tambahan."),
        ("FAQ-004", "Ketentuan Revisi Desain Sebelum Masuk Tahap Production", "Other", "Pelanggan dapat mengajukan revisi ejaan nama atau ganti font selama status pesanan di Web Dashboard masih berada di tahap 'New' atau 'Design/Preparation'. Jika status sudah berubah menjadi 'Production' (sedang dibordir), tulisan tidak dapat diubah."),
        ("FAQ-005", "Pilihan Ekspedisi & Pengiriman Instan / Kargo", "Other", "Toko Firaza melayani pengiriman reguler (JNE, J&T, SiCepat), pengiriman kargo hemat untuk pesanan hampers partai besar (JNE Trucking / Indah Cargo), serta pengiriman Instan/Same-Day (GoSend/GrabExpress) khusus area dalam kota."),
        ("FAQ-006", "Lokasi Workshop & Jam Operasional Admin Toko Firaza", "Other", "Workshop dan layanan admin Toko Firaza beroperasi setiap hari Senin - Sabtu pukul 08.00 - 17.00 WIB. Pesanan chat yang masuk di luar jam kerja atau hari Minggu tetap tercatat otomatis oleh sistem AI dan diproses pada hari kerja berikutnya."),
        ("FAQ-007", "Aturan Penulisan Gelar, Simbol (&), dan Huruf Arab", "Other", "Mesin bordir komputer Toko Firaza mendukung huruf alfabet Latin (A-Z), angka, tanda baca titik/koma, simbol '&' untuk nama pasangan (misal: Nabila & Dimas), serta aksara Arab/Kaligrafi."),
        ("FAQ-008", "Perbedaan Posisi Layout Bordir Sajadah vs Handuk", "Other", "Pada sajadah, posisi bordir paling favorit adalah Pojok Kanan Bawah atau Tengah Atas (area kubah). Pada handuk, posisi bordir standar adalah Tengah Bawah (di atas list tenun sekitar 10 cm dari tepi bawah) agar terlihat rapi saat handuk dilipat atau digantung."),
        ("FAQ-009", "Cara Pemesanan Multi-Item (Banyak Nama Berbeda dalam Satu Chat)", "Other", "Pelanggan dapat mengirimkan daftar nama bordir dalam bentuk list bernomor di satu pesan chat. Sistem AI Order Management Toko Firaza akan mengekstrak daftar item beserta masing-masing detail warnanya untuk memudahkan rekap produksi admin."),
        ("FAQ-010", "Ketersediaan Bungkus Plastik Mika, Tile, dan Paperbag", "Other", "Selain kemasan Hardbox pada kategori Hampers, pesanan Sajadah Custom dan Handuk Custom reguler sudah dikemas rapi menggunakan plastik opp bening per potong. Penambahan tas tile atau paperbag satuan dapat dicantumkan pada catatan tambahan (additional_notes)."),
        ("FAQ-011", "Metode Pembayaran Resmi Toko Firaza", "Other", "Pembayaran pesanan dapat dilakukan melalui transfer bank resmi maupun e-wallet/QRIS. Untuk pesanan custom bordir nama, produksi akan dimulai setelah pembayaran terkonfirmasi karena produk yang sudah dibordir nama pribadi tidak dapat dijual kembali ke pelanggan lain."),
        ("FAQ-012", "Standar Quality Control (QC) Sebelum Status Completed", "Other", "Sebelum status pesanan diubah menjadi 'Completed' di Web Dashboard, tim QC melakukan pembersihan sisa benang lompat (trimming), pemeriksaan kerapian jahitan bordir, pengecekan kesesuaian kartu ucapan, serta pelipatan rapi."),
        ("FAQ-013", "Program Reseller & Dropshipper UMKM Toko Firaza", "Other", "Toko Firaza membuka kemitraan reseller dan dropshipper tanpa biaya pendaftaran. Pengiriman dropship dapat menggunakan nama dan nomor telepon pengirim milik mitra dropshipper pada label pengiriman maupun kartu ucapan."),
        ("FAQ-014", "Ukuran Maksimal Area Bordir Mesin Komputer", "Other", "Area frame bordir standar untuk nama pada handuk dan sajadah adalah lebar maksimal 22 cm dan tinggi huruf 2,5 cm hingga 4 cm (menyesuaikan jumlah huruf pada nama yang dipesan)."),
        ("FAQ-015", "Penanganan Pesanan Urgent / Express Selesai 24 Jam", "Other", "Untuk kebutuhan mendadak (misal kado pernikahan/ulang tahun besok), pelanggan dapat menuliskan catatan 'Express/Urgent' pada chat. Admin akan memprioritaskan antrean di tahap Design/Preparation dan Production sesuai kapasitas harian."),
    ]
    for doc_id, title, cat, content in faqs:
        docs.append({"doc_id": doc_id, "title": title, "category": cat, "content": content})

    return docs


def main():
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    # 1. Dataset Klasifikasi (2.400 train + 600 test = 3.000 baris)
    train_rows, test_rows = build_classification_datasets(train_per_class=480, test_per_class=120)
    train_path = data_dir / "train_classification.csv"
    test_path = data_dir / "test_classification.csv"

    with open(train_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "category"])
        writer.writeheader()
        writer.writerows(train_rows)

    with open(test_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "category"])
        writer.writeheader()
        writer.writerows(test_rows)

    # 2. Dataset Ekstraksi JSON (500 train/bank + 100 test = 600 data)
    ext_train, ext_test = build_extraction_datasets(train_count=500, test_count=100)
    ext_train_path = data_dir / "extraction_dataset.json"
    ext_test_path = data_dir / "extraction_test_set.json"

    with open(ext_train_path, "w", encoding="utf-8") as f:
        json.dump(ext_train, f, indent=2, ensure_ascii=False)

    with open(ext_test_path, "w", encoding="utf-8") as f:
        json.dump(ext_test, f, indent=2, ensure_ascii=False)

    # 3. Knowledge Base RAG (85 dokumen detail)
    kb_docs = build_comprehensive_knowledge_base()
    kb_path = data_dir / "firaza_knowledge_base.json"
    with open(kb_path, "w", encoding="utf-8") as f:
        json.dump(kb_docs, f, indent=2, ensure_ascii=False)

    print(f"[OK] 1. Train classification CSV  : {train_path} ({len(train_rows)} baris)")
    print(f"[OK] 2. Test classification CSV   : {test_path} ({len(test_rows)} baris)")
    print(f"[OK] 3. Extraction dataset JSON   : {ext_train_path} ({len(ext_train)} data)")
    print(f"[OK] 4. Extraction test set JSON  : {ext_test_path} ({len(ext_test)} data)")
    print(f"[OK] 5. RAG Knowledge Base JSON   : {kb_path} ({len(kb_docs)} dokumen detail)")


if __name__ == "__main__":
    main()
