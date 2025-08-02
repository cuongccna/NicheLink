# NicheLink Setup Without Docker
Write-Host "Setting up NicheLink without Docker..." -ForegroundColor Green

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is required. Please install Node.js 20+ first." -ForegroundColor Red
    exit 1
}

# Create environment file
$envPath = "backend/auth-service/.env"
$examplePath = "backend/auth-service/.env.example"

if (-Not (Test-Path $envPath)) {
    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
        Write-Host "Created .env file" -ForegroundColor Green
    }
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
cd backend/auth-service
npm install

# Create database and cache directories
Write-Host "Creating database and cache directories..." -ForegroundColor Yellow
if (-Not (Test-Path "cache")) {
    New-Item -ItemType Directory -Path "cache"
}

# Run Prisma setup
Write-Host "Setting up SQLite database..." -ForegroundColor Yellow
npx prisma migrate dev --name init
npx prisma generate

Write-Host "Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor Cyan
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Health check will be available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:3001/api/health"
