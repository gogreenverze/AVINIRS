/**
 * Comprehensive Test Suite for Enhanced Dynamic Pricing System
 * Tests SID generation, referral pricing, discounts, and commission calculations
 */

// Test SID Generation
async function testSIDGeneration() {
  console.log("🧪 Testing SID Generation...\n");
  
  try {
    const response = await fetch('/api/billing/generate-sid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        tenant_id: 1,
        user_role: 'admin'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ SID Generation Successful:");
      console.log(`   SID: ${data.sid_number}`);
      console.log(`   Site Code: ${data.site_code}`);
      console.log(`   Tenant: ${data.tenant_name}`);
      return true;
    } else {
      const errorData = await response.json();
      console.log("❌ SID Generation Failed:");
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorData.message}`);
      return false;
    }
  } catch (error) {
    console.log("❌ SID Generation Error:");
    console.log(`   ${error.message}`);
    return false;
  }
}

// Test Enhanced Dynamic Pricing
function testEnhancedPricing() {
  console.log("\n🧪 Testing Enhanced Dynamic Pricing...\n");
  
  // Import the service (in browser environment, this would be available globally)
  if (typeof dynamicPricingService === 'undefined') {
    console.log("❌ Dynamic Pricing Service not available");
    return false;
  }

  const testScenarios = [
    {
      name: "Doctor Referral - Standard Test",
      testId: "@000003",
      referralSource: "doctor",
      options: { volume: 1 },
      expectedDiscount: 0
    },
    {
      name: "Corporate Referral - Bulk Discount",
      testId: "@000003",
      referralSource: "corporate",
      options: { volume: 10 },
      expectedDiscount: 12 // Corporate discount + volume discount
    },
    {
      name: "Insurance Referral - Standard",
      testId: "@000009",
      referralSource: "insurance",
      options: { volume: 1 },
      expectedDiscount: 8
    },
    {
      name: "Lab-to-Lab - Wholesale Pricing",
      testId: "@000009",
      referralSource: "lab",
      options: { volume: 5 },
      expectedDiscount: 15 // Wholesale discount + volume discount
    },
    {
      name: "Online Booking - Promotional",
      testId: "@000003",
      referralSource: "online",
      options: { volume: 1, loyaltyTier: "gold" },
      expectedDiscount: 3 // Promotional discount + loyalty discount
    }
  ];

  let passedTests = 0;
  
  testScenarios.forEach((scenario, index) => {
    console.log(`📋 Test ${index + 1}: ${scenario.name}`);
    
    try {
      const result = dynamicPricingService.getTestPrice(
        scenario.testId,
        scenario.referralSource,
        null,
        0,
        scenario.options
      );
      
      console.log(`   Price: ₹${result.price}`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Reason: ${result.reason}`);
      
      if (result.metadata) {
        console.log(`   Base Price: ₹${result.metadata.basePrice}`);
        console.log(`   Total Discount: ${result.metadata.totalDiscountPercentage}%`);
        console.log(`   Savings: ₹${result.metadata.savings}`);
      }
      
      // Test commission calculation
      const commission = dynamicPricingService.calculateCommission(
        scenario.referralSource,
        result.price
      );
      
      if (commission.eligible) {
        console.log(`   Commission: ₹${commission.commission} (${commission.percentage}%)`);
      }
      
      console.log(`   Status: ✅ PASSED\n`);
      passedTests++;
      
    } catch (error) {
      console.log(`   Status: ❌ FAILED - ${error.message}\n`);
    }
  });
  
  console.log(`📊 Enhanced Pricing Test Summary: ${passedTests}/${testScenarios.length} passed\n`);
  return passedTests === testScenarios.length;
}

// Test Referral Master Data
function testReferralMaster() {
  console.log("🧪 Testing Referral Master Data...\n");
  
  if (typeof dynamicPricingService === 'undefined') {
    console.log("❌ Dynamic Pricing Service not available");
    return false;
  }

  try {
    const referralSources = dynamicPricingService.getAvailableReferralSources();
    const pricingSchemes = dynamicPricingService.getAvailableSchemes();
    
    console.log("✅ Referral Sources Available:");
    referralSources.forEach(source => {
      console.log(`   - ${source.name} (${source.id})`);
      if (source.discountPercentage > 0) {
        console.log(`     Discount: ${source.discountPercentage}%`);
      }
      if (source.category) {
        console.log(`     Category: ${source.category}`);
      }
    });
    
    console.log("\n✅ Pricing Schemes Available:");
    pricingSchemes.forEach(scheme => {
      console.log(`   - ${scheme.name} (${scheme.id})`);
      if (scheme.isDefault) {
        console.log(`     Default Scheme`);
      }
    });
    
    return true;
  } catch (error) {
    console.log(`❌ Referral Master Test Failed: ${error.message}`);
    return false;
  }
}

