# Domain Configuration: Vercel Frontend + VPS Node.js Backend (HTTPS with Nginx)

This document explains how to set up:

- A custom domain for the frontend hosted on **Vercel**
- A separate subdomain for the backend hosted on a **VPS (DigitalOcean)**
- Full HTTPS support for the backend using **Nginx + Certbot (Let’s Encrypt)**

---

## 1. Domain Architecture

To avoid conflicts, the frontend and backend use different subdomains.  


| Service   | Domain                            | Hosting Platform |
|-----------|-----------------------------------|------------------|
| Frontend  | `robeurope.samuelponce.es`        | Vercel           |
| Backend   | `api.robeurope.samuelponce.es`    | DigitalOcean VPS |


---

## 2. DNS Setup for the Backend -> Ionos

Type: A
Name: api.robeurope
Value: 46.101.255.106
TTL: Auto


This creates the endpoint:  
`api.robeurope.samuelponce.es`

---

## 3. Installing Nginx on the VPS

Update packages and install Nginx:

```bash
sudo apt update
sudo apt install nginx -y
```

## 4. Configure Nginx as a Reverse Proxy for Node.js

```bash
sudo nano /etc/nginx/sites-available/api_robeurope
```
Server file config:

```nginx
server {
    listen 80;
    server_name api.robeurope.samuelponce.es;

    location / {
        proxy_pass http://localhost:85;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```


Later,

```bash
sudo ln -s /etc/nginx/sites-available/api_robeurope /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. Enable HTTPS with Certbot (Let’s Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.robeurope.samuelponce.es
```
Certbot will automatically configure HTTPS and redirect HTTP to HTTPS.

## Final Architecture

| Component         | Status                                          |
| ----------------- | ----------------------------------------------- |
| Frontend (Vercel) | Functional with custom domain                   |
| Backend (VPS)     | Running behind Nginx reverse proxy              |
| HTTPS             | Enabled using Let’s Encrypt                     |
| DNS               | Properly separated between frontend and backend |
