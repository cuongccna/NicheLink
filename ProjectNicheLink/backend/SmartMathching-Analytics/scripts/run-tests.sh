#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   NicheLink Smart Matching Analytics${NC}"
echo -e "${BLUE}         Test Suite Runner${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Function to run tests with timing
run_test_suite() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}Running ${test_name}...${NC}"
    start_time=$(date +%s)
    
    if $test_command; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo -e "${GREEN}✓ ${test_name} completed successfully in ${duration}s${NC}"
        return 0
    else
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo -e "${RED}✗ ${test_name} failed after ${duration}s${NC}"
        return 1
    fi
}

# Parse command line arguments
TEST_TYPE=${1:-"all"}

case $TEST_TYPE in
    "unit")
        echo -e "${BLUE}Running Unit Tests Only${NC}"
        run_test_suite "Unit Tests" "npm run test:unit"
        ;;
    "integration")
        echo -e "${BLUE}Running Integration Tests Only${NC}"
        run_test_suite "Integration Tests" "npm run test:integration"
        ;;
    "performance")
        echo -e "${BLUE}Running Performance Tests Only${NC}"
        run_test_suite "Performance Tests" "npm run test:performance"
        ;;
    "coverage")
        echo -e "${BLUE}Running Tests with Coverage Report${NC}"
        run_test_suite "Test Coverage" "npm run test:coverage"
        ;;
    "all"|*)
        echo -e "${BLUE}Running Full Test Suite${NC}"
        echo ""
        
        # Run all test types
        failed_tests=0
        
        run_test_suite "Unit Tests" "npm run test:unit"
        if [ $? -ne 0 ]; then
            failed_tests=$((failed_tests + 1))
        fi
        echo ""
        
        run_test_suite "Integration Tests" "npm run test:integration"
        if [ $? -ne 0 ]; then
            failed_tests=$((failed_tests + 1))
        fi
        echo ""
        
        run_test_suite "Performance Tests" "npm run test:performance"
        if [ $? -ne 0 ]; then
            failed_tests=$((failed_tests + 1))
        fi
        echo ""
        
        # Summary
        echo -e "${BLUE}======================================${NC}"
        echo -e "${BLUE}            Test Summary${NC}"
        echo -e "${BLUE}======================================${NC}"
        
        if [ $failed_tests -eq 0 ]; then
            echo -e "${GREEN}🎉 All test suites passed!${NC}"
            echo -e "${GREEN}✓ Unit Tests${NC}"
            echo -e "${GREEN}✓ Integration Tests${NC}"
            echo -e "${GREEN}✓ Performance Tests${NC}"
        else
            echo -e "${RED}❌ ${failed_tests} test suite(s) failed${NC}"
            if [ $failed_tests -gt 0 ]; then
                echo -e "${YELLOW}Please check the output above for details${NC}"
            fi
        fi
        ;;
esac

echo ""
echo -e "${BLUE}Test execution completed.${NC}"
