#!/bin/bash

# GKE Cleanup Script for DECO3801 Demo Project
# This script removes all GKE resources

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

echo_warn "========================================="
echo_warn "GKE Cleanup Script"
echo_warn "========================================="
echo_warn "This will delete:"
echo_warn "  - Kubernetes namespace: event-app"
echo_warn "  - GKE Cluster: ${CLUSTER_NAME}"
echo_warn "  - Artifact Registry: ${REGISTRY_NAME}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo_info "Cleanup cancelled."
    exit 0
fi

# Set project
echo_info "Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Get cluster credentials
echo_info "Getting cluster credentials..."
if gcloud container clusters describe ${CLUSTER_NAME} --region=${REGION} &>/dev/null; then
    gcloud container clusters get-credentials ${CLUSTER_NAME} --region=${REGION}

    # Delete namespace (this will delete all resources in the namespace)
    echo_info "Deleting Kubernetes namespace..."
    kubectl delete namespace event-app --ignore-not-found=true

    echo_info "Waiting for namespace deletion to complete..."
    sleep 10
else
    echo_warn "Cluster ${CLUSTER_NAME} not found. Skipping namespace deletion."
fi

# Delete GKE cluster
echo_info "Deleting GKE cluster..."
if gcloud container clusters describe ${CLUSTER_NAME} --region=${REGION} &>/dev/null; then
    gcloud container clusters delete ${CLUSTER_NAME} \
        --region=${REGION} \
        --quiet
    echo_info "GKE cluster deleted successfully."
else
    echo_warn "GKE cluster '${CLUSTER_NAME}' not found. Skipping deletion."
fi

# Ask about Artifact Registry deletion
echo ""
read -p "Do you want to delete the Artifact Registry? This will remove all Docker images. (yes/no): " DELETE_REGISTRY

if [ "$DELETE_REGISTRY" = "yes" ]; then
    echo_info "Deleting Artifact Registry..."
    if gcloud artifacts repositories describe ${REGISTRY_NAME} --location=${REGISTRY_LOCATION} &>/dev/null; then
        gcloud artifacts repositories delete ${REGISTRY_NAME} \
            --location=${REGISTRY_LOCATION} \
            --quiet
        echo_info "Artifact Registry deleted successfully."
    else
        echo_warn "Artifact Registry '${REGISTRY_NAME}' not found. Skipping deletion."
    fi
else
    echo_info "Keeping Artifact Registry."
fi

echo ""
echo_info "========================================="
echo_info "Cleanup completed successfully!"
echo_info "========================================="
