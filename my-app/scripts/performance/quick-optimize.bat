@echo off
echo ========================================
echo Baithaka Ghar - Quick Performance Optimization
echo ========================================
echo.

echo Step 1: Backing up current configuration...
if exist next.config.js (
    copy /Y next.config.js next.config.backup.js >nul
    echo [OK] Backup created: next.config.backup.js
) else (
    echo [SKIP] No existing next.config.js found
)
echo.

echo Step 2: Applying optimized Next.js configuration...
if exist next.config.optimized.js (
    copy /Y next.config.optimized.js next.config.js >nul
    echo [OK] Optimized configuration applied
) else (
    echo [ERROR] next.config.optimized.js not found!
    echo        Please check the file exists
    pause
    exit /b 1
)
echo.

echo Step 3: Adding database indexes for faster queries...
node scripts/performance/add-indexes.cjs
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Database indexes setup had issues
    echo          This might be due to network connectivity
    echo          You can run this manually later
) else (
    echo [OK] Database indexes added successfully
)
echo.

echo Step 4: Installing bundle analyzer...
call npm install --save-dev @next/bundle-analyzer
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Bundle analyzer installation failed
) else (
    echo [OK] Bundle analyzer installed
)
echo.

echo Step 5: Cleaning build cache...
if exist .next (
    rmdir /S /Q .next
    echo [OK] Build cache cleared
) else (
    echo [SKIP] No build cache to clear
)
echo.

echo ========================================
echo Optimization Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Run 'npm run build' to test the optimized build
echo 2. Run 'npm run analyze' to see bundle size breakdown
echo 3. Run 'npm start' to test production mode locally
echo.
echo For detailed instructions, see:
echo PERFORMANCE_OPTIMIZATION_GUIDE.md
echo.
pause
