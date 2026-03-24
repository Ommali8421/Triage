@echo off
echo ===================================================
echo     Triage App - ML Backend Startup Script
echo ===================================================
echo.
echo Step 1: Installing dependencies (this may take a while, up to 30 mins)
"%LocalAppData%\Programs\Python\Python311\python.exe" -m pip install -r requirements.txt
echo.
echo Step 2: Starting FastAPI ML Backend...
"%LocalAppData%\Programs\Python\Python311\python.exe" app.py
pause
