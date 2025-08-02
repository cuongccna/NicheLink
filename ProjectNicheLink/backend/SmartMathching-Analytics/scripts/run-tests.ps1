# NicheLink Smart Matching Analytics Test Runner
# PowerShell script for Windows environment

param(
    [Parameter(Position=0)]
    [string]$TestType = "all"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-ColoredText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Run-TestSuite {
    param(
        [string]$TestName,
        [string]$TestCommand
    )
    
    Write-ColoredText "Running $TestName..." $Yellow
    $StartTime = Get-Date
    
    try {
        Invoke-Expression $TestCommand
        $EndTime = Get-Date
        $Duration = [math]::Round(($EndTime - $StartTime).TotalSeconds, 2)
        Write-ColoredText "✓ $TestName completed successfully in ${Duration}s" $Green
        return $true
    }
    catch {
        $EndTime = Get-Date
        $Duration = [math]::Round(($EndTime - $StartTime).TotalSeconds, 2)
        Write-ColoredText "✗ $TestName failed after ${Duration}s" $Red
        Write-ColoredText "Error: $($_.Exception.Message)" $Red
        return $false
    }
}

# Header
Write-ColoredText "======================================" $Blue
Write-ColoredText "   NicheLink Smart Matching Analytics" $Blue
Write-ColoredText "         Test Suite Runner" $Blue
Write-ColoredText "======================================" $Blue
Write-Host ""

# Check if npm is available
try {
    npm --version | Out-Null
}
catch {
    Write-ColoredText "Error: npm is not installed or not in PATH" $Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-ColoredText "Warning: node_modules not found. Running npm install..." $Yellow
    npm install
}

switch ($TestType.ToLower()) {
    "unit" {
        Write-ColoredText "Running Unit Tests Only" $Blue
        $result = Run-TestSuite "Unit Tests" "npm run test:unit"
        if (-not $result) { exit 1 }
    }
    "integration" {
        Write-ColoredText "Running Integration Tests Only" $Blue
        $result = Run-TestSuite "Integration Tests" "npm run test:integration"
        if (-not $result) { exit 1 }
    }
    "performance" {
        Write-ColoredText "Running Performance Tests Only" $Blue
        $result = Run-TestSuite "Performance Tests" "npm run test:performance"
        if (-not $result) { exit 1 }
    }
    "coverage" {
        Write-ColoredText "Running Tests with Coverage Report" $Blue
        $result = Run-TestSuite "Test Coverage" "npm run test:coverage"
        if (-not $result) { exit 1 }
    }
    default {
        Write-ColoredText "Running Full Test Suite" $Blue
        Write-Host ""
        
        $failedTests = 0
        
        # Unit Tests
        $result = Run-TestSuite "Unit Tests" "npm run test:unit"
        if (-not $result) { $failedTests++ }
        Write-Host ""
        
        # Integration Tests
        $result = Run-TestSuite "Integration Tests" "npm run test:integration"
        if (-not $result) { $failedTests++ }
        Write-Host ""
        
        # Performance Tests
        $result = Run-TestSuite "Performance Tests" "npm run test:performance"
        if (-not $result) { $failedTests++ }
        Write-Host ""
        
        # Summary
        Write-ColoredText "======================================" $Blue
        Write-ColoredText "            Test Summary" $Blue
        Write-ColoredText "======================================" $Blue
        
        if ($failedTests -eq 0) {
            Write-ColoredText "🎉 All test suites passed!" $Green
            Write-ColoredText "✓ Unit Tests" $Green
            Write-ColoredText "✓ Integration Tests" $Green
            Write-ColoredText "✓ Performance Tests" $Green
        }
        else {
            Write-ColoredText "❌ $failedTests test suite(s) failed" $Red
            Write-ColoredText "Please check the output above for details" $Yellow
            exit 1
        }
    }
}

Write-Host ""
Write-ColoredText "Test execution completed." $Blue

# Usage information
Write-Host ""
Write-ColoredText "Usage examples:" $Blue
Write-ColoredText "  .\scripts\run-tests.ps1           # Run all tests" $Blue
Write-ColoredText "  .\scripts\run-tests.ps1 unit      # Run unit tests only" $Blue
Write-ColoredText "  .\scripts\run-tests.ps1 integration # Run integration tests only" $Blue
Write-ColoredText "  .\scripts\run-tests.ps1 performance # Run performance tests only" $Blue
Write-ColoredText "  .\scripts\run-tests.ps1 coverage  # Run tests with coverage" $Blue
