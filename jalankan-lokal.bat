@echo off
REM =====================================================================
REM jalankan-lokal.bat — Menjalankan website undangan di komputer (Windows)
REM Cara pakai: klik dua kali file ini. Jangan tutup jendela hitamnya.
REM Untuk berhenti: tutup jendela hitam atau tekan Ctrl+C.
REM =====================================================================

REM Port (ganti jika 8000 sudah dipakai program lain)
set PORT=8000

cd /d "%~dp0web"

where py >nul 2>nul
if %errorlevel%==0 (
  set PY=py
) else (
  where python >nul 2>nul
  if %errorlevel%==0 (
    set PY=python
  ) else (
    echo.
    echo Python belum terpasang.
    echo Download di https://www.python.org/downloads/
    echo Saat memasang, CENTANG "Add python.exe to PATH".
    echo.
    pause
    exit /b 1
  )
)

echo.
echo Website berjalan di: http://localhost:%PORT%/undangan/?u=demo^&to=Aldi
echo Jangan tutup jendela ini selama website dipakai.
echo.

start "" "http://localhost:%PORT%/undangan/?u=demo&to=Aldi"
%PY% -m http.server %PORT%
pause
