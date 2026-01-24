"""
Backend tests for Goals API endpoints
Tests: CRUD operations, AI breakdown, subtasks, progress logging, streaks
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGoalsAPI:
    """Goals endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user and get auth token"""
        # Login with test credentials
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "goaltest@test.com", "password": "test123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        self.created_goal_ids = []
        yield
        # Cleanup: delete test goals
        for goal_id in self.created_goal_ids:
            try:
                requests.delete(f"{BASE_URL}/api/goals/{goal_id}", headers=self.headers)
            except:
                pass
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "goaltest@test.com", "password": "test123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "goaltest@test.com"
    
    def test_get_all_goals(self):
        """Test fetching all goals"""
        response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_goal(self):
        """Test creating a new goal"""
        goal_data = {
            "title": f"TEST_Goal_{uuid.uuid4().hex[:8]}",
            "description": "Test goal description",
            "target_tasks": [],
            "week_start": "2025-01-20",
            "streak": 0,
            "progress_logs": []
        }
        response = requests.post(
            f"{BASE_URL}/api/goals",
            json=goal_data,
            headers=self.headers
        )
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "goal_id" in data
        assert data["title"] == goal_data["title"]
        assert data["progress"] == 0.0
        assert data["completed"] == False
        self.created_goal_ids.append(data["goal_id"])
    
    def test_create_goal_and_verify_persistence(self):
        """Test creating a goal and verifying it persists"""
        goal_data = {
            "title": f"TEST_Persist_{uuid.uuid4().hex[:8]}",
            "description": "Testing persistence",
            "target_tasks": [],
            "week_start": "2025-01-20",
            "streak": 0,
            "progress_logs": []
        }
        # Create
        create_response = requests.post(
            f"{BASE_URL}/api/goals",
            json=goal_data,
            headers=self.headers
        )
        assert create_response.status_code == 201
        created_goal = create_response.json()
        goal_id = created_goal["goal_id"]
        self.created_goal_ids.append(goal_id)
        
        # Verify by fetching all goals
        get_response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers)
        assert get_response.status_code == 200
        goals = get_response.json()
        found = any(g["goal_id"] == goal_id for g in goals)
        assert found, "Created goal not found in goals list"
    
    def test_update_goal_subtasks(self):
        """Test updating goal with subtasks"""
        # Create goal first
        goal_data = {
            "title": f"TEST_Subtasks_{uuid.uuid4().hex[:8]}",
            "description": "Testing subtasks",
            "target_tasks": [],
            "week_start": "2025-01-20",
            "streak": 0,
            "progress_logs": []
        }
        create_response = requests.post(
            f"{BASE_URL}/api/goals",
            json=goal_data,
            headers=self.headers
        )
        assert create_response.status_code == 201
        goal_id = create_response.json()["goal_id"]
        self.created_goal_ids.append(goal_id)
        
        # Update with subtasks
        update_data = {
            "subtasks": [
                {"id": "sub1", "title": "Step 1", "completed": False},
                {"id": "sub2", "title": "Step 2", "completed": False}
            ],
            "progress": 0
        }
        update_response = requests.put(
            f"{BASE_URL}/api/goals/{goal_id}",
            json=update_data,
            headers=self.headers
        )
        assert update_response.status_code == 200
        updated_goal = update_response.json()
        assert len(updated_goal["subtasks"]) == 2
        assert updated_goal["subtasks"][0]["title"] == "Step 1"
    
    def test_toggle_subtask_completion(self):
        """Test toggling subtask completion updates progress"""
        # Create goal with subtasks
        goal_data = {
            "title": f"TEST_Toggle_{uuid.uuid4().hex[:8]}",
            "description": "Testing toggle",
            "target_tasks": [],
            "week_start": "2025-01-20",
            "streak": 0,
            "progress_logs": []
        }
        create_response = requests.post(
            f"{BASE_URL}/api/goals",
            json=goal_data,
            headers=self.headers
        )
        goal_id = create_response.json()["goal_id"]
        self.created_goal_ids.append(goal_id)
        
        # Add subtasks
        requests.put(
            f"{BASE_URL}/api/goals/{goal_id}",
            json={
                "subtasks": [
                    {"id": "sub1", "title": "Step 1", "completed": False},
                    {"id": "sub2", "title": "Step 2", "completed": False}
                ]
            },
            headers=self.headers
        )
        
        # Toggle one subtask complete
        update_response = requests.put(
            f"{BASE_URL}/api/goals/{goal_id}",
            json={
                "subtasks": [
                    {"id": "sub1", "title": "Step 1", "completed": True},
                    {"id": "sub2", "title": "Step 2", "completed": False}
                ],
                "progress": 50
            },
            headers=self.headers
        )
        assert update_response.status_code == 200
        updated_goal = update_response.json()
        assert updated_goal["progress"] == 50.0
        assert updated_goal["subtasks"][0]["completed"] == True
    
    def test_log_progress(self):
        """Test logging progress with minutes and note"""
        # Create goal
        goal_data = {
            "title": f"TEST_Progress_{uuid.uuid4().hex[:8]}",
            "description": "Testing progress logging",
            "target_tasks": [],
            "week_start": "2025-01-20",
            "streak": 0,
            "progress_logs": []
        }
        create_response = requests.post(
            f"{BASE_URL}/api/goals",
            json=goal_data,
            headers=self.headers
        )
        goal_id = create_response.json()["goal_id"]
        self.created_goal_ids.append(goal_id)
        
        # Log progress
        update_response = requests.put(
            f"{BASE_URL}/api/goals/{goal_id}",
            json={
                "progress_logs": [
                    {"date": "2025-01-24", "minutes": 45, "note": "Worked on exercises"}
                ],
                "streak": 1
            },
            headers=self.headers
        )
        assert update_response.status_code == 200
        updated_goal = update_response.json()
        assert len(updated_goal["progress_logs"]) == 1
        assert updated_goal["progress_logs"][0]["minutes"] == 45
        assert updated_goal["streak"] == 1
    
    def test_mark_goal_complete(self):
        """Test marking goal as complete"""
        # Create goal
        goal_data = {
            "title": f"TEST_Complete_{uuid.uuid4().hex[:8]}",
            "description": "Testing completion",
            "target_tasks": [],
            "week_start": "2025-01-20",
            "streak": 0,
            "progress_logs": []
        }
        create_response = requests.post(
            f"{BASE_URL}/api/goals",
            json=goal_data,
            headers=self.headers
        )
        goal_id = create_response.json()["goal_id"]
        self.created_goal_ids.append(goal_id)
        
        # Mark complete
        update_response = requests.put(
            f"{BASE_URL}/api/goals/{goal_id}",
            json={"completed": True, "progress": 100},
            headers=self.headers
        )
        assert update_response.status_code == 200
        updated_goal = update_response.json()
        assert updated_goal["completed"] == True
        assert updated_goal["progress"] == 100.0
    
    def test_reopen_goal(self):
        """Test reopening a completed goal"""
        # Create and complete goal
        goal_data = {
            "title": f"TEST_Reopen_{uuid.uuid4().hex[:8]}",
            "description": "Testing reopen",
            "target_tasks": [],
            "week_start": "2025-01-20",
            "streak": 0,
            "progress_logs": []
        }
        create_response = requests.post(
            f"{BASE_URL}/api/goals",
            json=goal_data,
            headers=self.headers
        )
        goal_id = create_response.json()["goal_id"]
        self.created_goal_ids.append(goal_id)
        
        # Mark complete
        requests.put(
            f"{BASE_URL}/api/goals/{goal_id}",
            json={"completed": True, "progress": 100},
            headers=self.headers
        )
        
        # Reopen
        update_response = requests.put(
            f"{BASE_URL}/api/goals/{goal_id}",
            json={"completed": False, "progress": 50},
            headers=self.headers
        )
        assert update_response.status_code == 200
        updated_goal = update_response.json()
        assert updated_goal["completed"] == False
        assert updated_goal["progress"] == 50.0
    
    def test_delete_goal(self):
        """Test deleting a goal"""
        # Create goal
        goal_data = {
            "title": f"TEST_Delete_{uuid.uuid4().hex[:8]}",
            "description": "Testing deletion",
            "target_tasks": [],
            "week_start": "2025-01-20",
            "streak": 0,
            "progress_logs": []
        }
        create_response = requests.post(
            f"{BASE_URL}/api/goals",
            json=goal_data,
            headers=self.headers
        )
        goal_id = create_response.json()["goal_id"]
        
        # Delete
        delete_response = requests.delete(
            f"{BASE_URL}/api/goals/{goal_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        assert delete_response.json()["message"] == "Goal deleted"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/goals", headers=self.headers)
        goals = get_response.json()
        found = any(g["goal_id"] == goal_id for g in goals)
        assert not found, "Deleted goal still exists"
    
    def test_ai_goal_breakdown(self):
        """Test AI goal breakdown endpoint"""
        # Create goal
        goal_data = {
            "title": f"TEST_AIBreakdown_{uuid.uuid4().hex[:8]}",
            "description": "Learn Python basics",
            "target_tasks": [],
            "week_start": "2025-01-20",
            "streak": 0,
            "progress_logs": []
        }
        create_response = requests.post(
            f"{BASE_URL}/api/goals",
            json=goal_data,
            headers=self.headers
        )
        goal_id = create_response.json()["goal_id"]
        self.created_goal_ids.append(goal_id)
        
        # Call AI breakdown
        breakdown_response = requests.post(
            f"{BASE_URL}/api/goals/{goal_id}/breakdown",
            json={
                "goal": "Learn Python basics",
                "description": "Complete introduction to Python programming",
                "completed": False,
                "subtasks": [],
                "progress": 0,
                "progressLogs": [],
                "streak": 0,
                "lastProgressDate": "2025-01-24"
            },
            headers=self.headers
        )
        assert breakdown_response.status_code == 200
        subtasks = breakdown_response.json()
        assert isinstance(subtasks, list)
        assert len(subtasks) >= 1
        # Each subtask should have a title
        for subtask in subtasks:
            assert "title" in subtask


class TestGoalsEdgeCases:
    """Edge case tests for Goals API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "goaltest@test.com", "password": "test123"}
        )
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        self.created_goal_ids = []
        yield
        for goal_id in self.created_goal_ids:
            try:
                requests.delete(f"{BASE_URL}/api/goals/{goal_id}", headers=self.headers)
            except:
                pass
    
    def test_update_nonexistent_goal(self):
        """Test updating a goal that doesn't exist"""
        response = requests.put(
            f"{BASE_URL}/api/goals/nonexistent_goal_id",
            json={"title": "Updated"},
            headers=self.headers
        )
        assert response.status_code == 404
    
    def test_delete_nonexistent_goal(self):
        """Test deleting a goal that doesn't exist"""
        response = requests.delete(
            f"{BASE_URL}/api/goals/nonexistent_goal_id",
            headers=self.headers
        )
        assert response.status_code == 404
    
    def test_unauthorized_access(self):
        """Test accessing goals without auth token"""
        response = requests.get(f"{BASE_URL}/api/goals")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
