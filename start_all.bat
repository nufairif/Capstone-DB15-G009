@echo off
echo ========================================================
echo Menjalankan Sistem Toko Firaza dalam 1 Jendela Terminal
echo - Web Dashboard (Next.js): http://localhost:3000
echo - Backend ^& AI API     : http://localhost:8000/docs
echo - Local LLM (Ollama)   : http://localhost:11434 (llama3.2:3b)
echo (Tekan Ctrl + C untuk menghentikan keduanya)
echo ========================================================
echo.

where ollama >nul 2>nul
if %errorlevel% equ 0 (
    start /b "" ollama serve >nul 2>nul
)

cd /d "%~dp0backend"
start /b "" python -m uvicorn app:app --reload --reload-dir "%~dp0backend" --reload-dir "%~dp0ai-engine" --port 8000

cd /d "%~dp0frontend"
call npm.cmd run dev
