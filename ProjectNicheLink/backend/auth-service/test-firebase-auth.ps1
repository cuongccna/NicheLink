# Test Firebase Authentication Endpoints

Write-Host "Testing Firebase Authentication Integration..." -ForegroundColor Green

# Test Health Check
Write-Host "`n1. Health Check:" -ForegroundColor Yellow
$healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get
Write-Host "Status: $($healthResponse.status)" -ForegroundColor Green

# Test User Registration (SME)
Write-Host "`n2. Testing SME Registration:" -ForegroundColor Yellow
$smeData = @{
    email = "test-sme@nichelink.com"
    password = "TestPassword123!"
    fullName = "Test SME Company"
    role = "SME"
    phoneNumber = "+84912345678"
    companyName = "Test Company Ltd"
    businessType = "Technology"
    industry = "Software Development"
    website = "https://testcompany.com"
} | ConvertTo-Json

try {
    $smeResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -Body $smeData -ContentType "application/json"
    Write-Host "SME Registration: SUCCESS" -ForegroundColor Green
    Write-Host "User ID: $($smeResponse.data.user.id)" -ForegroundColor Cyan
} catch {
    Write-Host "SME Registration: $($_.Exception.Message)" -ForegroundColor Red
}

# Test User Registration (Influencer)
Write-Host "`n3. Testing Influencer Registration:" -ForegroundColor Yellow
$influencerData = @{
    email = "test-influencer@nichelink.com"
    password = "TestPassword123!"
    fullName = "Test Influencer"
    role = "INFLUENCER"
    phoneNumber = "+84987654321"
    displayName = "TestInfluencer"
    bio = "Technology reviewer and content creator"
    categories = @("technology", "lifestyle")
    languages = @("vi", "en")
} | ConvertTo-Json

try {
    $influencerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -Body $influencerData -ContentType "application/json"
    Write-Host "Influencer Registration: SUCCESS" -ForegroundColor Green
    Write-Host "User ID: $($influencerResponse.data.user.id)" -ForegroundColor Cyan
} catch {
    Write-Host "Influencer Registration: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nFirebase Authentication Integration Test Completed!" -ForegroundColor Green
