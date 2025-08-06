#!/bin/bash

# Test Railway Deployment
echo "🚀 Testing ClubOS V3 Backend Deployment..."
echo ""

# Replace with your actual Railway domain once generated
DOMAIN="YOUR_RAILWAY_DOMAIN.up.railway.app"

# Test health endpoint
echo "Testing health endpoint..."
curl -s https://$DOMAIN/health | jq '.' || echo "Failed to reach health endpoint"

echo ""
echo "Testing detailed health..."
curl -s https://$DOMAIN/health/detailed | jq '.' || echo "Failed to reach detailed health"

echo ""
echo "Testing API info..."
curl -s https://$DOMAIN/api | jq '.' || echo "Failed to reach API info"

echo ""
echo "✅ Deployment test complete!"