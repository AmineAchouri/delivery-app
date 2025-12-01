# Script to create ECR repositories for the delivery app
# Run this once to set up all required ECR repositories

$Region = "us-east-1"
$ErrorActionPreference = "Stop"

Write-Host "Creating ECR repositories in region: $Region" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

function Create-ECRRepo {
    param(
        [string]$RepoName
    )
    
    Write-Host ""
    Write-Host "Checking repository: $RepoName" -ForegroundColor Yellow
    
    try {
        aws ecr describe-repositories --repository-names $RepoName --region $Region 2>&1 | Out-Null
        Write-Host "✅ Repository '$RepoName' already exists" -ForegroundColor Green
    }
    catch {
        Write-Host "Creating repository '$RepoName'..." -ForegroundColor Yellow
        aws ecr create-repository `
            --repository-name $RepoName `
            --region $Region `
            --image-scanning-configuration scanOnPush=true `
            --encryption-configuration encryptionType=KMS
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Repository '$RepoName' created successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create repository '$RepoName'" -ForegroundColor Red
            exit 1
        }
    }
}

# Create all repositories
Create-ECRRepo -RepoName "delivery-mobile-pwa"
Create-ECRRepo -RepoName "delivery-frontend"
Create-ECRRepo -RepoName "delivery-backend"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ All ECR repositories are ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Repository URLs:" -ForegroundColor Cyan
aws ecr describe-repositories `
    --repository-names delivery-mobile-pwa delivery-frontend delivery-backend `
    --region $Region `
    --query 'repositories[].repositoryUri' `
    --output table
