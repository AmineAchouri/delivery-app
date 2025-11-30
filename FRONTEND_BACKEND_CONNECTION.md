# 🔗 Frontend-Backend Connection Configuration

## ✅ **What Changed**

The frontend deployment now supports connecting to the backend API with proper configuration!

---

## 🎯 **Key Updates**

### **1. Port 80 for Frontend** ✅
- Changed from port 3000 to **port 80** (standard HTTP)
- Matches typical web server conventions
- Easier for load balancer integration

### **2. Backend API URL Configuration** ✅
- Added `NEXT_PUBLIC_API_URL` environment variable
- Configurable via workflow input
- Allows frontend to connect to backend service

---

## 📋 **Deployment Configuration**

### **Workflow Inputs:**

```yaml
Environment: test
Image tag: (leave empty)
ECS Cluster: delivery-test-cluster
ECS Service: delivery-frontend-test
VPC Subnets: (optional for new service)
Security Groups: (optional for new service)
Target Group ARN: (optional for ALB)
Backend API URL: http://internal-backend-alb.us-east-1.elb.amazonaws.com  # NEW!
```

---

## 🔧 **Backend API URL Examples**

### **Option 1: Internal ALB (Recommended for ECS)**
```
http://internal-backend-alb-123456.us-east-1.elb.amazonaws.com
```

### **Option 2: Public ALB with Domain**
```
https://api.yourdomain.com
```

### **Option 3: Direct ECS Service (Not Recommended)**
```
http://10.0.1.50:3000
```

### **Option 4: Leave Empty (Configure Later)**
```
(leave empty - can update task definition later)
```

---

## 🏗️ **Architecture**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────────▶│   Frontend   │────────▶│   Backend   │
│             │         │   (Port 80)  │         │  (Port 3000)│
└─────────────┘         └──────────────┘         └─────────────┘
                              │                         │
                              │                         │
                        ┌─────▼─────┐           ┌───────▼──────┐
                        │  Frontend │           │   Backend    │
                        │    ALB    │           │     ALB      │
                        └───────────┘           └──────────────┘
```

---

## 📝 **Files Modified**

### **1. admin/Dockerfile**
```dockerfile
# Changed port from 3000 to 80
EXPOSE 80
ENV PORT=80
ENV NEXT_PUBLIC_API_URL=""
```

### **2. infra/admin-frontend-taskdef.template.json**
```json
{
  "portMappings": [
    { "containerPort": 80, "protocol": "tcp" }
  ],
  "environment": [
    {
      "name": "NEXT_PUBLIC_API_URL",
      "value": "${BACKEND_API_URL}"
    }
  ]
}
```

### **3. .github/workflows/frontend-deploy.yml**
```yaml
inputs:
  backend_api_url:
    description: Backend API URL
    required: false

# In render step:
BACKEND_API_URL="${{ github.event.inputs.backend_api_url }}"
sed -e "s|\${BACKEND_API_URL}|$BACKEND_API_URL|g"
```

---

## 🚀 **How to Deploy**

### **Step 1: Deploy Backend First**
```yaml
Workflow: Backend Deploy
Environment: test
Feature: core
ECS Cluster: delivery-test-cluster
ECS Service: delivery-core-api-test
```

**Note the backend service endpoint** (from ALB or service discovery)

---

### **Step 2: Deploy Frontend with Backend URL**
```yaml
Workflow: Frontend Deploy
Environment: test
ECS Cluster: delivery-test-cluster
ECS Service: delivery-frontend-test
Backend API URL: http://your-backend-alb.us-east-1.elb.amazonaws.com
```

---

## 🔍 **Finding Your Backend URL**

### **Option A: Using ALB (Recommended)**

1. **Go to AWS Console** → **EC2** → **Load Balancers**
2. **Find your backend ALB**
3. **Copy the DNS name:**
   ```
   internal-backend-alb-123456.us-east-1.elb.amazonaws.com
   ```
4. **Use as Backend API URL:**
   ```
   http://internal-backend-alb-123456.us-east-1.elb.amazonaws.com
   ```

### **Option B: Using Service Discovery**

```bash
# Get service discovery namespace
aws servicediscovery list-namespaces

