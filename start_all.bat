@echo off
echo ========================================================
echo Menjalankan Sistem Toko Firaza dalam 1 Jendela Terminal
echo - Web Dashboard (Next.js): http://localhost:5173
echo - Backend & AI API     : http://localhost:8000/docs
echo (Tekan Ctrl + C untuk menghentikan keduanya)
echo ========================================================
echo.

cd /d "%~dp0backend"
start /b "" python -m uvicorn app:app --reload --reload-dir "%~dp0backend" --reload-dir "%~dp0ai-engine" --port 8000

cd /d "%~dp0frontend"
call npm.cmd run dev
