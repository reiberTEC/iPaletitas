@echo off
REM Crea la base ipaletitas (usa PowerShell por debajo)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0crear.ps1"
if errorlevel 1 pause
