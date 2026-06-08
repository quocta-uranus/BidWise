#!/bin/bash
# BidWise — Start toàn bộ project

set -e  # Dừng ngay nếu có lỗi

echo ""
echo "======================================"
echo "  BidWise — Starting Development"
echo "======================================"
echo ""

# 1. Kiểm tra Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker chưa được cài. Tải tại: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "❌ Docker Desktop chưa được mở. Hãy mở Docker Desktop rồi chạy lại."
  exit 1
fi

echo "✅ Docker đang chạy"

# 2. Khởi động PostgreSQL + Redis
echo ""
echo "📦 Khởi động database (PostgreSQL + Redis)..."
docker compose up -d

echo "⏳ Chờ PostgreSQL sẵn sàng..."
until docker exec bidwise_postgres pg_isready -U bidwise -d bidwise &> /dev/null; do
  sleep 1
done
echo "✅ PostgreSQL sẵn sàng"

# 3. Backend setup
echo ""
echo "🔧 Cài dependencies backend..."
cd be
npm install --silent

echo "🗃️  Chạy database migration..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma migrate deploy

echo "🌱 Seed dữ liệu (roles, permissions)..."
npx prisma db seed 2>/dev/null || echo "   (seed đã chạy rồi, bỏ qua)"

echo "✅ Backend setup hoàn tất"

# 4. Frontend setup
cd ../fe
echo ""
echo "🎨 Cài dependencies frontend..."
npm install --silent
echo "✅ Frontend setup hoàn tất"

# 5. Thông tin
echo ""
echo "======================================"
echo "  ✅ Setup hoàn tất! Bây giờ mở"
echo "  2 terminal và chạy:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd be && npm run start:dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd fe && npm run dev"
echo ""
echo "  Backend : http://localhost:3001/api/v1"
echo "  Frontend: http://localhost:3000"
echo "======================================"
echo ""
