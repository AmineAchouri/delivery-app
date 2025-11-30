# Deploy Backend to ECS
# Usage: .\scripts\deploy-backend.ps1

Write-Host "=== Backend Deployment Script ===" -ForegroundColor Cyan
Write-Host ""

$CLUSTER = "delivery-test-cluster"
$SERVICE = "delivery-core-api-0541"
$REGION = "us-east-1"

# Step 1: Stop current tasks
Write-Host "Step 1: Stopping current tasks..." -ForegroundColor Yellow
$tasks = aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE --region $REGION | ConvertFrom-Json

if ($tasks.taskArns.Count -gt 0) {
    foreach ($taskArn in $tasks.taskArns) {
        $taskId = $taskArn.Split('/')[-1]
        Write-Host "  Stopping task: $taskId"
        aws ecs stop-task --cluster $CLUSTER --task $taskId --reason "Manual deployment" --region $REGION | Out-Null
    }
    Write-Host "✅ Tasks stopped" -ForegroundColor Green
} else {
    Write-Host "  No running tasks found" -ForegroundColor Gray
}

# Step 2: Wait for new task to start
Write-Host ""
Write-Host "Step 2: Waiting for new task to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 3: Check service status
Write-Host ""
Write-Host "Step 3: Checking service status..." -ForegroundColor Yellow
$service = aws ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION | ConvertFrom-Json
$runningCount = $service.services[0].runningCount
$desiredCount = $service.services[0].desiredCount

Write-Host "  Running: $runningCount / Desired: $desiredCount"

if ($runningCount -eq $desiredCount) {
    Write-Host "✅ Service is healthy" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service is still starting..." -ForegroundColor Yellow
}

# Step 4: Get new task ID
Write-Host ""
Write-Host "Step 4: Getting new task ID..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
$newTasks = aws ecs list-tasks --cluster $CLUSTER --service-name $SERVICE --desired-status RUNNING --region $REGION | ConvertFrom-Json

if ($newTasks.taskArns.Count -gt 0) {
    $taskId = $newTasks.taskArns[0].Split('/')[-1]
    Write-Host "  New task ID: $taskId" -ForegroundColor Green
    
    # Step 5: Tail logs
    Write-Host ""
    Write-Host "Step 5: Tailing logs (last 5 minutes)..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop watching logs" -ForegroundColor Gray
    Write-Host ""
    
    aws logs tail "/aws/ecs/delivery-test-cluster/delivery-core-api-0541-57b6" --since 5m --follow --region $REGION --format short
} else {
    Write-Host "❌ No running tasks found" -ForegroundColor Red
}
