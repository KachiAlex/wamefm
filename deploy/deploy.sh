#!/bin/bash
# Embassy Radio — VPS Deployment Script
# Run on the VPS after cloning the repo

set -e

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DEPLOY_DIR"

echo "=== Embassy Radio Backend Deployment ==="

# Check for .env
if [ ! -f .env ]; then
    echo "ERROR: .env file not found in deploy/"
    echo "Copy env.example to .env and fill in real values:"
    echo "  cp env.example .env"
    echo "  nano .env"
    exit 1
fi

# Build and start
echo "Building and starting containers..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo "=== Waiting for services to start ==="
sleep 5

# Health check
echo "Checking backend health..."
if curl -sf http://localhost:8080/ping > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed — check logs:"
    echo "  docker compose logs backend"
fi

echo ""
echo "=== Service Status ==="
docker compose ps

echo ""
echo "=== Stream Architecture ==="
echo "  Broadcaster → Socket.io → ffmpeg → RTMP (srs:1935) → HLS (srs:1985)"
echo "  Listeners   → http://YOUR_VPS_IP:8080/hls/live/{streamKey}.m3u8"
echo ""
echo "=== Useful Commands ==="
echo "  View logs:   docker compose logs -f"
echo "  Restart:     docker compose restart"
echo "  Stop:        docker compose down"
