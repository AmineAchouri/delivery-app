# 🎨 Frontend Deploy Workflow - Complete Guide

## ✅ **What's New**

The frontend deploy workflow now **automatically creates ECS services** if they don't exist, making deployment much easier!

---

## 🚀 **Features Added**

### **1. Automatic Service Creation**
- ✅ Checks if ECS service exists
- ✅ Creates service automatically if not found
- ✅ Updates existing service if found
- ✅ Configures VPC networking (subnets, security groups)
- ✅ Optional load balancer integration

### **2. Fixed Task Definition Variable**
- ✅ Properly expands `TASKDEF_FAMILY` variable
- ✅ No more "TaskDefinition not found" errors

### **3. Enhanced Monitoring**
- ✅ Service status checks
- ✅ Deployment progress tracking
- ✅ Final status display

---

## 📋 **Workflow Inputs**

| Input | Required | Description | Example |
|-------|----------|-------------|---------|
| **env** | ✅ Yes | Environment (test/prod) | `test` |
| **image_tag** | ❌ No | Custom image tag | `v1.0.0` |
| **ecs_cluster** | ✅ Yes | ECS cluster name | `delivery-test-cluster` |
| **ecs_service** | ✅ Yes | ECS service name | `delivery-frontend-test` |
| **vpc_subnets** | ⚠️ New service only | Comma-separated subnet IDs | `subnet-abc123,subnet-def456` |
| **security_groups** | ⚠️ New service only | Comma-separated SG IDs | `sg-abc123,sg-def456` |
| **target_group_arn** | ❌ No | ALB target group ARN | `arn:aws:elasticloadbalancing:...` |

---

## 🎯 **Deployment Scenarios**

### **Scenario 1: Create New Service** (First Time)

When the service doesn't exist, you **must** provide VPC configuration:

```yaml
Environment: test
ECS Cluster: delivery-test-cluster
ECS Service: delivery-frontend-test
VPC Subnets: subnet-abc123,subnet-def456
Security Groups: sg-abc123
Target Group ARN: arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/frontend/abc123
```

**What Happens:**
1. ✅ Builds and pushes Docker image
2. ✅ Registers task definition
3. ✅ Checks if service exists (not found)
4. ✅ **Creates new ECS service** with:
   - Launch type: FARGATE
   - Desired count: 1
   - Network: awsvpc with your subnets/SGs
   - Public IP: Enabled
   - Load balancer: Attached (if target group provided)
5. ✅ Waits for service to stabilize
6. ✅ Displays service status

---

### **Scenario 2: Update Existing Service**

When the service already exists, VPC config is **optional**:

```yaml
Environment: test
ECS Cluster: delivery-test-cluster
ECS Service: delivery-frontend-test
```

**What Happens:**
1. ✅ Builds and pushes Docker image
2. ✅ Registers task definition
3. ✅ Checks if service exists (found)
4. ✅ **Updates existing service** with:
   - New task definition
   - Force new deployment
5. ✅ Waits for service to stabilize
6. ✅ Displays service status

---

## 🏗️ **Workflow Steps Breakdown**

### **Job 1: Build Image**
```yaml
1. Checkout code
2. Setup Docker Buildx
3. Configure AWS credentials
4. Login to ECR
5. Ensure ECR repository exists (create if needed)
6. Build Docker image from admin/Dockerfile
7. Push image to ECR
8. Output image URI
```

### **Job 2: Deploy ECS**
```yaml
1. Checkout code
2. Configure AWS credentials
3. Render task definition template
4. Register task definition → Get revision number
5. Check if service exists
   ├─ If NOT exists:
   │  ├─ Validate VPC inputs (subnets, security groups)
   │  ├─ Create ECS service with network config
   │  └─ Optionally attach load balancer
   └─ If exists:
      └─ Update service with new task definition
6. Wait for service to become stable
7. Display final service status
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
   aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,AvailabilityZone]' --output table
   ```

3. **Security Group** (for new service)
   ```bash
   # Create security group allowing HTTP/HTTPS
   aws ec2 create-security-group \
     --group-name delivery-frontend-sg \
     --description "Security group for delivery frontend" \
     --vpc-id vpc-xxxxx
   
   # Allow inbound HTTP (port 80)
   aws ec2 authorize-security-group-ingress \
     --group-id sg-xxxxx \
     --protocol tcp \
     --port 80 \
     --cidr 0.0.0.0/0
   ```

