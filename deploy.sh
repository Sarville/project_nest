#!/bin/bash
set -e

APP_DIR="/var/www/petproject-frontend"
cd "$APP_DIR"

echo "[$(date)] === Frontend deploy started ==="

git pull origin master
docker compose -f docker-compose.prod.yml up -d --build

echo "[$(date)] === Frontend deploy complete ==="
docker ps --filter "name=petproject_frontend"
