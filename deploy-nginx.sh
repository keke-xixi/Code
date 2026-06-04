#!/bin/bash
set -e

CONF_SRC="${1:-./nginx.conf}"
NGINX_CONF="/etc/nginx/nginx.conf"

echo "==> 备份当前配置"
sudo cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%F-%H%M%S)"

echo "==> 安装新配置"
sudo cp "$CONF_SRC" "$NGINX_CONF"

echo "==> 备份 conf.d 里可能冲突的 default.conf"
if [ -f /etc/nginx/conf.d/default.conf ]; then
  sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak
fi

echo "==> 检查语法"
sudo nginx -t

echo "==> 重载 Nginx"
sudo systemctl reload nginx

echo ""
echo "==> 验证 wx-api（应返回 JSON，不能是 HTML）"
curl -s http://127.0.0.1/wx-api/api/health
echo ""
echo ""
echo "==> 验证登录 POST"
curl -s -X POST http://127.0.0.1/wx-api/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
echo ""
