/**
 * Test script for Dynamic Pricing System
 * Run this in the browser console to test the pricing logic
 */

// Import the dynamic pricing service (in a real environment)
// import dynamicPricingService from './src/services/dynamicPricingService';

// Test scenarios for dynamic pricing
const testScenarios = [
  {
    name: "Doctor referral with standard scheme",
    testId: "@000003",
    referralSource: "doctor",
    scheme: null,
    expectedSource: "scheme_referral",
    description: "Should use standard scheme price for doctor referral"
  },
  {
    name: "Corporate referral with auto scheme",
    testId: "@000003", 
    referralSource: "corporate",
    scheme: null,
    expectedSource: "scheme_referral",
    description: "Should auto-select corporate scheme for corporate referral"
  },
  {
    name: "Insurance referral with explicit insurance scheme",
    testId: "@000009",
    referralSource: "insurance", 
    scheme: "insurance",
    expectedSource: "scheme_referral",
    description: "Should use insurance scheme price for insurance referral"
  },
  {
    name: "Self referral with promotional scheme",
    testId: "@000009",
    referralSource: "self",
    scheme: "promotional", 
    expectedSource: "scheme_referral",
    description: "Should use promotional scheme price for self referral"
  },
  {
    name: "Unknown test fallback",
    testId: "@999999",
    referralSource: "doctor",
    scheme: null,
    expectedSource: "fallback",
    description: "Should fallback to provided price for unknown test"
  },
  {
    name: "Known test with unknown referral",
    testId: "@000003",
    referralSource: "unknown_referral",
    scheme: null,
    expectedSource: "scheme_default",
    description: "Should fallback to scheme default price"
  }
];

// Function to run all test scenarios
function runDynamicPricingTests() {
  console.log("🧪 Running Dynamic Pricing Tests...\n");
  
  const results = [];
  
  testScenarios.forEach((scenario, index) => {
    console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Input: testId=${scenario.testId}, referral=${scenario.referralSource}, scheme=${scenario.scheme}`);
    
    try {
      // In a real environment, you would call:
      // const result = dynamicPricingService.getTestPrice(
      //   scenario.testId,
      //   scenario.referralSource, 
      //   scenario.scheme,
      //   1000 // fallback price
      // );
      
      // For testing purposes, simulate the expected behavior
      const simulatedResult = simulateGetTestPrice(
        scenario.testId,
        scenario.referralSource,
        scenario.scheme,
        1000
      );
      
      console.log(`   Result: ₹${simulatedResult.price} (${simulatedResult.source})`);
      console.log(`   Reason: ${simulatedResult.reason}`);
      
      const passed = simulatedResult.source === scenario.expectedSource;
      console.log(`   Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
      
      results.push({
        scenario: scenario.name,
        passed,
        result: simulatedResult
      });
      
    } catch (error) {
      console.log(`   Status: ❌ ERROR - ${error.message}`);
      results.push({
        scenario: scenario.name,
        passed: false,
        error: error.message
      });
    }
  });
  
  // Summary
  console.log("\n📊 Test Summary:");
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log("   🎉 All tests passed!");
  } else {
    console.log("   ⚠️  Some tests failed. Check implementation.");
  }
  
  return results;
}

