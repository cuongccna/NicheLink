# NicheLink Quick Setup (Assumes PostgreSQL is installed)
Write-Host "🚀 Setting up NicheLink project..." -ForegroundColor Green

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Navigate to project root
Set-Location "d:\projects\NicheLink\ProjectNicheLink"

# Copy environment file for auth service
Write-Host "🔧 Setting up environment files..." -ForegroundColor Yellow
$envPath = "backend\auth-service\.env"
$examplePath = "backend\auth-service\.env.example"

if (-Not (Test-Path $envPath)) {
    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
        Write-Host "✅ Created .env file for auth service" -ForegroundColor Green
    }
}

# Install auth service dependencies
Write-Host "📦 Installing auth service dependencies..." -ForegroundColor Yellow
Set-Location "backend\auth-service"
npm install

# Create cache directory
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
if (-Not (Test-Path "cache")) {
    New-Item -ItemType Directory -Path "cache"
    Write-Host "✅ Cache directory created" -ForegroundColor Green
}

if (-Not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
    Write-Host "✅ Logs directory created" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Basic setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor White
Write-Host "2. Create database using: database-setup.sql" -ForegroundColor White
Write-Host "3. Update .env file with your database credentials" -ForegroundColor White
Write-Host "4. Run: npx prisma migrate dev --name init" -ForegroundColor White
Write-Host "5. Start development: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📄 For detailed PostgreSQL setup, see: PostgreSQL-Setup-Guide.md" -ForegroundColor Yellow
