# 🔍 How to Get Your AWS Resources

## ❌ **The Error You're Seeing**

```
Error retrieving subnet information for [subnet-abc123, subnet-def456]: 
The subnet ID 'subnet-abc123' does not exist
```

**Cause:** You're using placeholder/example subnet IDs instead of real ones from your AWS account.

---

## ✅ **Step 1: Get Your Real Subnet IDs**

### **Option A: Using AWS CLI**

```bash
# List all subnets in your VPC
aws ec2 describe-subnets \
  --query 'Subnets[*].[SubnetId,AvailabilityZone,CidrBlock,VpcId]' \
  --output table

# Example output:
# -------------------------------------------------------------------------
# |                           DescribeSubnets                             |
# +------------------+---------------+------------------+------------------+
# |  subnet-0a1b2c3d |  us-east-1a   |  10.0.1.0/24     |  vpc-xyz123     |
# |  subnet-4e5f6g7h |  us-east-1b   |  10.0.2.0/24     |  vpc-xyz123     |
# |  subnet-8i9j0k1l |  us-east-1c   |  10.0.3.0/24     |  vpc-xyz123     |
# +------------------+---------------+------------------+------------------+
```

### **Option B: Using AWS Console**

1. Go to **AWS Console** → **VPC** → **Subnets**
2. Look for subnets in your VPC
3. Copy the **Subnet ID** (e.g., `subnet-0a1b2c3d4e5f6g7h`)
4. You need **at least 2 subnets** in different availability zones

### **Option C: Filter by VPC**

```bash
# If you know your VPC ID
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=vpc-YOUR_VPC_ID" \
  --query 'Subnets[*].[SubnetId,AvailabilityZone,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

---

## ✅ **Step 2: Get Your Security Group ID**

### **Option A: Using AWS CLI**

```bash
# List all security groups
aws ec2 describe-security-groups \
  --query 'SecurityGroups[*].[GroupId,GroupName,Description,VpcId]' \
  --output table

# Example output:
# -------------------------------------------------------------------------
# |                      DescribeSecurityGroups                          |
# +------------------+------------------+-------------------------+--------+
# |  sg-0a1b2c3d     |  default         |  Default security group | vpc-xyz|
# |  sg-4e5f6g7h     |  backend-api-sg  |  Backend API SG         | vpc-xyz|
# +------------------+------------------+-------------------------+--------+
```

### **Option B: Using AWS Console**

1. Go to **AWS Console** → **EC2** → **Security Groups**
2. Find or create a security group for your backend
3. Copy the **Security Group ID** (e.g., `sg-0a1b2c3d4e5f6g7h`)

### **Option C: Create a New Security Group**

```bash
# Create security group for backend
aws ec2 create-security-group \
  --group-name delivery-backend-sg \
  --description "Security group for delivery backend API" \
  --vpc-id vpc-YOUR_VPC_ID

# Output will give you the GroupId: sg-xxxxx

# Allow inbound traffic on port 3000 (from anywhere or specific source)
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR_NEW_SG_ID \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0
```

---

## ✅ **Step 3: Get Your Target Group ARN (Optional)**

Only needed if you want to attach a load balancer.

### **Using AWS CLI**

```bash
# List all target groups
aws elbv2 describe-target-groups \
  --query 'TargetGroups[*].[TargetGroupArn,TargetGroupName,Port,Protocol]' \
  --output table

# Example output:
# arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/backend-tg/abc123
```

### **Using AWS Console**

1. Go to **AWS Console** → **EC2** → **Target Groups**
2. Find your target group
3. Copy the **ARN**

---

## ✅ **Step 4: Get Your ECS Cluster Name**

```bash
# List all ECS clusters
aws ecs list-clusters

# Example output:
# {
#     "clusterArns": [
#         "arn:aws:ecs:us-east-1:123456789:cluster/delivery-test-cluster"
#     ]
# }

# Or describe clusters
aws ecs describe-clusters \
  --clusters delivery-test-cluster \
  --query 'clusters[*].[clusterName,status,runningTasksCount]' \
  --output table
