#!/bin/bash

# GKE Deployment Script for DECO3801 Demo Project
# This script sets up a complete GKE cluster and deploys the application

set -e  # Exit on error

# Configuration
PROJECT_ID="linen-striker-451222-k9"
CLUSTER_NAME="deco3801-demo-project"
REGION="australia-southeast1"
REGISTRY_NAME="deco3801-demo-project-registry"
REGISTRY_LOCATION="australia-southeast1"

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

# Step 1: Authentication
echo_info "Step 1: Authenticating with Google Cloud..."
# gcloud auth login

# Step 2: Set project
echo_info "Step 2: Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Step 3: Enable required APIs
echo_info "Step 3: Enabling required Google Cloud APIs..."
gcloud services enable container.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable compute.googleapis.com

# Step 4: Create Artifact Registry
echo_info "Step 4: Creating Artifact Registry..."
if gcloud artifacts repositories describe ${REGISTRY_NAME} --location=${REGISTRY_LOCATION} &>/dev/null; then
    echo_warn "Artifact Registry '${REGISTRY_NAME}' already exists. Skipping creation."
else
    gcloud artifacts repositories create ${REGISTRY_NAME} \
        --repository-format=docker \
        --location=${REGISTRY_LOCATION} \
        --description="Docker registry for DECO3801 demo project"
    echo_info "Artifact Registry created successfully."
fi

# Step 5: Configure Docker authentication for Artifact Registry
echo_info "Step 5: Configuring Docker authentication for Artifact Registry..."
gcloud auth configure-docker ${REGISTRY_LOCATION}-docker.pkg.dev

# Step 6: Create GKE Autopilot Cluster
echo_info "Step 6: Creating GKE Autopilot cluster..."
if gcloud container clusters describe ${CLUSTER_NAME} --region=${REGION} &>/dev/null; then
    echo_warn "GKE cluster '${CLUSTER_NAME}' already exists. Skipping creation."
else
    gcloud beta container \
        --project "${PROJECT_ID}" clusters create-auto "${CLUSTER_NAME}" \
        --region "${REGION}" \
        --release-channel "regular" \
        --enable-ip-access \
        --no-enable-google-cloud-access \
        --network "projects/${PROJECT_ID}/global/networks/default" \
        --subnetwork "projects/${PROJECT_ID}/regions/${REGION}/subnetworks/default" \
        --cluster-ipv4-cidr "/17" \
        --binauthz-evaluation-mode=DISABLED

    echo_info "GKE cluster created successfully. Waiting for cluster to be ready..."
    sleep 30
fi

# Step 7: Get cluster credentials
echo_info "Step 7: Getting cluster credentials..."
gcloud container clusters get-credentials ${CLUSTER_NAME} --region=${REGION}

# Step 8: Verify cluster connection
echo_info "Step 8: Verifying cluster connection..."
kubectl cluster-info
kubectl get nodes

# Step 9: Build and push Docker images
echo_info "Step 9: Building and pushing Docker images..."
./build-and-push.sh

# Step 10: Create Kubernetes namespace
echo_info "Step 10: Creating Kubernetes namespace..."
kubectl create namespace event-app --dry-run=client -o yaml | kubectl apply -f -

# Step 11: Create secrets
echo_info "Step 11: Creating Kubernetes secrets..."
kubectl create secret generic db-credentials \
    --from-literal=POSTGRES_DB=event_db \
    --from-literal=POSTGRES_USER=event_user \
    --from-literal=POSTGRES_PASSWORD=event_password \
    --namespace=event-app \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic django-secret \
    --from-literal=SECRET_KEY=django-insecure-8pjrjnofge28zooth-ukuwmm-ah-hc8gtgh7cge7hysp \
    --namespace=event-app \
    --dry-run=client -o yaml | kubectl apply -f -

# Step 12: Apply Kubernetes manifests
echo_info "Step 12: Applying Kubernetes manifests..."
kubectl apply -f k8s/ --namespace=event-app

# Step 13: Wait for deployments to be ready
echo_info "Step 13: Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=600s deployment --all -n event-app

# Step 14: Get service endpoints
echo_info "Step 14: Getting service endpoints..."
echo_info "Waiting for external IP to be assigned..."
sleep 10

echo ""
echo_info "========================================="
echo_info "Deployment Summary"
echo_info "========================================="
kubectl get all -n event-app
echo ""
echo_info "External endpoints:"
kubectl get svc -n event-app

echo ""
echo_info "========================================="
echo_info "Deployment completed successfully!"
echo_info "========================================="
echo_warn "Note: It may take a few minutes for the LoadBalancer IP to be assigned."
echo_warn "Run 'kubectl get svc -n event-app' to check the external IP status."
