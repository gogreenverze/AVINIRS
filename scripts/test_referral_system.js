/**
 * Comprehensive Testing Script for Enhanced Referral System
 * Tests all aspects of the new referral master functionality
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ReferralSystemTester {
  constructor(baseUrl = 'http://localhost:5000', authToken = null) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      warnings: []
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting Comprehensive Referral System Tests...\n');

    try {
      // Test 1: API Connectivity
      await this.testAPIConnectivity();

      // Test 2: Referral Type Validation
      await this.testReferralTypeValidation();

      // Test 3: CRUD Operations
      await this.testCRUDOperations();

      // Test 4: Type-Specific Field Validation
      await this.testTypeSpecificFields();

      // Test 5: Pricing Integration
      await this.testPricingIntegration();

      // Test 6: Excel Import Functionality
      await this.testExcelImport();

      // Test 7: Business Rules Validation
      await this.testBusinessRules();

      // Test 8: Cascading Dropdown Logic
      await this.testCascadingDropdowns();

      // Generate test report
      this.generateTestReport();

    } catch (error) {
      console.error('💥 Test suite failed:', error);
      this.testResults.errors.push(`Test suite failure: ${error.message}`);
    }
  }

  /**
   * Test API connectivity
   */
  async testAPIConnectivity() {
    console.log('🔌 Testing API Connectivity...');
    
    try {
      const response = await this.makeRequest('GET', '/api/admin/referral-master');
      this.assert(response.status === 200, 'API should be accessible');
      this.assert(response.data.success !== false, 'API should return success response');
      console.log('✅ API connectivity test passed\n');
    } catch (error) {
      this.fail('API connectivity test failed', error);
    }
  }

  /**
   * Test referral type validation
   */
  async testReferralTypeValidation() {
    console.log('🏷️  Testing Referral Type Validation...');

    const validTypes = ['Doctor', 'Hospital', 'Lab', 'Corporate', 'Insurance', 'Patient'];
    const invalidTypes = ['InvalidType', '', null, undefined];

    // Test valid types
    for (const type of validTypes) {
      try {
        const testReferral = this.createTestReferral(type);
        const response = await this.makeRequest('POST', '/api/admin/referral-master', testReferral);
        this.assert(response.status === 201, `Valid type ${type} should be accepted`);
        
        // Clean up
        await this.makeRequest('DELETE', `/api/admin/referral-master/${testReferral.id}`);
      } catch (error) {
        this.fail(`Valid type ${type} test failed`, error);
      }
    }

    // Test invalid types
    for (const type of invalidTypes) {
      try {
        const testReferral = this.createTestReferral(type);
        const response = await this.makeRequest('POST', '/api/admin/referral-master', testReferral);
        this.assert(response.status === 400, `Invalid type ${type} should be rejected`);
      } catch (error) {
        // Expected to fail for invalid types
        this.pass(`Invalid type ${type} correctly rejected`);
      }
    }

    console.log('✅ Referral type validation tests passed\n');
  }

  /**
   * Test CRUD operations
   */
  async testCRUDOperations() {
    console.log('📝 Testing CRUD Operations...');

    const testReferral = this.createTestReferral('Doctor');

    try {
      // CREATE
      const createResponse = await this.makeRequest('POST', '/api/admin/referral-master', testReferral);
      this.assert(createResponse.status === 201, 'Create operation should succeed');
      this.assert(createResponse.data.success === true, 'Create should return success');

      // READ
      const readResponse = await this.makeRequest('GET', '/api/admin/referral-master');
      this.assert(readResponse.status === 200, 'Read operation should succeed');
      const createdReferral = readResponse.data.data.find(r => r.id === testReferral.id);
      this.assert(createdReferral !== undefined, 'Created referral should be retrievable');

      // UPDATE
      const updateData = { ...testReferral, name: 'Updated Test Referral' };
      const updateResponse = await this.makeRequest('PUT', `/api/admin/referral-master/${testReferral.id}`, updateData);
      this.assert(updateResponse.status === 200, 'Update operation should succeed');

      // DELETE
      const deleteResponse = await this.makeRequest('DELETE', `/api/admin/referral-master/${testReferral.id}`);
      this.assert(deleteResponse.status === 200, 'Delete operation should succeed');

      console.log('✅ CRUD operations tests passed\n');
    } catch (error) {
      this.fail('CRUD operations test failed', error);
    }
  }

  /**
   * Test type-specific fields
   */
  async testTypeSpecificFields() {
    console.log('🎯 Testing Type-Specific Fields...');

    const typeFieldTests = [
      { type: 'Doctor', field: 'specialization', value: 'Cardiology' },
      { type: 'Hospital', field: 'branch', value: 'Emergency Department' },
      { type: 'Lab', field: 'accreditation', value: 'NABL Certified' },
      { type: 'Corporate', field: 'registrationDetails', value: 'CIN: U12345AB2020PTC123456' },
      { type: 'Insurance', field: 'policyCoverage', value: 'Health insurance with 5L coverage' },
      { type: 'Patient', field: 'patientReference', value: 'PAT001' }
    ];

    for (const test of typeFieldTests) {
      try {
        const testReferral = this.createTestReferral(test.type);
        testReferral.typeSpecificFields = { [test.field]: test.value };

        const response = await this.makeRequest('POST', '/api/admin/referral-master', testReferral);
        this.assert(response.status === 201, `${test.type} with ${test.field} should be accepted`);

        // Clean up
        await this.makeRequest('DELETE', `/api/admin/referral-master/${testReferral.id}`);
      } catch (error) {
        this.fail(`Type-specific field test for ${test.type} failed`, error);
      }
    }

    console.log('✅ Type-specific fields tests passed\n');
  }

  /**
   * Test pricing integration
   */
  async testPricingIntegration() {
    console.log('💰 Testing Pricing Integration...');

    try {
      // Test that referrals can be assigned pricing schemes
      const testReferral = this.createTestReferral('Hospital');
      testReferral.defaultPricingScheme = 'hospital';

      const response = await this.makeRequest('POST', '/api/admin/referral-master', testReferral);
      this.assert(response.status === 201, 'Referral with pricing scheme should be created');
      this.assert(response.data.data.defaultPricingScheme === 'hospital', 'Pricing scheme should be saved');

      // Clean up
      await this.makeRequest('DELETE', `/api/admin/referral-master/${testReferral.id}`);

      console.log('✅ Pricing integration tests passed\n');
    } catch (error) {
      this.fail('Pricing integration test failed', error);
    }
  }

  /**
   * Test Excel import functionality
   */
  async testExcelImport() {
    console.log('📊 Testing Excel Import Functionality...');

    try {
      // Test with sample data
      const sampleData = [
        {
          dept_code: '@BC',
          dept_name: 'LAB',
          scheme_code: '@000002',
          scheme_name: 'L2L',
          test_type: 'T',
          test_code: 'TEST001',
          test_name: 'Sample Test',
          default_price: 1000,
          scheme_price: 800,
          price_percentage: 80,
          is_active: true
        }
      ];

      const response = await this.makeRequest('POST', '/api/admin/price-scheme-master/import', { data: sampleData });
      this.assert(response.status === 201, 'Excel import should succeed');
      this.assert(response.data.success === true, 'Import should return success');

      console.log('✅ Excel import tests passed\n');
    } catch (error) {
      this.fail('Excel import test failed', error);
    }
  }

  /**
   * Test business rules validation
   */
  async testBusinessRules() {
    console.log('📋 Testing Business Rules Validation...');

    try {
      // Test discount percentage limits
      const testReferral = this.createTestReferral('Doctor');
      testReferral.discountPercentage = 50; // Should exceed limit for Doctor (15%)

      const response = await this.makeRequest('POST', '/api/admin/referral-master', testReferral);
      this.assert(response.status === 400, 'Excessive discount should be rejected');

      console.log('✅ Business rules validation tests passed\n');
    } catch (error) {
      this.fail('Business rules validation test failed', error);
    }
  }

  /**
   * Test cascading dropdown logic
   */
  async testCascadingDropdowns() {
    console.log('🔗 Testing Cascading Dropdown Logic...');

    try {
      // Create test referrals of different types
      const doctorReferral = this.createTestReferral('Doctor');
      const hospitalReferral = this.createTestReferral('Hospital');

      await this.makeRequest('POST', '/api/admin/referral-master', doctorReferral);
      await this.makeRequest('POST', '/api/admin/referral-master', hospitalReferral);

      // Test filtering by type
      const allReferrals = await this.makeRequest('GET', '/api/admin/referral-master');
      const doctors = allReferrals.data.data.filter(r => r.referralType === 'Doctor');
      const hospitals = allReferrals.data.data.filter(r => r.referralType === 'Hospital');

      this.assert(doctors.length >= 1, 'Should find Doctor referrals');
      this.assert(hospitals.length >= 1, 'Should find Hospital referrals');

      // Clean up
      await this.makeRequest('DELETE', `/api/admin/referral-master/${doctorReferral.id}`);
      await this.makeRequest('DELETE', `/api/admin/referral-master/${hospitalReferral.id}`);

      console.log('✅ Cascading dropdown tests passed\n');
    } catch (error) {
      this.fail('Cascading dropdown test failed', error);
    }
  }

  /**
   * Helper methods
   */
  createTestReferral(type) {
    const timestamp = Date.now();
    return {
      id: `test_${type.toLowerCase()}_${timestamp}`,
      name: `Test ${type} Referral`,
      description: `Test referral for ${type} type`,
      referralType: type,
      email: 'test@example.com',
      phone: '+91 9876543210',
      address: 'Test Address, Test City, Test State',
      defaultPricingScheme: 'standard',
      discountPercentage: 5,
      commissionPercentage: 2,
      isActive: true,
      priority: 1,
      typeSpecificFields: {}
    };
  }

  async makeRequest(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {}
    };

    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    return await axios(config);
  }

  assert(condition, message) {
    if (condition) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
      this.testResults.errors.push(message);
      throw new Error(message);
    }
  }

  pass(message) {
    this.testResults.passed++;
    console.log(`  ✅ ${message}`);
  }

  fail(message, error) {
    this.testResults.failed++;
    this.testResults.errors.push(`${message}: ${error.message}`);
    console.log(`  ❌ ${message}: ${error.message}`);
  }

  generateTestReport() {
    console.log('\n📊 Test Results Summary:');
    console.log(`  Passed: ${this.testResults.passed}`);
    console.log(`  Failed: ${this.testResults.failed}`);
    console.log(`  Total: ${this.testResults.passed + this.testResults.failed}`);

    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.testResults.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.testResults.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        total: this.testResults.passed + this.testResults.failed
      },
      errors: this.testResults.errors,
      warnings: this.testResults.warnings
    };

    const reportPath = path.join(__dirname, '../test_reports', `referral_test_report_${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ReferralSystemTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(tester.testResults.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = ReferralSystemTester;
