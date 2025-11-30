# View Frontend Logs
# Usage: .\scripts\logs-frontend.ps1 [minutes]
# Example: .\scripts\logs-frontend.ps1 10  (last 10 minutes)

param(
    [int]$Minutes = 5
)

Write-Host "=== Frontend Logs (last $Minutes minutes) ===" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop watching logs" -ForegroundColor Gray
Write-Host ""

$REGION = "us-east-1"
$LOG_GROUP = "/aws/ecs/delivery-frontend-test"

aws logs tail $LOG_GROUP --since ${Minutes}m --follow --region $REGION --format short