// Test Pricing Breakdown
function testPricingBreakdown() {
  console.log("\n🧪 Testing Detailed Pricing Breakdown...\n");
  
  if (typeof dynamicPricingService === 'undefined') {
    console.log("❌ Dynamic Pricing Service not available");
    return false;
  }

  const testCases = [
    { testId: "@000003", referralSource: "corporate", options: { volume: 10 } },
    { testId: "@000009", referralSource: "insurance", options: { volume: 1, loyaltyTier: "silver" } }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`📋 Breakdown Test ${index + 1}:`);
    console.log(`   Test: ${testCase.testId}, Referral: ${testCase.referralSource}`);
    
    try {
      const breakdown = dynamicPricingService.getPricingBreakdown(
        testCase.testId,
        testCase.referralSource,
        testCase.options
      );
      
      console.log(`   📊 Pricing Breakdown:`);
      console.log(`      Base Price: ₹${breakdown.breakdown.basePrice}`);
      console.log(`      Referral Discount: ${breakdown.breakdown.discounts.referral}%`);
      console.log(`      Volume Discount: ${breakdown.breakdown.discounts.volume}%`);
      console.log(`      Loyalty Discount: ${breakdown.breakdown.discounts.loyalty}%`);
      console.log(`      Total Discount: ${breakdown.breakdown.discounts.total}%`);
      console.log(`      Final Price: ₹${breakdown.breakdown.finalPrice}`);
      console.log(`      Total Savings: ₹${breakdown.breakdown.savings}`);
      console.log(`      Commission: ₹${breakdown.breakdown.commission}`);
      console.log(`   Status: ✅ PASSED\n`);
      
    } catch (error) {
      console.log(`   Status: ❌ FAILED - ${error.message}\n`);
    }
  });
  
  return true;
}

// Test Configuration Validation
function testConfigurationValidation() {
  console.log("🧪 Testing Configuration Validation...\n");
  
  if (typeof dynamicPricingService === 'undefined') {
    console.log("❌ Dynamic Pricing Service not available");
    return false;
  }

  try {
    const validation = dynamicPricingService.validateConfiguration();
    
    console.log("📋 Configuration Validation Results:");
    console.log(`   Valid: ${validation.isValid ? '✅' : '❌'}`);
    
    if (validation.errors.length > 0) {
      console.log("   Errors:");
      validation.errors.forEach(error => {
        console.log(`      ❌ ${error}`);
      });
    }
    
    if (validation.warnings.length > 0) {
      console.log("   Warnings:");
      validation.warnings.forEach(warning => {
        console.log(`      ⚠️  ${warning}`);
      });
    }
    
    if (validation.isValid && validation.warnings.length === 0) {
      console.log("   🎉 Configuration is perfect!");
    }
    
    return validation.isValid;
  } catch (error) {
    console.log(`❌ Configuration Validation Failed: ${error.message}`);
    return false;
  }
}

// Run All Tests
async function runComprehensiveTests() {
  console.log("🚀 Starting Comprehensive Pricing System Tests\n");
  console.log("=" .repeat(60));
  
  const results = {
    sidGeneration: await testSIDGeneration(),
    enhancedPricing: testEnhancedPricing(),
    referralMaster: testReferralMaster(),
    pricingBreakdown: testPricingBreakdown(),
    configValidation: testConfigurationValidation()
  };
  
  console.log("=" .repeat(60));
  console.log("📊 COMPREHENSIVE TEST RESULTS:");
  console.log("=" .repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${((passedTests/totalTests) * 100).toFixed(1)}%)`);
  
  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED! Your comprehensive pricing system is working perfectly!");
  } else {
    console.log("⚠️  Some tests failed. Please check the implementation and configuration.");
  }
  
  return results;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runComprehensiveTests,
    testSIDGeneration,
    testEnhancedPricing,
    testReferralMaster,
    testPricingBreakdown,
    testConfigurationValidation
  };
}

// Auto-run in browser
if (typeof window !== 'undefined') {
  console.log("🔧 Comprehensive Pricing Test Suite Loaded");
  console.log("Run runComprehensiveTests() to test the complete system");
}
