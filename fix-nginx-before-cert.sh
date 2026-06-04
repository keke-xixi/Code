#!/bin/bash
set -e

echo "==> 1. 查找 ssl 引用"
grep -rn "ssl_certificate\|letsencrypt" /etc/nginx/ 2>/dev/null || true

echo ""
echo "==> 2. 备份 conf.d"
for f in /etc/nginx/conf.d/*.conf; do
  [ -f "$f" ] && mv "$f" "${f}.bak.$(date +%F)" && echo "已备份: $f"
done

echo ""
echo "==> 3. 备份主配置"
cp /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.bak.$(date +%F-%H%M%S)"

echo ""
echo "==> 4. 写入纯 HTTP 配置"
tee /etc/nginx/nginx.conf > /dev/null << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    client_max_body_size 200m;

    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  ljrsin.cn www.ljrsin.cn;

        root /home/front/build;
        index index.html;

        location ^~ /.well-known/acme-challenge/ {
            root /var/www/certbot;
            allow all;
        }

        location ^~ /wx-api/ {
            proxy_pass http://127.0.0.1:5010/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
            proxy_connect_timeout 60s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }

        location ^~ /api/ {
            proxy_pass http://127.0.0.1:3001/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location = /index.html {
            root /home/front/build;
        }

        location / {
            try_files $uri $uri/ /index.html;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

mkdir -p /var/www/certbot

echo ""
echo "==> 5. 测试并重载"
nginx -t
systemctl reload nginx

echo ""
echo "==> 6. 验证"
curl -s http://127.0.0.1/wx-api/api/health
echo ""
echo ""
echo "完成！接下来: certbot --nginx -d ljrsin.cn -d www.ljrsin.cn"
