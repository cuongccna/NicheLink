# NicheLink Project Setup Script for Windows
Write-Host "Setting up NicheLink project..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    
    # Extract major version number
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 20) {
        Write-Host "Node.js version 20+ is required. Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Node.js is not installed. Please install Node.js 20+ first." -ForegroundColor Red
    exit 1
}

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "Docker is available" -ForegroundColor Green
} catch {
    Write-Host "Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install

# Setup environment files
Write-Host "Setting up environment files..." -ForegroundColor Yellow

# Auth Service
$envPath = "backend/auth-service/.env"
$examplePath = "backend/auth-service/.env.example"

if (-Not (Test-Path $envPath)) {
    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
        Write-Host "Created backend/auth-service/.env from example" -ForegroundColor Green
        Write-Host "Please update the environment variables in backend/auth-service/.env" -ForegroundColor Yellow
    }
}

Write-Host "Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update environment variables in backend/auth-service/.env"
Write-Host "2. Install dependencies: npm run install:all"
Write-Host "3. Start databases: docker-compose up -d postgres mongodb redis"
Write-Host "4. Setup database: cd backend/auth-service && npx prisma migrate dev --name init"
Write-Host "5. Run development: npm run dev"
