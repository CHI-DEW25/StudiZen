#!/usr/bin/env python3

import requests
import sys
import json
import uuid
from datetime import datetime, timedelta
import time

class StudySmartAPITester:
    def __init__(self, base_url="https://studysmart-113.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.session = requests.Session()
        
        # Test data
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "TestPass123!"
        self.test_name = "Test User"

    def log_test(self, name, success, details="", endpoint=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "endpoint": endpoint
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details, endpoint)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}", endpoint)
            return None

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_auth_registration(self):
        """Test user registration"""
        print("\n🔍 Testing Authentication - Registration...")
        response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            {
                "email": self.test_email,
                "password": self.test_password,
                "name": self.test_name
            }
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            return True
        return False

    def test_auth_login(self):
        """Test user login"""
        print("\n🔍 Testing Authentication - Login...")
        response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            {
                "email": self.test_email,
                "password": self.test_password
            }
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        print("\n🔍 Testing Authentication - Get Me...")
        response = self.run_test("Get Current User", "GET", "auth/me", 200)
        return response is not None

    def test_tasks_crud(self):
        """Test task CRUD operations"""
        print("\n🔍 Testing Tasks CRUD...")
        
        # Create task
        task_data = {
            "title": "Test Task",
            "description": "This is a test task",
            "subject": "Computer Science",
            "priority": "high",
            "due_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "estimated_time": 60
        }
        
        create_response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            201,
            task_data
        )
        
        if not create_response:
            return False
            
        task_id = create_response.get('task_id')
        
        # Get all tasks
        self.run_test("Get All Tasks", "GET", "tasks", 200)
        
        # Get specific task
        self.run_test("Get Task by ID", "GET", f"tasks/{task_id}", 200)
        
        # Update task
        update_response = self.run_test(
            "Update Task",
            "PUT",
            f"tasks/{task_id}",
            200,
            {"status": "completed"}
        )
        
        # Delete task
        self.run_test("Delete Task", "DELETE", f"tasks/{task_id}", 200)
        
        return True

    def test_pomodoro_functionality(self):
        """Test Pomodoro timer functionality"""
        print("\n🔍 Testing Pomodoro Functionality...")
        
        # Start pomodoro session
        session_data = {
            "focus_duration": 25,
            "break_duration": 5
        }
        
        start_response = self.run_test(
            "Start Pomodoro Session",
            "POST",
            "pomodoro/start",
            201,
            session_data
        )
        
        if not start_response:
            return False
            
        session_id = start_response.get('session_id')
        
        # Complete pomodoro session
        self.run_test(
            "Complete Pomodoro Session",
            "POST",
            f"pomodoro/{session_id}/complete",
            200
        )
        
        # Get pomodoro sessions
        self.run_test("Get Pomodoro Sessions", "GET", "pomodoro/sessions", 200)
        
        # Get pomodoro stats
        self.run_test("Get Pomodoro Stats", "GET", "pomodoro/stats", 200)
        
        return True

    def test_goals_functionality(self):
        """Test Goals functionality"""
        print("\n🔍 Testing Goals Functionality...")
        
        # Create goal
        goal_data = {
            "title": "Weekly Study Goal",
            "description": "Complete 5 tasks this week",
            "week_start": datetime.now().strftime("%Y-%m-%d")
        }
        
        create_response = self.run_test(
            "Create Goal",
            "POST",
            "goals",
            201,
            goal_data
        )
        
        if not create_response:
            return False
            
        goal_id = create_response.get('goal_id')
        
        # Get all goals
        self.run_test("Get All Goals", "GET", "goals", 200)
        
        # Update goal
        self.run_test(
            "Update Goal",
            "PUT",
            f"goals/{goal_id}",
            200,
            {"completed": True}
        )
        
        # Delete goal
        self.run_test("Delete Goal", "DELETE", f"goals/{goal_id}", 200)
        
        return True

    def test_analytics_endpoints(self):
        """Test Analytics endpoints"""
        print("\n🔍 Testing Analytics Endpoints...")
        
        self.run_test("Get Analytics Overview", "GET", "analytics/overview", 200)
        self.run_test("Get Daily Stats", "GET", "analytics/daily-stats", 200)
        
        return True

    def test_ai_endpoints(self):
        """Test AI endpoints"""
        print("\n🔍 Testing AI Endpoints...")
        
        # Test AI Study Coach
        coach_response = self.run_test("AI Study Coach", "POST", "ai/study-coach", 200)
        
        # Test AI Task Breakdown
        breakdown_data = {
            "task_title": "Study for Final Exam",
            "context": "Computer Science final exam covering algorithms and data structures"
        }
        self.run_test(
            "AI Task Breakdown",
            "POST",
            "ai/break-down-task",
            200,
            breakdown_data
        )
        
        # Test AI Weekly Summary
        self.run_test("AI Weekly Summary", "POST", "ai/weekly-summary", 200)
        
        # Test AI Burnout Check
        self.run_test("AI Burnout Check", "POST", "ai/burnout-check", 200)
        
        return True

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting StudySmart API Tests...")
        print(f"Base URL: {self.base_url}")
        
        # Test health endpoints first
        self.test_health_endpoints()
        
        # Test authentication
        if not self.test_auth_registration():
            print("❌ Registration failed, stopping tests")
            return False
            
        self.test_auth_me()
        
        # Test core functionality
        self.test_tasks_crud()
        self.test_pomodoro_functionality()
        self.test_goals_functionality()
        self.test_analytics_endpoints()
        
        # Test AI endpoints (may take longer)
        print("\n⏳ Testing AI endpoints (this may take a few seconds)...")
        self.test_ai_endpoints()
        
        # Print summary
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return False

    def get_failed_tests(self):
        """Get list of failed tests"""
        return [test for test in self.test_results if not test['success']]

def main():
    tester = StudySmartAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "success_rate": round((tester.tests_passed / tester.tests_run) * 100, 1) if tester.tests_run > 0 else 0,
        "failed_tests": tester.get_failed_tests(),
        "all_results": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())