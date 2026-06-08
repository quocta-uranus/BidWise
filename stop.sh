#!/bin/bash
# Dừng database (không xóa dữ liệu)

echo "🛑 Dừng database..."
docker compose stop
echo "✅ Database đã dừng. Dữ liệu vẫn được giữ lại."
echo "   Chạy 'docker compose start' để bật lại."
