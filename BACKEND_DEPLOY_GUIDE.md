# 🚀 Backend Deploy Workflow - Complete Guide

## ✅ **What's New**

The backend deploy workflow now **automatically creates ECS services** if they don't exist, just like the frontend!

---

## 🎉 **Features Added**

### **1. Automatic Service Creation** ✅
- Checks if ECS service exists
- Creates service automatically if not found
- Updates existing service if found
- Configures VPC networking (subnets, security groups)
- Optional load balancer integration

### **2. Smart Task Definition Registration** ✅
- Compares task definitions before registering
- Only registers if changes detected
- Reuses existing revisions when possible

### **3. Enhanced Monitoring** ✅
- Service existence check
- Creation/update status messages
- Final service status display

---

## 📋 **Workflow Inputs**

| Input | Required | Description | Example |
|-------|----------|-------------|---------|
| **env** | ✅ Yes | Environment (test/prod) | `test` |
| **feature** | ✅ Yes | Feature key | `core` |
| **image_tag** | ❌ No | Custom image tag | `v1.0.0` |
| **ecs_cluster** | ✅ Yes | ECS cluster name | `delivery-test-cluster` |
| **ecs_service** | ✅ Yes | ECS service name | `delivery-core-api-0541` |
| **vpc_subnets** | ⚠️ New service only | Comma-separated subnet IDs | `subnet-abc123,subnet-def456` |
| **security_groups** | ⚠️ New service only | Comma-separated SG IDs | `sg-abc123,sg-def456` |
| **target_group_arn** | ❌ No | ALB target group ARN | `arn:aws:elasticloadbalancing:...` |

---

## 🎯 **Deployment Scenarios**

### **Scenario 1: Create New Service** (First Time)

When the service doesn't exist, you **must** provide VPC configuration:

```yaml
Environment: test
Feature: core
ECS Cluster: delivery-test-cluster
ECS Service: delivery-core-api-0541
VPC Subnets: subnet-abc123,subnet-def456
Security Groups: sg-abc123
Target Group ARN: arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/backend/abc123
```

**What Happens:**
1. ✅ Builds and pushes Docker image
2. ✅ Renders task definition
3. ✅ Checks for task definition changes
4. ✅ Registers or reuses task definition
5. ✅ Checks if service exists (not found)
6. ✅ **Creates new ECS service** with:
   - Launch type: FARGATE
   - Desired count: 1
   - Network: awsvpc with your subnets/SGs
   - Public IP: Enabled
   - Load balancer: Attached (if target group provided)
   - Container: Main on port 3000
7. ✅ Waits for service to stabilize
8. ✅ Displays service status

---

### **Scenario 2: Update Existing Service**

When the service already exists, VPC config is **optional**:

```yaml
Environment: test
Feature: core
ECS Cluster: delivery-test-cluster
ECS Service: delivery-core-api-0541
```

**What Happens:**
1. ✅ Builds and pushes Docker image
2. ✅ Renders task definition
3. ✅ Checks for task definition changes
4. ✅ Registers or reuses task definition
5. ✅ Checks if service exists (found)
6. ✅ **Updates existing service** with:
   - New/existing task definition
   - Force new deployment
7. ✅ Waits for service to stabilize
8. ✅ Displays service status

---

## 🏗️ **Workflow Steps Breakdown**

### **Job 1: Build Image**
```yaml
1. Checkout code
2. Setup Docker Buildx
3. Configure AWS credentials
4. Login to ECR
5. Ensure ECR repository exists (create if needed)
6. Build Docker image from backend/Dockerfile
7. Push image to ECR with timestamped tag
8. Output image URI
```

### **Job 2: Deploy ECS**
```yaml
1. Checkout code
2. Setup Node.js 20
3. Read feature configuration (core.json or menu-rewrite.json)
4. Configure AWS credentials
5. Render task definition template
6. Check for task definition changes
   ├─ Compare with existing
   ├─ Register new if changed
   └─ Reuse existing if unchanged
7. Set final revision number
8. List all task definitions
9. Describe task definition to deploy
10. Check if service exists
    ├─ If NOT exists:
    │  ├─ Validate VPC inputs (subnets, security groups)
    │  ├─ Create ECS service with network config
    │  └─ Optionally attach load balancer
    └─ If exists:
       └─ Update service with new task definition
11. Wait for service to become stable
12. Display final service status
```

---

## 🔧 **Required AWS Resources**

### **Before First Deployment:**

1. **ECS Cluster** (must exist)
   ```bash
   aws ecs create-cluster --cluster-name delivery-test-cluster
   ```

2. **VPC with Subnets** (for new service)
   ```bash
   # Get your VPC subnets
   aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,AvailabilityZone,CidrBlock]' --output table
   ```

