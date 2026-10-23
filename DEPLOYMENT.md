# ReceptionAI — Production Deployment Guide

This guide details deploying ReceptionAI in production environments using Docker, PostgreSQL, and cloud hosting platforms.

---

## 1. Production Architecture Overview

- **Frontend:** Single Page Application (SPA) served via Nginx, Vercel, Cloudflare Pages, or AWS CloudFront/S3.
- **Backend API:** Node.js (v20+ or v24+) Express server deployed on AWS ECS, GCP Cloud Run, Render, or Railway.
- **Database:** PostgreSQL (v15+) hosted on AWS RDS, GCP Cloud SQL, or Neon/Supabase.
- **Background Jobs:** Node.js scheduling worker for appointment reminder dispatches.

---

## 2. Environment Variables Checklist

Ensure these variables are configured in your production secrets manager:

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | API listen port | `5000` |
| `CLIENT_URL` | Frontend origin for CORS | `https://app.receptionai.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/reception_ai?schema=public` |
| `JWT_SECRET` | Strong 64+ char random secret | `openssl rand -hex 32` |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key | `AIzaSy...` |
| `STRIPE_SECRET_KEY` | Stripe Production Secret Key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Endpoint Secret | `whsec_...` |
| `STRIPE_MOCK_MODE` | Disable simulation in production | `false` |
| `SMTP_HOST` | Transactional email host | `smtp.mailgun.org` |
| `SMTP_USER` | Email username | `postmaster@receptionai.com` |
| `SMTP_PASS` | Email password | `...` |

---

## 3. Database Migration for PostgreSQL

When switching from local SQLite to PostgreSQL:

1. Update `server/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Run database migration:
   ```bash
   npx prisma migrate deploy
   ```
3. Seed production subscription plans:
   ```bash
   npm run db:seed
   ```

---

## 4. Docker Containerization

### Dockerfile (`server/Dockerfile`):
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000
CMD ["node", "dist/server.js"]
```

---

## 5. Reverse Proxy & SSL Configuration (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name app.receptionai.com;

    ssl_certificate /etc/letsencrypt/live/app.receptionai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.receptionai.com/privkey.pem;

    # Serve built React static assets
    location / {
        root /var/www/reception-ai/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API & Embed Widget requests
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location = /widget.js {
        proxy_pass http://localhost:5000/widget.js;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=3600";
    }
}
```
