# Test Backend API
# Usage: .\scripts\test-backend.ps1

Write-Host "=== Testing Backend API ===" -ForegroundColor Cyan
Write-Host ""

$BACKEND_URL = "https://de-1776d05c524b49cba2db0d34a69e6775.ecs.us-east-1.on.aws"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$BACKEND_URL/health" -UseBasicParsing
    Write-Host "✅ Health: $($health.StatusCode) - $($health.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Login
Write-Host "Test 2: Platform Admin Login" -ForegroundColor Yellow
$body = @{
    email = "superadmin@platform.com"
    password = "SuperAdmin123!"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/platform-admin/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "✅ Login: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   Access Token: $($data.access_token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Error: $errorBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Tests Complete ===" -ForegroundColor Cyan