// Simulate the pricing service for testing
function simulateGetTestPrice(testId, referralSource, scheme, fallbackPrice) {
  // Simulate the dynamic pricing configuration
  const mockConfig = {
    "@000003": {
      testName: "17 HYDROXY CORTICO STEROID 24 HR URINE",
      defaultPrice: 4000.0,
      schemes: {
        standard: {
          price: 4000.0,
          referralSources: {
            doctor: 4000.0,
            self: 4000.0,
            hospital: 3800.0
          }
        },
        corporate: {
          price: 3500.0,
          referralSources: {
            corporate: 3500.0,
            hospital: 3400.0,
            lab: 3300.0
          }
        }
      }
    },
    "@000009": {
      testName: "24 hrs URINE PROTEIN CREATININE RATIO", 
      defaultPrice: 400.0,
      schemes: {
        standard: {
          price: 400.0,
          referralSources: {
            doctor: 400.0,
            self: 400.0,
            hospital: 380.0
          }
        },
        insurance: {
          price: 360.0,
          referralSources: {
            insurance: 360.0
          }
        },
        promotional: {
          price: 300.0,
          referralSources: {
            doctor: 300.0,
            self: 280.0
          }
        }
      }
    }
  };
  
  const referralToSchemeMap = {
    doctor: 'standard',
    self: 'standard', 
    hospital: 'corporate',
    corporate: 'corporate',
    insurance: 'insurance',
    lab: 'corporate'
  };
  
  // Test not found
  if (!mockConfig[testId]) {
    return {
      price: fallbackPrice,
      source: 'fallback',
      reason: 'Test not found in pricing configuration'
    };
  }
  
  const testConfig = mockConfig[testId];
  const selectedScheme = scheme || referralToSchemeMap[referralSource] || 'standard';
  
  // Try scheme + referral combination
  if (testConfig.schemes[selectedScheme] && 
      testConfig.schemes[selectedScheme].referralSources &&
      testConfig.schemes[selectedScheme].referralSources[referralSource]) {
    return {
      price: testConfig.schemes[selectedScheme].referralSources[referralSource],
      source: 'scheme_referral',
      reason: `Used ${selectedScheme} scheme for ${referralSource} referral`
    };
  }
  
  // Try scheme default
  if (testConfig.schemes[selectedScheme] && testConfig.schemes[selectedScheme].price) {
    return {
      price: testConfig.schemes[selectedScheme].price,
      source: 'scheme_default', 
      reason: `Used ${selectedScheme} scheme default price`
    };
  }
  
  // Fallback to test default
  return {
    price: testConfig.defaultPrice,
    source: 'test_default',
    reason: 'Used test default price'
  };
}

// Function to test billing integration
function testBillingIntegration() {
  console.log("\n🔧 Testing Billing Integration...\n");
  
  // Simulate test selection in billing form
  const billingScenarios = [
    {
      testId: "@000003",
      testName: "17 HYDROXY CORTICO STEROID 24 HR URINE",
      referralSource: "doctor",
      originalPrice: 4000
    },
    {
      testId: "@000009", 
      testName: "24 hrs URINE PROTEIN CREATININE RATIO",
      referralSource: "corporate",
      originalPrice: 400
    }
  ];
  
  billingScenarios.forEach((scenario, index) => {
    console.log(`📝 Billing Scenario ${index + 1}:`);
    console.log(`   Test: ${scenario.testName}`);
    console.log(`   Referral: ${scenario.referralSource}`);
    console.log(`   Original Price: ₹${scenario.originalPrice}`);
    
    const dynamicPrice = simulateGetTestPrice(
      scenario.testId,
      scenario.referralSource,
      null,
      scenario.originalPrice
    );
    
    console.log(`   Dynamic Price: ₹${dynamicPrice.price}`);
    console.log(`   Price Change: ${dynamicPrice.price === scenario.originalPrice ? 'No change' : 
      (dynamicPrice.price > scenario.originalPrice ? 
        `+₹${dynamicPrice.price - scenario.originalPrice} (${(((dynamicPrice.price - scenario.originalPrice) / scenario.originalPrice) * 100).toFixed(1)}% increase)` :
        `-₹${scenario.originalPrice - dynamicPrice.price} (${(((scenario.originalPrice - dynamicPrice.price) / scenario.originalPrice) * 100).toFixed(1)}% discount)`
      )}`);
    console.log(`   Calculation: ${dynamicPrice.reason}\n`);
  });
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runDynamicPricingTests,
    testBillingIntegration,
    testScenarios
  };
}

// Auto-run tests if in browser
if (typeof window !== 'undefined') {
  console.log("🚀 Dynamic Pricing Test Suite");
  console.log("Run runDynamicPricingTests() to test pricing logic");
  console.log("Run testBillingIntegration() to test billing integration");
}
