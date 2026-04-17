@echo off
setlocal

cd /d "%~dp0"

set "SQL_FILE=%~dp0database\gamehub.sql"
set "DB_NAME=gamehub"
set "DB_USER=root"
set "DB_PASS="
set "MYSQL_EXE="
set "CHECK_TABLE=achievement_catalog"
set "BACKEND_HEALTH_URL=http://localhost:3002/api/comments/test"
set "BACKEND_WAIT_SECONDS=25"

where mysql >nul 2>nul
if not errorlevel 1 set "MYSQL_EXE=mysql"

if not defined MYSQL_EXE if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_EXE=C:\xampp\mysql\bin\mysql.exe"
if not defined MYSQL_EXE if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set "MYSQL_EXE=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

if exist "%SQL_FILE%" (
    if defined MYSQL_EXE (
        if defined DB_PASS (
            "%MYSQL_EXE%" -u %DB_USER% -p%DB_PASS% -N -B -e "SHOW TABLES LIKE '%CHECK_TABLE%';" %DB_NAME% 2>nul | findstr /i /x "%CHECK_TABLE%" >nul
            if not errorlevel 1 (
                echo Az adatbazis mar be van toltve, import kihagyva.
            ) else (
                echo Adatbazis import indul...
                "%MYSQL_EXE%" -u %DB_USER% -p%DB_PASS% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;"
                if errorlevel 1 goto db_import_error
                "%MYSQL_EXE%" -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%SQL_FILE%"
                if errorlevel 1 goto db_import_error
                echo Adatbazis import sikeres.
            )
        ) else (
            "%MYSQL_EXE%" -u %DB_USER% -N -B -e "SHOW TABLES LIKE '%CHECK_TABLE%';" %DB_NAME% 2>nul | findstr /i /x "%CHECK_TABLE%" >nul
            if not errorlevel 1 (
                echo Az adatbazis mar be van toltve, import kihagyva.
            ) else (
                echo Adatbazis import indul...
                "%MYSQL_EXE%" -u %DB_USER% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci;"
                if errorlevel 1 goto db_import_error
                "%MYSQL_EXE%" -u %DB_USER% %DB_NAME% < "%SQL_FILE%"
                if errorlevel 1 goto db_import_error
                echo Adatbazis import sikeres.
            )
        )
    ) else (
        echo Nem talalhato a mysql kliens, ezert az adatbazis import kimarad.
        echo Ha XAMPP vagy MySQL telepitve van, add hozza a mysql.exe eleresi utjat a fajl tetejen.
    )
) else (
    echo Nem talalhato az SQL fajl, ezert az adatbazis import kimarad.
)

echo Node modulok telepitese...
call npm install

if errorlevel 1 (
    echo.
    echo A telepites hibaval leallt.
    exit /b 1
)

echo.
echo A telepites sikeresen befejezodott, indulnak a szerverek.
echo A backend es a frontend kulon ablakokban indul.

echo Backend inditasa...
start "Backend" cmd /k "title GameHub Backend && cd /d ""%~dp0"" && npm run server"

echo Backend ellenorzese...
set "BACKEND_OK="
for /L %%S in (1,1,%BACKEND_WAIT_SECONDS%) do (
    powershell -NoProfile -Command ^
      "try { Invoke-WebRequest -Uri '%BACKEND_HEALTH_URL%' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -ge 400 -and [int]$_.Exception.Response.StatusCode -lt 500) { exit 0 } else { exit 1 } }"
    if not errorlevel 1 (
        set "BACKEND_OK=1"
        goto backend_ready
    )
    timeout /t 1 >nul
)

:backend_ready
if not defined BACKEND_OK (
    echo.
    echo A backend nem indult el %BACKEND_WAIT_SECONDS% masodpercen belul.
    echo Ellenorizd a "GameHub Backend" ablakban a hibauzenetet.
    echo Gyakori ok: MySQL nem fut, vagy rossz DB_USER/DB_PASSWORD a .env fajlban.
    pause
    exit /b 1
)

echo Backend rendben fut.

echo Frontend inditasa...
start "Frontend" cmd /k "title GameHub Frontend && cd /d ""%~dp0"" && npm run dev"

echo.
echo Ha az uj ablakok nem jelentek meg, ellenorizd hogy az npm elerheto-e a PATH-ban.
pause

exit /b 0

:db_import_error
echo.
echo Az adatbazis import hibaval leallt.
echo Ellenorizd, hogy fut-e a MySQL vagy MariaDB, es hogy a felhasznalonev-jelszo helyes-e.
exit /b 1