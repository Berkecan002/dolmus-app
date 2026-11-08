@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "PATH=%PATH%;%LOCALAPPDATA%\Microsoft\WinGet\Links;%LOCALAPPDATA%\Programs\Git Credential Manager;C:\Program Files\Git\cmd"

echo ========================================================
echo   Dolmu-app v2 - GitHub'a Gönderme (Push) Aracı
echo ========================================================
echo.

echo [1/4] Git kimlik yöneticisi (GCM) ayarlanıyor...
"%LOCALAPPDATA%\Programs\Git Credential Manager\git-credential-manager.exe" configure >nul 2>nul

echo [2/4] Dosyalar ve commit kontrol ediliyor...
git add .
git commit -m "İlk sürüm: Kırıkkale Dolmuş Rehberi hazır" >nul 2>nul
git branch -M main

echo [3/4] Uzak sunucu (origin) kontrol ediliyor...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/Berkecan002/dolmus-app.git

echo [4/4] GitHub'a gönderiliyor (Açılan pencerede GitHub girişini onaylayın)...
echo.
git push -u origin main

echo.
echo ========================================================
echo   İşlem tamamlandı! Bu pencereyi kapatabilirsiniz.
echo ========================================================
pause
