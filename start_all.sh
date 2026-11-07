#!/usr/bin/env bash
set -e

# Dapatkan absolute directory tempat script berada
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================================"
echo "Menjalankan Sistem Toko Firaza dalam 1 Terminal (Bash)"
echo "- Web Dashboard (Next.js): http://localhost:3000"
echo "- Backend & AI API     : http://localhost:8000/docs"
echo "- Local LLM & Embedding: Ollama (llama3.2:3b + all-minilm)"
echo "- Vector Database      : FAISS (faiss-cpu-IndexFlatIP)"
echo "(Tekan Ctrl + C untuk menghentikan server)"
echo "========================================================"
echo ""

# Pastikan Ollama serve berjalan di background jika terinstal
if command -v ollama &> /dev/null; then
    export OLLAMA_MAX_LOADED_MODELS=3
    export OLLAMA_NUM_PARALLEL=2
    ollama serve >/dev/null 2>&1 &
fi

# Utamakan Python 3.12 (yang memiliki wheel resmi faiss-cpu) jika tersedia melalui py launcher
cd "$ROOT_DIR/backend"
if command -v py &> /dev/null && py -3.12 --version &> /dev/null; then
    py -3.12 -m uvicorn app:app --reload --reload-dir "$ROOT_DIR/backend" --reload-dir "$ROOT_DIR/ai-engine" --port 8000 &
elif command -v python &> /dev/null; then
    python -m uvicorn app:app --reload --reload-dir "$ROOT_DIR/backend" --reload-dir "$ROOT_DIR/ai-engine" --port 8000 &
else
    python3 -m uvicorn app:app --reload --reload-dir "$ROOT_DIR/backend" --reload-dir "$ROOT_DIR/ai-engine" --port 8000 &
fi
BACKEND_PID=$!

# Trap Ctrl+C atau exit agar proses backend ikut dimatikan
cleanup() {
    echo ""
    echo "Menghentikan server backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Jalankan Frontend Next.js di foreground (port 3000 bebas collision)
cd "$ROOT_DIR/frontend"
npm run dev
