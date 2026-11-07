#!/usr/bin/env bash
set -e

# Dapatkan absolute directory tempat script berada
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================================"
echo "Menjalankan Sistem Toko Firaza dalam 1 Terminal (Bash)"
echo "- Web Dashboard (Next.js): http://localhost:5173"
echo "- Backend & AI API     : http://localhost:8000/docs"
echo "(Tekan Ctrl + C untuk menghentikan server)"
echo "========================================================"
echo ""

# Deteksi perintah python yang tersedia (python, python3, py)
PYTHON_CMD="python"
if command -v python &> /dev/null; then
    PYTHON_CMD="python"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v py &> /dev/null; then
    PYTHON_CMD="py"
fi

# Jalankan Backend FastAPI di background
cd "$ROOT_DIR/backend"
$PYTHON_CMD -m uvicorn app:app --reload --reload-dir "$ROOT_DIR/backend" --reload-dir "$ROOT_DIR/ai-engine" --port 8000 &
BACKEND_PID=$!

# Trap Ctrl+C atau exit agar proses backend ikut dimatikan
cleanup() {
    echo ""
    echo "Menghentikan server backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Jalankan Frontend Next.js di foreground
cd "$ROOT_DIR/frontend"
npm run dev
