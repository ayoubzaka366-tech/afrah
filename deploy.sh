#!/bin/bash
# ============================================================
# Afrah - Deploy Script for Oracle Cloud Free VPS (Ubuntu 22.04)
# ============================================================
set -e

echo "Updating system..."
sudo apt update && sudo apt upgrade -y

echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v

echo "Installing Chromium for WhatsApp Puppeteer..."
sudo apt install -y chromium-browser
sudo apt install -y chromium-chromedriver

echo "Installing PM2 globally..."
sudo npm install -g pm2

echo "Setting up project..."
cd ~
git clone <YOUR_REPO_URL> afrah
cd afrah

echo "Installing backend dependencies..."
cd bb
npm install

echo "Installing frontend dependencies..."
cd ../fff
npm install

echo "Building frontend..."
npm run build

cd ..

echo "Creating uploads directories..."
mkdir -p bb/uploads/events bb/uploads/packages bb/uploads/categories bb/uploads/slides bb/uploads/settings bb/uploads/products bb/uploads/videos

echo "Setting up PM2 ecosystem..."
cat > bb/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'afrah-backend',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      JWT_SECRET: 'your-strong-secret-here-change-it'
    }
  }]
};
EOF

echo "Starting backend with PM2..."
cd bb
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo "Installing and configuring Nginx..."
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/afrah > /dev/null << 'NGINX'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    client_max_body_size 50M;

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/afrah /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "Configuring firewall..."
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

echo ""
echo "============================================"
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set your domain: sudo nano /etc/nginx/sites-available/afrah"
echo "   (replace YOUR_DOMAIN_OR_IP with your actual domain or IP)"
echo ""
echo "2. Update JWT_SECRET: nano bb/ecosystem.config.js"
echo "   then: pm2 restart afrah-backend"
echo ""
echo "3. (Optional) Set up SSL with Certbot:"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "4. Access your site at http://YOUR_SERVER_IP"
echo "   Admin panel: /admin/login"
echo "   Email: admin@afrah.com"
echo "   Password: admin123"
echo ""
echo "5. Set up WhatsApp: go to Admin -> WhatsApp"
echo "============================================"
