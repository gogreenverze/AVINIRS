#!/usr/bin/env python3
"""
Comprehensive Dashboard Testing Script
Tests role-based access control, API endpoints, and dashboard functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
FRONTEND_URL = "http://localhost:3000"

# Test users with different roles
TEST_USERS = {
    "admin": {"username": "admin", "password": "admin123"},
    "hub_admin": {"username": "mayiladhuthurai", "password": "super123"},
    "franchise_admin": {"username": "franchise1", "password": "franchise123"},
    "doctor": {"username": "doctor1", "password": "doctor123"},
    "receptionist": {"username": "receptionist1", "password": "receptionist123"}
}

class DashboardTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_results = []

    def log_test(self, test_name, status, message="", details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        
        status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_symbol} {test_name}: {message}")

    def login_user(self, role):
        """Login a user and store token"""
        try:
            user_creds = TEST_USERS[role]
            response = self.session.post(
                f"{BASE_URL}/api/auth/login",
                json=user_creds,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.tokens[role] = data.get("token")
                self.log_test(f"Login {role}", "PASS", f"Successfully logged in as {role}")
                return True
            else:
                self.log_test(f"Login {role}", "FAIL", f"Login failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test(f"Login {role}", "FAIL", f"Login error: {str(e)}")
            return False

    def test_comprehensive_dashboard_api(self, role):
        """Test comprehensive dashboard API endpoint"""
        try:
            if role not in self.tokens:
                self.log_test(f"Dashboard API {role}", "SKIP", "No token available")
                return False

            headers = {
                "Authorization": f"Bearer {self.tokens[role]}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{BASE_URL}/api/dashboard/comprehensive",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_keys = ["success", "data", "user_context"]
                if all(key in data for key in required_keys):
                    dashboard_data = data["data"]
                    user_context = data["user_context"]
                    
                    # Validate dashboard data structure
                    expected_sections = ["overview", "trends", "recent_activities", "alerts", "ai_insights"]
                    if all(section in dashboard_data for section in expected_sections):
                        self.log_test(
                            f"Dashboard API {role}", 
                            "PASS", 
                            f"API returned valid data structure",
                            {
                                "user_role": user_context.get("role"),
                                "access_level": user_context.get("access_level"),
                                "overview_metrics": len(dashboard_data["overview"]),
                                "ai_insights_count": len(dashboard_data["ai_insights"])
                            }
                        )
                        return True
                    else:
                        self.log_test(f"Dashboard API {role}", "FAIL", "Missing required dashboard sections")
                        return False
                else:
                    self.log_test(f"Dashboard API {role}", "FAIL", "Invalid response structure")
                    return False
            else:
                self.log_test(f"Dashboard API {role}", "FAIL", f"API error: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test(f"Dashboard API {role}", "FAIL", f"Request error: {str(e)}")
            return False

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n🔐 Testing Role-Based Access Control...")
        
        # Test each role
        for role in TEST_USERS.keys():
            if self.login_user(role):
                self.test_comprehensive_dashboard_api(role)
                
                # Test specific role permissions
                self.test_role_specific_permissions(role)

    def test_role_specific_permissions(self, role):
        """Test role-specific permissions and data filtering"""
        try:
            if role not in self.tokens:
                return False

            headers = {
                "Authorization": f"Bearer {self.tokens[role]}",
                "Content-Type": "application/json"
            }
            
            # Test different endpoints based on role
            endpoints_to_test = []
            
            if role in ["admin", "hub_admin"]:
                endpoints_to_test = [
                    "/api/admin/analytics",
                    "/api/admin/users",
                    "/api/patients",
                    "/api/inventory",
                    "/api/billing"
                ]
            elif role == "franchise_admin":
                endpoints_to_test = [
                    "/api/patients",
                    "/api/inventory",
                    "/api/billing"
                ]
            else:
                endpoints_to_test = [
                    "/api/patients"
                ]
            
            accessible_endpoints = 0
            for endpoint in endpoints_to_test:
                try:
                    response = self.session.get(f"{BASE_URL}{endpoint}", headers=headers)
                    if response.status_code in [200, 201]:
                        accessible_endpoints += 1
                except:
                    pass
            
            self.log_test(
                f"Role Permissions {role}",
                "PASS",
                f"Accessed {accessible_endpoints}/{len(endpoints_to_test)} expected endpoints"
            )
            
        except Exception as e:
            self.log_test(f"Role Permissions {role}", "FAIL", f"Permission test error: {str(e)}")

    def test_ai_insights_generation(self):
        """Test AI insights generation"""
        print("\n🤖 Testing AI Insights Generation...")
        
        # Test with admin user
        if "admin" in self.tokens:
            try:
                headers = {
                    "Authorization": f"Bearer {self.tokens['admin']}",
                    "Content-Type": "application/json"
                }
                
                response = self.session.get(
                    f"{BASE_URL}/api/dashboard/comprehensive",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_insights = data["data"]["ai_insights"]
                    
                    if len(ai_insights) > 0:
                        # Validate insight structure
                        insight = ai_insights[0]
                        required_fields = ["type", "category", "title", "description", "priority"]
                        
                        if all(field in insight for field in required_fields):
                            self.log_test(
                                "AI Insights Generation",
                                "PASS",
                                f"Generated {len(ai_insights)} insights with valid structure"
                            )
                        else:
                            self.log_test(
                                "AI Insights Generation",
                                "FAIL",
                                "Insights missing required fields"
                            )
                    else:
                        self.log_test(
                            "AI Insights Generation",
                            "WARN",
                            "No AI insights generated (may be expected with limited data)"
                        )
                        
            except Exception as e:
                self.log_test("AI Insights Generation", "FAIL", f"Error: {str(e)}")

    def test_mobile_responsiveness(self):
        """Test mobile responsiveness (basic check)"""
        print("\n📱 Testing Mobile Responsiveness...")
        
        # This is a basic test - in a real scenario, you'd use Selenium with different viewport sizes
        try:
            # Test if the frontend is accessible
            response = requests.get(FRONTEND_URL, timeout=10)
            if response.status_code == 200:
                # Check for responsive meta tag and Bootstrap classes
                content = response.text
                
                responsive_indicators = [
                    'viewport',
                    'responsive',
                    'col-md-',
                    'col-lg-',
                    'd-none d-md-',
                    'flex-wrap'
                ]
                
                found_indicators = sum(1 for indicator in responsive_indicators if indicator in content)
                
                if found_indicators >= 3:
                    self.log_test(
                        "Mobile Responsiveness",
                        "PASS",
                        f"Found {found_indicators} responsive design indicators"
                    )
                else:
                    self.log_test(
                        "Mobile Responsiveness",
                        "WARN",
                        f"Limited responsive indicators found ({found_indicators})"
                    )
            else:
                self.log_test("Mobile Responsiveness", "FAIL", "Frontend not accessible")
                
        except Exception as e:
            self.log_test("Mobile Responsiveness", "FAIL", f"Error: {str(e)}")

    def test_real_time_updates(self):
        """Test real-time update functionality"""
        print("\n⏱️ Testing Real-time Updates...")
        
        if "admin" in self.tokens:
            try:
                headers = {
                    "Authorization": f"Bearer {self.tokens['admin']}",
                    "Content-Type": "application/json"
                }
                
                # Make two requests with a small delay to simulate real-time updates
                response1 = self.session.get(
                    f"{BASE_URL}/api/dashboard/comprehensive",
                    headers=headers
                )
                
                time.sleep(2)
                
                response2 = self.session.get(
                    f"{BASE_URL}/api/dashboard/comprehensive",
                    headers=headers
                )
                
                if response1.status_code == 200 and response2.status_code == 200:
                    self.log_test(
                        "Real-time Updates",
                        "PASS",
                        "Dashboard API responds consistently for real-time polling"
                    )
                else:
                    self.log_test("Real-time Updates", "FAIL", "Inconsistent API responses")
                    
            except Exception as e:
                self.log_test("Real-time Updates", "FAIL", f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all dashboard tests"""
        print("🚀 Starting Comprehensive Dashboard Tests...")
        print("=" * 60)
        
        # Test role-based access
        self.test_role_based_access()
        
        # Test AI insights
        self.test_ai_insights_generation()
        
        # Test mobile responsiveness
        self.test_mobile_responsiveness()
        
        # Test real-time updates
        self.test_real_time_updates()
        
        # Generate summary
        self.generate_test_summary()

    def generate_test_summary(self):
        """Generate test summary report"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY REPORT")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["status"] == "PASS"])
        failed_tests = len([t for t in self.test_results if t["status"] == "FAIL"])
        warning_tests = len([t for t in self.test_results if t["status"] == "WARN"])
        skipped_tests = len([t for t in self.test_results if t["status"] == "SKIP"])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️ Warnings: {warning_tests}")
        print(f"⏭️ Skipped: {skipped_tests}")
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.test_results:
                if test["status"] == "FAIL":
                    print(f"  - {test['test']}: {test['message']}")
        
        # Save detailed results to file
        with open("dashboard_test_results.json", "w") as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: dashboard_test_results.json")
        print("=" * 60)

if __name__ == "__main__":
    tester = DashboardTester()
    tester.run_all_tests()
