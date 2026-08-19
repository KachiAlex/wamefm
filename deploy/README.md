# Embassy Radio — VPS Deployment

## Architecture

```
Internet (port 8080)
    │
    ▼
  Nginx (reverse proxy)
    ├── /socket.io/  →  Backend (Node.js + Socket.io)
    ├── /hls/        →  SRS (HTTP HLS segments)
    └── /            →  Backend (REST API)
                           │
                           ▼
                      ffmpeg → RTMP → SRS (port 1935)
                                          │
                                          ▼
                                      HLS segments
                                      (/tmp/srs/hls)
```

## Stream Flow

1. **Broadcaster** captures mic audio → `MediaRecorder` → WebM chunks via Socket.io
2. **Backend** pipes WebM chunks into `ffmpeg` → converts to AAC/FLV → pushes RTMP to SRS
3. **SRS** receives RTMP → generates HLS `.m3u8` + `.ts` segments
4. **Listeners** fetch HLS via `hls.js` from `/hls/live/{streamKey}.m3u8`

## Prerequisites on VPS

- Docker Engine 24+
- Docker Compose v2+
- Ports 8080 (HTTP) and 1935 (RTMP) open in firewall

## Deployment Steps

### 1. Clone the repo on the VPS

```bash
git clone https://github.com/KachiAlex/wamefm.git
cd wamefm/deploy
```

### 2. Create .env from template

```bash
cp env.example .env
nano .env
```

Fill in all the real values (DATABASE_URL, JWT secrets, Cloudinary, etc.).
**Important:** `SRS_HOST=srs` (Docker service name, not public IP).

### 3. Build and start

```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
docker compose up -d --build
```

### 4. Verify

```bash
# Backend health
curl http://localhost:8080/ping

# SRS API
curl http://localhost:8080/srs-api/versions

# Check logs
docker compose logs -f
```

### 5. Update frontend

The frontend is already configured to point to `http://67.211.210.8:8080`.
Deploy the frontend to Vercel as usual — it will call the VPS backend.

## Firewall (UFW)

```bash
sudo ufw allow 8080/tcp   # HTTP API + HLS + Socket.io
sudo ufw allow 1935/tcp   # RTMP (only needed for external encoders)
```

## Useful Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f srs
docker compose logs -f nginx

# Restart
docker compose restart

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

## SSL/HTTPS

For production, add a domain + Let's Encrypt. Quick option with Caddy:

```yaml
# Add to docker-compose.yml
  caddy:
    image: caddy:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    depends_on:
      - nginx
    networks:
      - embassy-net
```

With `Caddyfile`:
```
api.yourdomain.com {
    reverse_proxy nginx:80
}
```

Then change frontend `API_BASE` to `https://api.yourdomain.com`.