3. **Security Group** (for new service)
   ```bash
   # Create security group
   aws ec2 create-security-group \
     --group-name delivery-backend-sg \
     --description "Security group for delivery backend API" \
     --vpc-id vpc-xxxxx
   
   # Allow inbound on port 3000 (from ALB security group)
   aws ec2 authorize-security-group-ingress \
     --group-id sg-xxxxx \
     --protocol tcp \
     --port 3000 \
     --source-group sg-alb-xxxxx
   ```

4. **Application Load Balancer** (optional)
   ```bash
   # Create target group
   aws elbv2 create-target-group \
     --name delivery-backend-tg \
     --protocol HTTP \
     --port 3000 \
     --vpc-id vpc-xxxxx \
     --target-type ip \
     --health-check-path /health \
     --health-check-interval-seconds 30
   ```

5. **SSM Parameters** (for secrets)
   ```bash
   # Database URL
   aws ssm put-parameter \
     --name "/delivery/test/DATABASE_URL" \
     --value "postgresql://user:pass@host:5432/db" \
     --type "SecureString"
   
   # JWT Keys
   aws ssm put-parameter \
     --name "/delivery/test/JWT_PRIVATE_KEY" \
     --value "$(cat private-key.pem)" \
     --type "SecureString"
   
   aws ssm put-parameter \
     --name "/delivery/test/JWT_PUBLIC_KEY" \
     --value "$(cat public-key.pem)" \
     --type "SecureString"
   ```

---

## 🔐 **Required GitHub Secrets**

| Secret | Description | Example |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `ECS_EXEC_ROLE_ARN` | ECS execution role ARN | `arn:aws:iam::123456789:role/ecsTaskExecutionRole` |
| `ECS_TASK_ROLE_ARN` | ECS task role ARN | `arn:aws:iam::123456789:role/ecsTaskRole` |

---

## 📝 **Step-by-Step Deployment**

### **First Time Deployment:**

1. **Get Your AWS Resources:**
   ```bash
   # Get cluster name
   aws ecs list-clusters
   
   # Get subnet IDs
   aws ec2 describe-subnets --query 'Subnets[*].SubnetId' --output text
   
   # Get security group ID
   aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId,GroupName]' --output table
   
   # Get target group ARN (if using ALB)
   aws elbv2 describe-target-groups --query 'TargetGroups[*].[TargetGroupArn,TargetGroupName]' --output table
   ```

2. **Go to GitHub Actions:**
   - Navigate to your repository
   - Click "Actions" tab
   - Select "Backend Deploy"
   - Click "Run workflow"

3. **Fill in the inputs:**
   ```
   Environment: test
   Feature: core
   Image tag: (leave empty for auto-generated)
   ECS Cluster: delivery-test-cluster
   ECS Service: delivery-core-api-0541
   VPC Subnets: subnet-abc123,subnet-def456
   Security Groups: sg-abc123
   Target Group ARN: arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/backend/abc123
   ```

4. **Click "Run workflow"**

5. **Monitor Progress:**
   - Watch the workflow logs
   - See service creation in real-time
   - Check final status table

---

### **Subsequent Deployments:**

For updates, you only need the basic inputs:

```
Environment: test
Feature: core
ECS Cluster: delivery-test-cluster
ECS Service: delivery-core-api-0541
```

The workflow will automatically update the existing service!

---

## 🎨 **Task Definition Template**

The workflow uses `infra/taskdef.template.json`:

```json
{
  "family": "${TASKDEF_FAMILY}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "1024",
  "executionRoleArn": "${EXEC_ROLE_ARN}",
  "taskRoleArn": "${TASK_ROLE_ARN}",
  "containerDefinitions": [
    {
      "name": "Main",
      "image": "${IMAGE_URI}",
      "cpu": 256,
      "memoryReservation": 1024,
      "portMappings": [
        { "containerPort": 3000, "hostPort": 3000, "protocol": "tcp" }
      ],
      "environment": [
        { "name": "PORT", "value": "3000" },
        { "name": "FEATURE_KEY", "value": "${FEATURE_KEY}" },
        { "name": "DEPLOY_ENV", "value": "${DEPLOY_ENV}" },
        { "name": "TOKEN_ISS", "value": "delivery-app" },
        { "name": "TOKEN_AUD_TENANT", "value": "tenant-api" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "${SSM_DATABASE_URL_PARAM}" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/delivery-test-cluster/delivery-core-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

## 📊 **Service Configuration**

### **Default Settings:**
```yaml
Launch Type: FARGATE
Desired Count: 1
CPU: 256 (0.25 vCPU)
Memory: 1024 MB (1 GB)
Network Mode: awsvpc
Public IP: ENABLED
Container Port: 3000
Container Name: Main
```

---

## 🎉 **Summary**

**Complete Features:**
- ✅ Automatic service creation
- ✅ Smart task definition registration
- ✅ VPC network configuration
- ✅ Load balancer integration
- ✅ Feature flag support (core, menu-rewrite)
- ✅ Environment separation (test/prod)
- ✅ Enhanced status monitoring

**Deployment is now fully automated!** 🚀

Just provide your AWS resources on first deployment, and the workflow handles everything else!
