#!/bin/bash

# NicheLink Project Setup Script
echo "🚀 Setting up NicheLink project..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker is available"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup environment files
echo "🔧 Setting up environment files..."

# Auth Service
if [ ! -f "backend/auth-service/.env" ]; then
    cp backend/auth-service/.env.example backend/auth-service/.env
    echo "📝 Created backend/auth-service/.env from example"
    echo "⚠️  Please update the environment variables in backend/auth-service/.env"
fi

# Install all service dependencies
echo "📦 Installing service dependencies..."
npm run install:all

# Start database services
echo "🗄️ Starting database services..."
docker-compose up -d postgres mongodb redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Setup databases
echo "🔧 Setting up databases..."
cd backend/auth-service
npx prisma migrate dev --name init
npx prisma generate
cd ../..

echo "✅ NicheLink project setup completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Update environment variables in backend/auth-service/.env"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Visit http://localhost:3001/api/health to check auth service"
echo ""
echo "📚 Available commands:"
echo "- npm run dev           # Start all services in development mode"
echo "- npm run dev:backend   # Start only backend services"
echo "- npm run docker:up     # Start all Docker services"
echo "- npm run docker:down   # Stop all Docker services"