```

---

## 📝 **Step 5: Run Your Deployment with Real Values**

Now go to **GitHub Actions** → **Backend Deploy** → **Run workflow** with:

```yaml
Environment: test
Feature: core
Image tag: (leave empty)
ECS Cluster: delivery-test-cluster
ECS Service: delivery-core-api-test
VPC Subnets: subnet-0a1b2c3d4e5f6g7h,subnet-8i9j0k1l2m3n4o5p
Security Groups: sg-0a1b2c3d4e5f6g7h
Target Group ARN: (leave empty or provide real ARN)
```

---

## 🎯 **Real Example**

Here's what your inputs should look like with **real AWS resource IDs**:

```yaml
Environment: test
Feature: core
ECS Cluster: delivery-test-cluster
ECS Service: delivery-core-api-test
VPC Subnets: subnet-0abc123def456789,subnet-0def456abc789012
Security Groups: sg-0123456789abcdef0
Target Group ARN: arn:aws:elasticloadbalancing:us-east-1:341124396635:targetgroup/delivery-backend/abc123def456
```

---

## 🔍 **Quick Check Script**

Save this as `check-aws-resources.sh` and run it:

```bash
#!/bin/bash

echo "=== ECS Clusters ==="
aws ecs list-clusters --query 'clusterArns[*]' --output table

echo ""
echo "=== VPC Subnets ==="
aws ec2 describe-subnets \
  --query 'Subnets[*].[SubnetId,AvailabilityZone,CidrBlock,VpcId]' \
  --output table

echo ""
echo "=== Security Groups ==="
aws ec2 describe-security-groups \
  --query 'SecurityGroups[*].[GroupId,GroupName,VpcId]' \
  --output table

echo ""
echo "=== Target Groups ==="
aws elbv2 describe-target-groups \
  --query 'TargetGroups[*].[TargetGroupArn,TargetGroupName]' \
  --output table 2>/dev/null || echo "No target groups found or ALB not configured"
```

Run it:
```bash
chmod +x check-aws-resources.sh
./check-aws-resources.sh
```

---

## ⚠️ **Important Notes**

### **Subnet Requirements:**
- ✅ Must be in the **same VPC**
- ✅ Need **at least 2 subnets** in different availability zones
- ✅ Subnets must have **internet access** (via NAT Gateway or Internet Gateway)
- ✅ Must be in the **us-east-1** region (or change region in workflow)

### **Security Group Requirements:**
- ✅ Must be in the **same VPC** as the subnets
- ✅ Must allow **inbound traffic on port 3000** (for backend)
- ✅ Must allow **outbound traffic** (for database, internet access)

### **Common Issues:**

1. **Subnets in different VPCs** → Use subnets from the same VPC
2. **No internet access** → Add NAT Gateway or use public subnets with IGW
3. **Security group blocks traffic** → Check inbound/outbound rules
4. **Wrong region** → Ensure resources are in us-east-1 (or update workflow)

---

## 🚀 **After Getting Real IDs**

1. **Copy your real subnet IDs** (e.g., `subnet-0abc123,subnet-0def456`)
2. **Copy your real security group ID** (e.g., `sg-0abc123`)
3. **Re-run the GitHub Actions workflow** with these real values
4. **Watch it succeed!** ✅

---

## 💡 **Pro Tip**

Save your resource IDs somewhere safe for future deployments:

```yaml
# My AWS Resources for delivery-app
Region: us-east-1
VPC: vpc-0abc123def456789
Subnets:
  - subnet-0abc123def456789 (us-east-1a)
  - subnet-0def456abc789012 (us-east-1b)
Security Groups:
  - sg-0123456789abcdef0 (delivery-backend-sg)
ECS Cluster: delivery-test-cluster
Target Group: arn:aws:elasticloadbalancing:us-east-1:341124396635:targetgroup/delivery-backend/abc123
```

---

## ✅ **Summary**

**The issue:** Using placeholder subnet IDs (`subnet-abc123`)  
**The solution:** Get real subnet IDs from your AWS account  
**How to get them:** Use AWS CLI or Console (commands above)  
**What you need:** 2+ subnet IDs, 1 security group ID, cluster name

Once you have the real IDs, re-run the deployment and it will work! 🎉
