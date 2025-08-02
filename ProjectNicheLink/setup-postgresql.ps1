# NicheLink Setup with Local PostgreSQL
Write-Host "🚀 Setting up NicheLink with local PostgreSQL..." -ForegroundColor Green

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Host "❌ Node.js 18+ required. Current: $nodeVersion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
try {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL found: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL not found. Please install PostgreSQL first:" -ForegroundColor Red
    Write-Host "   Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "   After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Database Setup Required:" -ForegroundColor Yellow
Write-Host "1. Open pgAdmin or psql as postgres user" -ForegroundColor White
Write-Host "2. Run the script: database-setup.sql" -ForegroundColor White
Write-Host "3. Or run these commands manually:" -ForegroundColor White
Write-Host ""
Write-Host "   CREATE DATABASE nichelink;" -ForegroundColor Cyan
Write-Host "   CREATE USER nichelink WITH PASSWORD 'nichelink123';" -ForegroundColor Cyan
Write-Host "   GRANT ALL PRIVILEGES ON DATABASE nichelink TO nichelink;" -ForegroundColor Cyan
Write-Host ""

$setupDb = Read-Host "Have you created the database? (y/n)"
if ($setupDb -ne "y" -and $setupDb -ne "Y") {
    Write-Host "❌ Please setup the database first, then run this script again." -ForegroundColor Red
    exit 1
}

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "nichelink123"
    $testResult = psql -h localhost -U nichelink -d nichelink -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection failed. Please check your setup." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Cannot connect to database. Please verify:" -ForegroundColor Red
    Write-Host "   - PostgreSQL service is running" -ForegroundColor Yellow
    Write-Host "   - Database 'nichelink' exists" -ForegroundColor Yellow
    Write-Host "   - User 'nichelink' has correct permissions" -ForegroundColor Yellow
    exit 1
}

# Copy environment file
Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow
$envPath = "backend/auth-service/.env"
$examplePath = "backend/auth-service/.env.example"

if (-Not (Test-Path $envPath)) {
    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
        Write-Host "✅ Created .env file from template" -ForegroundColor Green
    }
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Set-Location "backend/auth-service"
npm install

# Create cache directory
Write-Host "📁 Creating cache directory..." -ForegroundColor Yellow
if (-Not (Test-Path "cache")) {
    New-Item -ItemType Directory -Path "cache"
    Write-Host "✅ Cache directory created" -ForegroundColor Green
}

# Run Prisma setup
Write-Host "🗄️ Setting up database schema..." -ForegroundColor Yellow
npx prisma generate
npx prisma migrate dev --name "initial_setup"

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start development:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Available endpoints:" -ForegroundColor Cyan
Write-Host "   Health Check: http://localhost:3001/api/health" -ForegroundColor White
Write-Host "   API Docs: http://localhost:3001/api/health/detailed" -ForegroundColor White
Write-Host ""
Write-Host "📚 Database Tools:" -ForegroundColor Cyan
Write-Host "   Prisma Studio: npx prisma studio" -ForegroundColor White
Write-Host "   Database Reset: npx prisma migrate reset" -ForegroundColor White
