@echo off
echo.
echo ===========================================
echo   HealthClo Auto-Update & Deploy
echo ===========================================
echo.

set /p commit_msg="Enter your update message: "

if "%commit_msg%"=="" (
    set commit_msg="Daily updates and improvements"
)

echo.
echo [1/3] Adding changes...
git add .

echo [2/3] Committing changes...
git commit -m "%commit_msg%"

echo [3/3] Pushing to GitHub...
git push

echo.
echo ===========================================
echo   Update Successful!
echo   Render will now automatically rebuild.
echo ===========================================
echo.
pause
