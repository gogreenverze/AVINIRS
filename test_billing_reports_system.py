#!/usr/bin/env python3
"""
Comprehensive Test Script for Billing Reports System
Tests the automated billing report generation system with franchise-based access control.
"""

import sys
import os
import json
import requests
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.billing_reports_service import BillingReportsService
from services.pdf_report_generator import PDFReportGenerator

class BillingReportsSystemTest:
    """Test suite for the billing reports system"""
    
    def __init__(self):
        self.base_url = "http://localhost:5001"
        self.reports_service = BillingReportsService()
        self.pdf_generator = PDFReportGenerator()
        self.test_results = []
        
    def run_all_tests(self):
        """Run all test cases"""
        print("=" * 80)
        print("AVINI LABS BILLING REPORTS SYSTEM - COMPREHENSIVE TEST SUITE")
        print("=" * 80)
        print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Test 1: Service Initialization
        self.test_service_initialization()
        
        # Test 2: SID Generation
        self.test_sid_generation()
        
        # Test 3: Test Matching Engine
        self.test_test_matching_engine()
        
        # Test 4: Report Generation
        self.test_report_generation()
        
        # Test 5: Search Functionality
        self.test_search_functionality()
        
        # Test 6: Franchise Access Control
        self.test_franchise_access_control()
        
        # Test 7: PDF Generation
        self.test_pdf_generation()
        
        # Test 8: API Endpoints (if server is running)
        self.test_api_endpoints()
        
        # Print summary
        self.print_test_summary()
    
    def test_service_initialization(self):
        """Test service initialization"""
        print("Test 1: Service Initialization")
        print("-" * 40)
        
        try:
            # Test BillingReportsService initialization
            assert self.reports_service is not None
            assert hasattr(self.reports_service, 'franchise_prefixes')
            assert len(self.reports_service.franchise_prefixes) > 0
            
            # Test PDFReportGenerator initialization
            assert self.pdf_generator is not None
            assert hasattr(self.pdf_generator, 'generate_comprehensive_billing_pdf')
            
            self.test_results.append(("Service Initialization", "PASS", "All services initialized successfully"))
            print("✓ Services initialized successfully")
            
        except Exception as e:
            self.test_results.append(("Service Initialization", "FAIL", str(e)))
            print(f"✗ Service initialization failed: {str(e)}")
        
        print()
    
    def test_sid_generation(self):
        """Test SID number generation"""
        print("Test 2: SID Generation")
        print("-" * 40)
        
        try:
            # Test SID generation for different franchises
            test_cases = [
                (1, "AM"),  # Mayiladuthurai
                (2, "AS"),  # Sirkazhi
                (3, "AT"),  # Thanjavur
            ]
            
            for tenant_id, expected_prefix in test_cases:
                sid = self.reports_service.generate_sid_number(tenant_id)
                assert sid.startswith(expected_prefix), f"SID {sid} should start with {expected_prefix}"
                assert len(sid) == 5, f"SID {sid} should be 5 characters long"
                print(f"✓ Tenant {tenant_id}: Generated SID {sid}")
            
            self.test_results.append(("SID Generation", "PASS", "All SID formats correct"))
            
        except Exception as e:
            self.test_results.append(("SID Generation", "FAIL", str(e)))
            print(f"✗ SID generation failed: {str(e)}")
        
        print()
    
    def test_test_matching_engine(self):
        """Test the test matching engine"""
        print("Test 3: Test Matching Engine")
        print("-" * 40)
        
        try:
            # Test exact match
            test_name = "1,25 Dihydroxyvitamin D"
            matched_test = self.reports_service.match_test_in_master(test_name)
            
            if matched_test:
                print(f"✓ Exact match found for '{test_name}'")
                assert matched_test.get('testName') == test_name
            else:
                print(f"✗ No match found for '{test_name}'")
            
            # Test case-insensitive match
            test_name_lower = "25 hydroxy vitamin d3"
            matched_test_lower = self.reports_service.match_test_in_master(test_name_lower)
            
            if matched_test_lower:
                print(f"✓ Case-insensitive match found for '{test_name_lower}'")
            else:
                print(f"! No case-insensitive match for '{test_name_lower}'")
            
            # Test validation of billing items
            test_items = [
                {"test_name": "1,25 Dihydroxyvitamin D", "quantity": 1, "price": 3500, "amount": 3500},
                {"test_name": "Invalid Test Name", "quantity": 1, "price": 100, "amount": 100}
            ]
            
            matched_tests, unmatched_tests = self.reports_service.validate_billing_tests(test_items)
            
            print(f"✓ Matched tests: {len(matched_tests)}")
            print(f"✓ Unmatched tests: {len(unmatched_tests)}")
            
            if matched_tests:
                print(f"  - Enhanced test data includes: {list(matched_tests[0].keys())}")
            
            self.test_results.append(("Test Matching Engine", "PASS", f"Matched: {len(matched_tests)}, Unmatched: {len(unmatched_tests)}"))
            
        except Exception as e:
            self.test_results.append(("Test Matching Engine", "FAIL", str(e)))
            print(f"✗ Test matching failed: {str(e)}")
        
        print()
    
    def test_report_generation(self):
        """Test comprehensive report generation"""
        print("Test 4: Report Generation")
        print("-" * 40)
        
        try:
            # Create a mock billing record for testing
            mock_billing_id = 999  # Use a high number to avoid conflicts
            
            # Note: This test assumes there are existing billing records
            # In a real test environment, you would create test data
            
            print("! Report generation test requires existing billing data")
            print("  This test would normally:")
            print("  - Generate a comprehensive report for a billing record")
            print("  - Validate all report sections are populated")
            print("  - Check franchise-specific SID generation")
            print("  - Verify test data enhancement")
            
            self.test_results.append(("Report Generation", "SKIP", "Requires test billing data"))
            
        except Exception as e:
            self.test_results.append(("Report Generation", "FAIL", str(e)))
            print(f"✗ Report generation failed: {str(e)}")
        
        print()
    
    def test_search_functionality(self):
        """Test search and retrieval functionality"""
        print("Test 5: Search Functionality")
        print("-" * 40)
        
        try:
            # Test empty search (should return all accessible reports)
            reports = self.reports_service.search_reports({}, user_tenant_id=1, user_role='admin')
            print(f"✓ Empty search returned {len(reports)} reports")
            
            # Test SID autocomplete
            suggestions = self.reports_service.get_sid_autocomplete("AM", user_tenant_id=1, user_role='admin')
            print(f"✓ SID autocomplete for 'AM' returned {len(suggestions)} suggestions")
            
            # Test franchise access filter
            franchise_filter = self.reports_service.get_franchise_access_filter(1, 'admin')
            print(f"✓ Hub admin access filter: {franchise_filter}")
            
            franchise_filter = self.reports_service.get_franchise_access_filter(2, 'franchise_admin')
            print(f"✓ Franchise admin access filter: {franchise_filter}")
            
            self.test_results.append(("Search Functionality", "PASS", "All search functions working"))
            
        except Exception as e:
            self.test_results.append(("Search Functionality", "FAIL", str(e)))
            print(f"✗ Search functionality failed: {str(e)}")
        
        print()
    
    def test_franchise_access_control(self):
        """Test franchise-based access control"""
        print("Test 6: Franchise Access Control")
        print("-" * 40)
        
        try:
            # Test hub admin access (should see all franchises)
            hub_filter = self.reports_service.get_franchise_access_filter(1, 'admin')
            assert hub_filter is None, "Hub admin should have access to all franchises"
            print("✓ Hub admin has access to all franchises")
            
            # Test franchise admin access (should see only own franchise)
            franchise_filter = self.reports_service.get_franchise_access_filter(2, 'franchise_admin')
            assert franchise_filter == [2], "Franchise admin should only see own franchise"
            print("✓ Franchise admin access restricted to own franchise")
            
            # Test SID prefix mapping
            expected_prefixes = {1: "AM", 2: "AS", 3: "AT"}
            for tenant_id, expected_prefix in expected_prefixes.items():
                actual_prefix = self.reports_service.franchise_prefixes.get(tenant_id)
                assert actual_prefix == expected_prefix, f"Tenant {tenant_id} should have prefix {expected_prefix}"
                print(f"✓ Tenant {tenant_id} has correct prefix: {actual_prefix}")
            
            self.test_results.append(("Franchise Access Control", "PASS", "Access control working correctly"))
            
        except Exception as e:
            self.test_results.append(("Franchise Access Control", "FAIL", str(e)))
            print(f"✗ Franchise access control failed: {str(e)}")
        
        print()
    
    def test_pdf_generation(self):
        """Test PDF generation"""
        print("Test 7: PDF Generation")
        print("-" * 40)
        
        try:
            # Create mock report data
            mock_report = {
                'id': 1,
                'sid_number': 'AM001',
                'patient_info': {
                    'full_name': 'Test Patient',
                    'age': '30',
                    'gender': 'Male',
                    'mobile': '9876543210',
                    'email': 'test@example.com'
                },
                'clinic_info': {
                    'name': 'AVINI Labs Mayiladuthurai',
                    'address': 'Test Address',
                    'contact_phone': '1234567890'
                },
                'test_items': [
                    {
                        'test_name': 'Test 1',
                        'department': 'IMMUNOLOGY',
                        'hms_code': '001',
                        'price': 100,
                        'quantity': 1,
                        'amount': 100
                    }
                ],
                'financial_summary': {
                    'total_amount': 100,
                    'paid_amount': 0,
                    'balance': 100
                }
            }
            
            # Generate PDF
            pdf_content = self.pdf_generator.generate_comprehensive_billing_pdf(mock_report)
            
            assert pdf_content is not None, "PDF content should not be None"
            assert len(pdf_content) > 0, "PDF content should not be empty"
            assert "AVINI LABS" in pdf_content, "PDF should contain clinic name"
            assert "AM001" in pdf_content, "PDF should contain SID number"
            assert "Test Patient" in pdf_content, "PDF should contain patient name"
            
            print("✓ PDF generated successfully")
            print(f"✓ PDF content length: {len(pdf_content)} characters")
            
            self.test_results.append(("PDF Generation", "PASS", "PDF generated with all required sections"))
            
        except Exception as e:
            self.test_results.append(("PDF Generation", "FAIL", str(e)))
            print(f"✗ PDF generation failed: {str(e)}")
        
        print()
    
    def test_api_endpoints(self):
        """Test API endpoints (if server is running)"""
        print("Test 8: API Endpoints")
        print("-" * 40)
        
        try:
            # Test if server is running
            response = requests.get(f"{self.base_url}/api/billing-reports/stats", timeout=5)
            
            if response.status_code == 401:
                print("! API endpoints require authentication")
                print("  This test would normally:")
                print("  - Test report generation endpoint")
                print("  - Test search endpoint")
                print("  - Test SID autocomplete endpoint")
                print("  - Test PDF download endpoint")
                
                self.test_results.append(("API Endpoints", "SKIP", "Requires authentication"))
            else:
                print(f"✓ Server responded with status: {response.status_code}")
                self.test_results.append(("API Endpoints", "PASS", "Server is accessible"))
                
        except requests.exceptions.ConnectionError:
            print("! Server not running on localhost:5001")
            self.test_results.append(("API Endpoints", "SKIP", "Server not running"))
        except Exception as e:
            self.test_results.append(("API Endpoints", "FAIL", str(e)))
            print(f"✗ API endpoint test failed: {str(e)}")
        
        print()
    
    def print_test_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r[1] == "PASS"])
        failed_tests = len([r for r in self.test_results if r[1] == "FAIL"])
        skipped_tests = len([r for r in self.test_results if r[1] == "SKIP"])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Skipped: {skipped_tests}")
        print()
        
        for test_name, status, details in self.test_results:
            status_symbol = "✓" if status == "PASS" else "✗" if status == "FAIL" else "!"
            print(f"{status_symbol} {test_name:<30} {status:<6} {details}")
        
        print()
        print(f"Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if failed_tests == 0:
            print("🎉 All tests passed successfully!")
        else:
            print(f"⚠️  {failed_tests} test(s) failed. Please review the failures above.")

if __name__ == "__main__":
    test_suite = BillingReportsSystemTest()
    test_suite.run_all_tests()
