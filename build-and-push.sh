#!/bin/bash

# Build and Push Docker Images to Google Artifact Registry
# This script builds all Docker images and pushes them to Artifact Registry

set -e  # Exit on error

# Configuration
PROJECT_ID="linen-striker-451222-k9"
REGISTRY_LOCATION="australia-southeast1"
REGISTRY_NAME="deco3801-demo-project-registry"
REGISTRY_URL="${REGISTRY_LOCATION}-docker.pkg.dev/${PROJECT_ID}/${REGISTRY_NAME}"

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

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Generate timestamp once for consistent tagging
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo_info "========================================="
echo_info "Building and Pushing Docker Images"
echo_info "========================================="
echo_info "Registry URL: ${REGISTRY_URL}"
echo_info "Timestamp: ${TIMESTAMP}"
echo ""

# Build and push backend image
echo_info "Building backend image for linux/amd64..."
cd "${SCRIPT_DIR}/event-backend"
docker build --platform linux/amd64 \
             -t ${REGISTRY_URL}/event-backend:latest \
             -t ${REGISTRY_URL}/event-backend:${TIMESTAMP} \
             -f Dockerfile .

echo_info "Pushing backend image..."
docker push ${REGISTRY_URL}/event-backend:latest
docker push ${REGISTRY_URL}/event-backend:${TIMESTAMP}

# Build and push frontend image
echo_info "Building frontend image for linux/amd64..."
cd "${SCRIPT_DIR}/event-layout"
docker build --platform linux/amd64 \
             -t ${REGISTRY_URL}/event-frontend:latest \
             -t ${REGISTRY_URL}/event-frontend:${TIMESTAMP} \
             -f Dockerfile .

echo_info "Pushing frontend image..."
docker push ${REGISTRY_URL}/event-frontend:latest
docker push ${REGISTRY_URL}/event-frontend:${TIMESTAMP}

cd "${SCRIPT_DIR}"

echo ""
echo_info "========================================="
echo_info "Docker images built and pushed successfully!"
echo_info "========================================="
echo_info "Backend image: ${REGISTRY_URL}/event-backend:latest"
echo_info "Frontend image: ${REGISTRY_URL}/event-frontend:latest"
