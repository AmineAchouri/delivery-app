#!/bin/bash

# Script to create ECR repositories for the delivery app
# Run this once to set up all required ECR repositories

set -e

REGION="us-east-1"

echo "Creating ECR repositories in region: $REGION"
echo "=============================================="

# Function to create ECR repo if it doesn't exist
create_repo() {
  local repo_name=$1
  
  echo ""
  echo "Checking repository: $repo_name"
  
  if aws ecr describe-repositories --repository-names "$repo_name" --region "$REGION" >/dev/null 2>&1; then
    echo "✅ Repository '$repo_name' already exists"
  else
    echo "Creating repository '$repo_name'..."
    aws ecr create-repository \
      --repository-name "$repo_name" \
      --region "$REGION" \
      --image-scanning-configuration scanOnPush=true \
      --encryption-configuration encryptionType=KMS
    echo "✅ Repository '$repo_name' created successfully"
  fi
}

# Create all repositories
create_repo "delivery-mobile-pwa"
create_repo "delivery-frontend"
create_repo "delivery-backend"

echo ""
echo "=============================================="
echo "✅ All ECR repositories are ready!"
echo ""
echo "Repository URLs:"
aws ecr describe-repositories \
  --repository-names delivery-mobile-pwa delivery-frontend delivery-backend \
  --region "$REGION" \
  --query 'repositories[].repositoryUri' \
  --output table
