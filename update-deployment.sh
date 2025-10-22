#!/bin/bash

# Quick Update Script - Rebuild images and restart deployments
# Use this script when you've made code changes and want to deploy to GKE

set -e  # Exit on error

# Configuration
PROJECT_ID="linen-striker-451222-k9"
REGION="australia-southeast1"
CLUSTER_NAME="deco3801-demo-project"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_info "========================================="
echo_info "Quick Deployment Update"
echo_info "========================================="

# Step 1: Get cluster credentials
echo_info "Step 1: Getting cluster credentials..."
gcloud container clusters get-credentials ${CLUSTER_NAME} --region=${REGION} --project=${PROJECT_ID}

# Step 2: Build and push new images
echo_info "Step 2: Building and pushing Docker images..."
./build-and-push.sh

# Step 3: Force Kubernetes to pull and restart with new images
echo_info "Step 3: Restarting deployments to pull latest images..."
kubectl rollout restart deployment/backend -n event-app
kubectl rollout restart deployment/frontend -n event-app

# Step 4: Wait for rollout to complete
echo_info "Step 4: Waiting for rollouts to complete..."
echo_info "Waiting for backend..."
kubectl rollout status deployment/backend -n event-app --timeout=300s
echo_info "Waiting for frontend..."
kubectl rollout status deployment/frontend -n event-app --timeout=300s

# Step 5: Show deployment status
echo_info "Step 5: Checking deployment status..."
kubectl get pods -n event-app

echo ""
echo_info "========================================="
echo_info "Update completed successfully!"
echo_info "========================================="

# Get frontend URL
FRONTEND_IP=$(kubectl get svc frontend-service -n event-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -n "$FRONTEND_IP" ]; then
    echo_info "Frontend URL: http://${FRONTEND_IP}"
else
    echo_warn "Frontend IP not yet assigned. Run: kubectl get svc -n event-app"
fi


