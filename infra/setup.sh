#!/bin/bash
set -e

echo "==> Updating system packages..."
apt update && apt install -y docker.io docker-compose-v2 ufw

echo "==> Configuring firewall..."
ufw allow 22
ufw allow 3000
ufw allow 9000
ufw allow 11434
ufw --force enable

echo "==> Enabling Docker service..."
systemctl enable --now docker

echo "==> Pulling Ollama model in background (~5GB, may take a while)..."
docker run --rm -d --name ollama-pull ollama/ollama pull qwen3:8b &

echo ""
echo "Setup complete. Next steps:"
echo "  1. Copy docker-compose.yml to this server"
echo "  2. Create a .env file with WAHA_API_KEY"
echo "  3. Run: docker compose up -d"
echo "  4. Wait for Ollama model pull to finish: docker logs ollama-pull"