# Use service discovery DNS
http://backend-api.local:3000
```

### **Option C: Using ECS Service Private IP (Not Recommended)**

```bash
# Get task private IP
aws ecs list-tasks --cluster delivery-test-cluster --service-name delivery-core-api-test
aws ecs describe-tasks --cluster delivery-test-cluster --tasks <task-arn>

# Use private IP (changes on redeploy!)
http://10.0.1.50:3000
```

---

## 🔐 **Security Considerations**

### **1. Use Internal ALB for Backend**
```
✅ Frontend and Backend in same VPC
✅ Backend ALB is internal (not public)
✅ Only frontend can access backend
✅ Backend not exposed to internet
```

### **2. Security Group Rules**
```bash
# Frontend Security Group
Inbound: Port 80 from ALB
Outbound: Port 3000 to Backend SG

# Backend Security Group
Inbound: Port 3000 from Frontend SG
Outbound: All (for database, etc.)
```

### **3. Use HTTPS in Production**
```
✅ Frontend ALB: HTTPS (port 443)
✅ Backend ALB: HTTPS (port 443) or HTTP (internal only)
✅ SSL/TLS certificates via ACM
```

---

## 🎨 **Frontend Code Usage**

### **In Your Next.js App:**

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchData() {
  const response = await fetch(`${API_URL}/api/data`);
  return response.json();
}
```

### **Example API Call:**

```typescript
// app/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/api/health`)
      .then(res => res.json())
      .then(data => setData(data));
  }, []);
  
  return <div>Backend Status: {data?.status}</div>;
}
```

---

## 🧪 **Testing the Connection**

### **1. Check Frontend Environment**
```bash
# SSH into frontend container
aws ecs execute-command \
  --cluster delivery-test-cluster \
  --task <task-id> \
  --container frontend \
  --interactive \
  --command "/bin/sh"

# Check environment variable
echo $NEXT_PUBLIC_API_URL
```

### **2. Test Backend Connectivity**
```bash
# From frontend container
curl $NEXT_PUBLIC_API_URL/api/health
```

### **3. Check Browser Console**
```javascript
// In browser console
console.log(process.env.NEXT_PUBLIC_API_URL);
```

---

## 📊 **Deployment Scenarios**

### **Scenario 1: Both Services in Same VPC**
```yaml
Frontend:
  - Port: 80
  - Backend URL: http://internal-backend-alb.us-east-1.elb.amazonaws.com
  - Security Group: Allow outbound to backend SG on port 3000

Backend:
  - Port: 3000
  - Security Group: Allow inbound from frontend SG on port 3000
```

### **Scenario 2: Public Backend API**
```yaml
Frontend:
  - Port: 80
  - Backend URL: https://api.yourdomain.com
  - Security Group: Allow outbound HTTPS

Backend:
  - Port: 3000 (behind public ALB on 443)
  - Security Group: Allow inbound from ALB SG
```

### **Scenario 3: Development/Testing**
```yaml
Frontend:
  - Port: 80
  - Backend URL: (empty - use localhost for dev)
  - Local dev: http://localhost:3000
```

---

## 🔄 **Updating Backend URL**

### **Option 1: Redeploy Frontend**
```yaml
# Re-run frontend deploy with new URL
Backend API URL: http://new-backend-url.com
```

### **Option 2: Update Task Definition Manually**
```bash
# Get current task definition
aws ecs describe-task-definition \
  --task-definition delivery-frontend-test \
  --query 'taskDefinition' > taskdef.json

# Edit taskdef.json - update NEXT_PUBLIC_API_URL

# Register new revision
aws ecs register-task-definition --cli-input-json file://taskdef.json

# Update service
aws ecs update-service \
  --cluster delivery-test-cluster \
  --service delivery-frontend-test \
  --task-definition delivery-frontend-test:NEW_REVISION
```

---

## ✅ **Summary**

**What You Get:**
- ✅ Frontend on port 80 (standard HTTP)
- ✅ Configurable backend API URL
- ✅ Environment variable injection
- ✅ Flexible deployment options
- ✅ Secure VPC communication

**How to Use:**
1. Deploy backend and note its URL
2. Deploy frontend with backend URL
3. Frontend automatically connects to backend
4. Update URL anytime by redeploying

**Next Steps:**
- Set up ALB for backend
- Configure security groups
- Add HTTPS certificates
- Test the connection!

🚀 **Your frontend is now ready to connect to the backend!**
