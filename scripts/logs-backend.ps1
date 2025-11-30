# View Backend Logs
# Usage: .\scripts\logs-backend.ps1 [minutes]
# Example: .\scripts\logs-backend.ps1 10  (last 10 minutes)

param(
    [int]$Minutes = 5
)

Write-Host "=== Backend Logs (last $Minutes minutes) ===" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop watching logs" -ForegroundColor Gray
Write-Host ""

$REGION = "us-east-1"
$LOG_GROUP = "/aws/ecs/delivery-test-cluster/delivery-core-api-0541-57b6"

aws logs tail $LOG_GROUP --since ${Minutes}m --follow --region $REGION --format short