4. **Application Load Balancer** (optional)
   ```bash
   # Create target group
   aws elbv2 create-target-group \
     --name delivery-frontend-tg \
     --protocol HTTP \
     --port 80 \
     --vpc-id vpc-xxxxx \
     --target-type ip \
     --health-check-path /
   ```

---

## 🔐 **Required GitHub Secrets**

These must be configured in your GitHub repository:

| Secret | Description | Example |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `ECS_EXEC_ROLE_ARN` | ECS execution role ARN | `arn:aws:iam::123456789:role/ecsTaskExecutionRole` |
| `ECS_TASK_ROLE_ARN` | ECS task role ARN | `arn:aws:iam::123456789:role/ecsTaskRole` |
| `ECS_LOG_GROUP` | CloudWatch log group | `/aws/ecs/delivery-frontend` |

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
   - Select "Frontend Deploy"
   - Click "Run workflow"

3. **Fill in the inputs:**
   ```
   Environment: test
   Image tag: (leave empty for auto-generated)
   ECS Cluster: delivery-test-cluster
   ECS Service: delivery-frontend-test
   VPC Subnets: subnet-abc123,subnet-def456
   Security Groups: sg-abc123
   Target Group ARN: arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/frontend/abc123
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
ECS Cluster: delivery-test-cluster
ECS Service: delivery-frontend-test
```

The workflow will automatically update the existing service!

---

## 🎨 **Task Definition Template**

The workflow uses `infra/admin-frontend-taskdef.template.json`:

```json
{
  "family": "${TASKDEF_FAMILY}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "${EXEC_ROLE_ARN}",
  "taskRoleArn": "${TASK_ROLE_ARN}",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "${IMAGE_URI}",
      "essential": true,
      "portMappings": [
        { "containerPort": 80, "protocol": "tcp" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "${LOG_GROUP}",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Variables replaced:**
- `${IMAGE_URI}` → ECR image URI
- `${EXEC_ROLE_ARN}` → From GitHub secrets
- `${TASK_ROLE_ARN}` → From GitHub secrets
- `${LOG_GROUP}` → From GitHub secrets
- `${AWS_REGION}` → us-east-1
- `${TASKDEF_FAMILY}` → delivery-frontend-{env}

---

## 🔍 **Troubleshooting**

### **Error: "vpc_subnets and security_groups are required"**
**Cause:** Creating a new service without VPC configuration  
**Solution:** Provide `vpc_subnets` and `security_groups` inputs

### **Error: "Service does not exist"**
**Cause:** Service name doesn't match or wrong cluster  
**Solution:** Verify cluster and service names with:
```bash
aws ecs list-services --cluster delivery-test-cluster
```

### **Error: "Task failed to start"**
**Cause:** Usually network or IAM issues  
**Solution:** Check:
- Security groups allow outbound traffic
- Subnets have internet access (NAT gateway or public)
- IAM roles have correct permissions
- CloudWatch log group exists

### **Error: "Load balancer target group not found"**
**Cause:** Invalid target group ARN  
**Solution:** Verify ARN:
```bash
aws elbv2 describe-target-groups
```

---

## 📊 **Service Configuration**

### **Default Settings:**
```yaml
Launch Type: FARGATE
Desired Count: 1
CPU: 256 (0.25 vCPU)
Memory: 512 MB
Network Mode: awsvpc
Public IP: ENABLED
Container Port: 80
```

### **To Modify:**
Edit the "Create service" step in the workflow to change:
- Desired count
- CPU/Memory
- Public IP assignment
- Health check grace period

---

## 🎉 **Example Deployment Output**

```
✅ Building Docker image...
✅ Pushing to ECR: 123456789.dkr.ecr.us-east-1.amazonaws.com/delivery-frontend:20251130183045-test
✅ Registering task definition: delivery-frontend-test:3
✅ Service does not exist
✅ Creating service with network configuration...
✅ Service created successfully
✅ Waiting for service to become stable...
✅ Service is stable

=== Service Status ===
┌────────────┬─────────┬─────────┬──────────────────────────────────┐
│   Status   │ Running │ Desired │         TaskDefinition           │
├────────────┼─────────┼─────────┼──────────────────────────────────┤
│   ACTIVE   │    1    │    1    │ delivery-frontend-test:3         │
└────────────┴─────────┴─────────┴──────────────────────────────────┘
```

---

## 🚀 **Summary**

**Updated Features:**
- ✅ Automatic service creation
- ✅ VPC network configuration
- ✅ Load balancer integration
- ✅ Fixed task definition variables
- ✅ Enhanced status monitoring

**Deployment is now fully automated!** 🎉

Just provide your AWS resources on first deployment, and the workflow handles everything else!
