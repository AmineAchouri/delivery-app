# Deployment Scripts

Quick scripts for managing ECS deployments and viewing logs.

## Scripts

### 1. Deploy Backend
Stops current backend tasks and deploys new version with live logs.

```powershell
.\scripts\deploy-backend.ps1
```

### 2. View Backend Logs
View backend logs (default: last 5 minutes, live tail).

```powershell
.\scripts\logs-backend.ps1           # Last 5 minutes
.\scripts\logs-backend.ps1 10        # Last 10 minutes
```

### 3. View Frontend Logs
View frontend logs (default: last 5 minutes, live tail).

```powershell
.\scripts\logs-frontend.ps1          # Last 5 minutes
.\scripts\logs-frontend.ps1 10       # Last 10 minutes
```

### 4. Test Backend API
Test backend health and login endpoints.

```powershell
.\scripts\test-backend.ps1
```

## Prerequisites

- AWS CLI configured with credentials
- PowerShell 5.1 or higher
- Access to ECS cluster and CloudWatch Logs

## Notes

- All scripts use `us-east-1` region
- Backend cluster: `delivery-test-cluster`
- Backend service: `delivery-core-api-0541`
- Press `Ctrl+C` to stop log tailing
