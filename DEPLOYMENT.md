# IntentLoop Deployment (`idea.quvonchbek.me` + SSL)

This guide deploys the app on the subdomain `idea.quvonchbek.me` while leaving the existing `quvonchbek.me` website untouched.

This guide deploys:
- Backend (NestJS + Prisma) as a systemd service on port 3000
- Frontend (Vite static build) served by Nginx
- Domain + HTTPS via Let's Encrypt

## 1. DNS

Point the subdomain to your server public IP:
- `A` record: `idea` -> `YOUR_SERVER_IP`

Leave your existing `@` / `www` records for `quvonchbek.me` exactly as they are.

Wait until DNS propagates.

## 2. Install dependencies on server

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 3. Upload project

Copy your `new/` folder to server, for example:
- `/var/www/intentloop/new`

## 4. PostgreSQL setup

```bash
sudo -u postgres psql
```

Inside psql:

```sql
ALTER USER postgres WITH PASSWORD '4321';
CREATE DATABASE idea;
\q
```

## 5. Backend setup

```bash
cd /var/www/intentloop/new/server
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run build
```

Create `/var/www/intentloop/new/server/.env`:

```env
DATABASE_URL=postgresql://postgres:4321@localhost:5432/idea
PORT=3000
JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=1h
CORS_ORIGINS=https://idea.quvonchbek.me
```

Create systemd service:

```bash
sudo tee /etc/systemd/system/intentloop-api.service > /dev/null << 'EOF'
[Unit]
Description=IntentLoop Nest API
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/intentloop/new/server
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
EnvironmentFile=/var/www/intentloop/new/server/.env
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF

sudo chown -R www-data:www-data /var/www/intentloop/new/server
sudo systemctl daemon-reload
sudo systemctl enable --now intentloop-api
sudo systemctl status intentloop-api --no-pager
```

## 6. Frontend setup

```bash
cd /var/www/intentloop/new/client
npm install
```

Create `/var/www/intentloop/new/client/.env.production`:

```env
VITE_API_BASE_URL=https://idea.quvonchbek.me/api/v1
```

Build frontend:

```bash
npm run build
```

## 7. Nginx config

```bash
sudo tee /etc/nginx/sites-available/intentloop > /dev/null << 'EOF'
server {
    listen 80;
    server_name idea.quvonchbek.me;

    root /var/www/intentloop/new/client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/intentloop /etc/nginx/sites-enabled/intentloop
sudo nginx -t
sudo systemctl reload nginx
```

## 8. HTTPS (Let's Encrypt)

```bash
sudo certbot --nginx -d idea.quvonchbek.me
```

## 9. Validate

```bash
curl -i https://idea.quvonchbek.me/api/v1/auth/login
sudo systemctl status intentloop-api --no-pager
sudo journalctl -u intentloop-api -n 100 --no-pager
```

## 10. Update deploy flow (next releases)

```bash
# backend
cd /var/www/intentloop/new/server
npm install
npm run build
npx prisma db push
sudo systemctl restart intentloop-api

# frontend
cd /var/www/intentloop/new/client
npm install
npm run build
sudo systemctl reload nginx
```
