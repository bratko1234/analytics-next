@echo off
echo Building @bratrax/analytics-node standalone package...
echo.

echo Step 1: Building generic-utils dependency...
cd ..\generic-utils
call npm install
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build generic-utils
    exit /b 1
)
echo ✓ generic-utils built successfully
echo.

echo Step 2: Building core dependency...
cd ..\core
call npm install
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build core
    exit /b 1
)
echo ✓ core built successfully
echo.

echo Step 3: Building node package...
cd ..\node
call npm install
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build node package
    exit /b 1
)
echo ✓ node package built successfully
echo.

echo ========================================
echo Build complete! Package is ready to publish.
echo ========================================
echo.
echo To publish:
echo   npm login
echo   npm publish --access public
echo.

