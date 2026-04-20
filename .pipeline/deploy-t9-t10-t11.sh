#!/bin/bash
# Deploy T9/T10/T11 al VPS — ejecutar desde local con acceso SSH configurado
# Uso: ./deploy-t9-t10-t11.sh <ssh-key-path>
# Ejemplo: ./deploy-t9-t10-t11.sh ~/.ssh/id_rsa

set -e

VPS_USER="ubuntu"
VPS_HOST="161.153.203.83"
VPS_DIR="/home/ubuntu/vetconnect"
SSH_KEY="${1:-~/.ssh/id_rsa}"

echo "=== Deploy T9/T10/T11 — VetConnect Auth Fix ==="
echo "Target: ${VPS_USER}@${VPS_HOST}:${VPS_DIR}"
echo ""

# Archivos modificados por T9/T10/T11
CHANGED_API_FILES=(
  "apps/api/src/lib/auth.ts"
  "apps/api/src/lib/env.ts"
  "apps/api/src/middleware/cors.ts"
  "apps/api/src/middleware/rateLimit.ts"
  "apps/api/src/routes/users.ts"
  "apps/api/src/services/user.service.ts"
)

CHANGED_WEB_FILES=(
  "apps/web/src/lib/auth.ts"
  "apps/web/src/lib/api.ts"
)

echo "--- Paso 1: Copiar archivos modificados al VPS ---"

for f in "${CHANGED_API_FILES[@]}"; do
  echo "  rsync: $f"
  rsync -az -e "ssh -i ${SSH_KEY}" \
    "/c/Users/Ema/Desktop/claude/vetconnect/${f}" \
    "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/${f}"
done

for f in "${CHANGED_WEB_FILES[@]}"; do
  echo "  rsync: $f"
  rsync -az -e "ssh -i ${SSH_KEY}" \
    "/c/Users/Ema/Desktop/claude/vetconnect/${f}" \
    "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/${f}"
done

echo ""
echo "--- Paso 2: Actualizar .env del API en VPS ---"
echo "IMPORTANTE: Verificar que /home/ubuntu/vetconnect/apps/api/.env tiene:"
echo "  BETTER_AUTH_URL=https://vc-api.161-153-203-83.sslip.io"
echo "  CORS_ORIGINS=https://vetconnect-global.netlify.app,http://localhost:5173,http://localhost:3000"
echo "  NODE_ENV=production"
echo ""
echo "Para editar: ssh -i ${SSH_KEY} ${VPS_USER}@${VPS_HOST} 'nano ${VPS_DIR}/apps/api/.env'"
echo ""

echo "--- Paso 3: Build y restart en VPS ---"
ssh -i "${SSH_KEY}" "${VPS_USER}@${VPS_HOST}" << 'REMOTE'
  set -e
  cd /home/ubuntu/vetconnect

  echo "[VPS] Build packages/shared..."
  cd packages/shared
  npm run build
  cd /home/ubuntu/vetconnect

  echo "[VPS] Build apps/api..."
  cd apps/api
  npm run build
  cd /home/ubuntu/vetconnect

  echo "[VPS] Restart PM2..."
  pm2 restart vetconnect-api

  echo "[VPS] Esperando 3s para que PM2 levante..."
  sleep 3

  echo "[VPS] Logs recientes:"
  pm2 logs vetconnect-api --lines 20 --nostream

  echo "[VPS] PM2 status:"
  pm2 status vetconnect-api
REMOTE

echo ""
echo "=== Deploy completado ==="
echo "Ejecutar smoke test desde local (ver paso 4 en .pipeline/smoke-test-t9-t11.sh)"
