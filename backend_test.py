import requests
import sys
import json
from datetime import datetime

class StudySmartAPITester:
    def __init__(self, base_url="https://study-dash-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

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
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test login with demo user
        login_data = {"email": "demo@studysmart.com", "password": "demo123"}
        response = self.run_test(
            "Login with demo user",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('user_id')
            return True
        
        # If demo user doesn't exist, try to register
        register_data = {
            "email": "demo@studysmart.com", 
            "password": "demo123",
            "name": "Demo User"
        }
        response = self.run_test(
            "Register demo user",
            "POST",
            "auth/register", 
            200,
            data=register_data
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user', {}).get('user_id')
            return True
            
        return False

    def test_user_profile(self):
        """Test user profile endpoints"""
        print("\n👤 Testing User Profile...")
        
        self.run_test("Get current user", "GET", "auth/me", 200)

    def test_tasks_crud(self):
        """Test tasks CRUD operations"""
        print("\n📝 Testing Tasks...")
        
        # Create task
        task_data = {
            "title": "Test Task for Focus Timer",
            "description": "Testing task creation",
            "priority": "medium",
            "subject": "Testing"
        }
        
        task_response = self.run_test(
            "Create task",
            "POST",
            "tasks",
            201,
            data=task_data
        )
        
        if not task_response:
            return None
            
        task_id = task_response.get('task_id')
        
        # Get all tasks
        self.run_test("Get all tasks", "GET", "tasks", 200)
        
        # Get specific task
        if task_id:
            self.run_test(f"Get task {task_id}", "GET", f"tasks/{task_id}", 200)
            
            # Update task to completed (this should award XP)
            update_data = {"status": "completed"}
            self.run_test(
                "Complete task (XP award)",
                "PUT", 
                f"tasks/{task_id}",
                200,
                data=update_data
            )
        
        return task_id

    def test_pomodoro_sessions(self):
        """Test pomodoro session functionality"""
        print("\n⏰ Testing Pomodoro Sessions...")
        
        # Start pomodoro session
        session_data = {
            "focus_duration": 25,
            "break_duration": 5,
            "task_id": None
        }
        
        session_response = self.run_test(
            "Start pomodoro session",
            "POST",
            "pomodoro/start",
            201,
            data=session_data
        )
        
        if session_response:
            session_id = session_response.get('session_id')
            
            if session_id:
                # Complete session (this should award XP)
                self.run_test(
                    "Complete pomodoro session (XP award)",
                    "POST",
                    f"pomodoro/{session_id}/complete",
                    200
                )
        
        # Get pomodoro stats
        self.run_test("Get pomodoro stats", "GET", "pomodoro/stats", 200)
        
        # Get sessions
        self.run_test("Get pomodoro sessions", "GET", "pomodoro/sessions", 200)

    def test_leaderboard(self):
        """Test leaderboard functionality (real API, not mock)"""
        print("\n🏆 Testing Leaderboard (Real API)...")
        
        # Test different time periods
        periods = ['weekly', 'monthly', 'alltime']
        
        for period in periods:
            response = self.run_test(
                f"Get {period} leaderboard",
                "GET",
                f"leaderboard?period={period}&limit=10",
                200
            )
            
            if response:
                # Verify it's real data, not mock
                leaderboard = response.get('leaderboard', [])
                if leaderboard:
                    # Check if we have real user data structure
                    first_user = leaderboard[0]
                    has_real_fields = all(field in first_user for field in ['user_id', 'name', 'xp', 'rank'])
                    self.log_test(
                        f"Leaderboard {period} has real data structure",
                        has_real_fields,
                        f"Fields present: {list(first_user.keys())}"
                    )
        
        # Test group leaderboard
        self.run_test("Get group leaderboard", "GET", "leaderboard/groups", 200)

    def test_study_groups(self):
        """Test study groups functionality"""
        print("\n👥 Testing Study Groups...")
        
        # Get current group (should be None initially)
        current_group = self.run_test("Get my current group", "GET", "groups/my/current", 200)
        
        # Get all public groups
        self.run_test("Get all public groups", "GET", "groups", 200)
        
        # Create a test group
        group_data = {
            "name": "Test Study Group",
            "description": "Testing group creation",
            "is_public": True
        }
        
        group_response = self.run_test(
            "Create study group",
            "POST",
            "groups",
            201,
            data=group_data
        )
        
        if group_response:
            group_id = group_response.get('group_id')
            
            if group_id:
                # Get group details
                group_details = self.run_test(
                    "Get group details",
                    "GET",
                    f"groups/{group_id}",
                    200
                )
                
                # Test group chat
                message_data = {"content": "Hello from test!"}
                self.run_test(
                    "Send group message",
                    "POST",
                    f"groups/{group_id}/messages",
                    200,
                    data=message_data
                )
                
                # Get messages
                self.run_test(
                    "Get group messages",
                    "GET",
                    f"groups/{group_id}/messages",
                    200
                )
                
                # Test shared goals
                goal_data = {
                    "title": "Complete 50 Pomodoros",
                    "description": "Group goal for testing",
                    "target_date": "2025-02-01"
                }
                
                goal_response = self.run_test(
                    "Create group goal",
                    "POST",
                    f"groups/{group_id}/goals",
                    200,
                    data=goal_data
                )
                
                # Get group goals
                self.run_test(
                    "Get group goals",
                    "GET",
                    f"groups/{group_id}/goals",
                    200
                )
                
                if goal_response:
                    goal_id = goal_response.get('goal_id')
                    if goal_id:
                        # Contribute to goal (should award XP)
                        self.run_test(
                            "Contribute to group goal (XP award)",
                            "POST",
                            f"groups/{group_id}/goals/{goal_id}/contribute",
                            200
                        )
                
                # Test leaving group
                self.run_test(
                    "Leave study group",
                    "POST",
                    f"groups/{group_id}/leave",
                    200
                )

    def test_xp_system(self):
        """Test XP system integration"""
        print("\n⚡ Testing XP System...")
        
        # Get user profile to check XP before and after actions
        before_profile = self.run_test("Get user XP before actions", "GET", "auth/me", 200)
        
        if before_profile:
            initial_xp = before_profile.get('total_xp', 0)
            print(f"    Initial XP: {initial_xp}")
            
            # Create and complete a task (should award XP)
            task_data = {
                "title": "XP Test Task",
                "description": "Testing XP award",
                "priority": "high"  # High priority should give more XP
            }
            
            task_response = self.run_test(
                "Create high priority task for XP test",
                "POST",
                "tasks",
                201,
                data=task_data
            )
            
            if task_response:
                task_id = task_response.get('task_id')
                if task_id:
                    # Complete the task
                    self.run_test(
                        "Complete high priority task",
                        "PUT",
                        f"tasks/{task_id}",
                        200,
                        data={"status": "completed"}
                    )
            
            # Check XP after task completion
            after_profile = self.run_test("Get user XP after task completion", "GET", "auth/me", 200)
            
            if after_profile:
                final_xp = after_profile.get('total_xp', 0)
                xp_gained = final_xp - initial_xp
                
                self.log_test(
                    "XP awarded for task completion",
                    xp_gained > 0,
                    f"XP gained: {xp_gained} (from {initial_xp} to {final_xp})"
                )

    def test_analytics(self):
        """Test analytics endpoints"""
        print("\n📊 Testing Analytics...")
        
        self.run_test("Get analytics overview", "GET", "analytics/overview", 200)
        self.run_test("Get daily stats", "GET", "analytics/daily-stats", 200)

    def test_ai_features(self):
        """Test AI integration"""
        print("\n🤖 Testing AI Features...")
        
        self.run_test("AI Study Coach", "POST", "ai/study-coach", 200)
        
        task_breakdown_data = {
            "task_title": "Study for Math Exam",
            "context": "Calculus and Linear Algebra"
        }
        self.run_test(
            "AI Task Breakdown",
            "POST",
            "ai/break-down-task",
            200,
            data=task_breakdown_data
        )
        
        self.run_test("AI Weekly Summary", "POST", "ai/weekly-summary", 200)
        self.run_test("AI Burnout Check", "POST", "ai/burnout-check", 200)

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting StudySmart API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Authentication is required for most tests
        if not self.test_authentication():
            print("❌ Authentication failed - cannot continue with other tests")
            return False
        
        # Run all test suites
        self.test_user_profile()
        self.test_tasks_crud()
        self.test_pomodoro_sessions()
        self.test_leaderboard()
        self.test_study_groups()
        self.test_xp_system()
        self.test_analytics()
        self.test_ai_features()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Save detailed results
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'tests_run': self.tests_run,
                    'tests_passed': self.tests_passed,
                    'success_rate': f"{(self.tests_passed/self.tests_run*100):.1f}%"
                },
                'results': self.test_results
            }, f, indent=2)
        
        return self.tests_passed == self.tests_run

def main():
    tester = StudySmartAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())