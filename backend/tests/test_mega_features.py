"""
Comprehensive tests for StudySmart Mega Prompt features:
- Tasks: linked goals, tags, status history, overdue detection
- Focus Timer: presets, session tracking, XP
- Study Groups: multi-group, chat, group goals, contributions
"""
import pytest
import requests
import os
import time
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://study-wizard-14.preview.emergentagent.com')

# Test user credentials
TEST_EMAIL = f"megafeature_test_{int(time.time())}@test.com"
TEST_PASSWORD = "testpass123"
TEST_NAME = "Mega Feature Tester"


class TestSetup:
    """Setup test user and get auth token"""
    token = None
    user_id = None
    
    @classmethod
    def get_token(cls):
        if cls.token:
            return cls.token
        
        # Register new user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        
        if response.status_code == 201 or response.status_code == 200:
            data = response.json()
            cls.token = data.get("token")
            cls.user_id = data.get("user", {}).get("user_id")
            return cls.token
        elif response.status_code == 400:
            # User exists, try login
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                cls.token = data.get("token")
                cls.user_id = data.get("user", {}).get("user_id")
                return cls.token
        
        raise Exception(f"Failed to get auth token: {response.text}")


@pytest.fixture
def auth_headers():
    """Get authorization headers"""
    token = TestSetup.get_token()
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ============ TASKS TESTS ============

class TestTasksEnhanced:
    """Test enhanced task features: linked goals, tags, status history, overdue"""
    
    def test_create_task_with_tags(self, auth_headers):
        """Create task with tags"""
        response = requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json={
            "title": "TEST_Task with tags",
            "description": "Testing tags feature",
            "priority": "high",
            "tags": ["homework", "exam-prep", "urgent"]
        })
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["title"] == "TEST_Task with tags"
        assert "tags" in data
        assert "homework" in data["tags"]
        assert "exam-prep" in data["tags"]
        print(f"✓ Created task with tags: {data['task_id']}")
        return data["task_id"]
    
    def test_create_task_with_due_date(self, auth_headers):
        """Create task with due date for overdue detection"""
        # Create task with past due date
        past_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        response = requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json={
            "title": "TEST_Overdue task",
            "description": "This task should be overdue",
            "priority": "urgent",
            "due_date": past_date
        })
        assert response.status_code == 201
        data = response.json()
        assert data["due_date"] == past_date
        print(f"✓ Created task with due date: {data['task_id']}")
        return data["task_id"]
    
    def test_overdue_detection(self, auth_headers):
        """Test that overdue tasks are detected"""
        # Create overdue task
        past_date = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        create_resp = requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json={
            "title": "TEST_Definitely overdue",
            "priority": "high",
            "due_date": past_date
        })
        assert create_resp.status_code == 201
        
        # Get all tasks and check is_overdue
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
        assert response.status_code == 200
        tasks = response.json()
        
        overdue_tasks = [t for t in tasks if t.get("is_overdue") and "TEST_" in t.get("title", "")]
        assert len(overdue_tasks) > 0, "Expected at least one overdue task"
        print(f"✓ Overdue detection working: {len(overdue_tasks)} overdue tasks found")
    
    def test_today_tasks_filter(self, auth_headers):
        """Test today's tasks filter"""
        # Create task for today
        today = datetime.now().strftime("%Y-%m-%d")
        requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json={
            "title": "TEST_Today's task",
            "priority": "medium",
            "due_date": today
        })
        
        # Get today's tasks
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers, params={"today_only": True})
        assert response.status_code == 200
        tasks = response.json()
        print(f"✓ Today's tasks filter working: {len(tasks)} tasks for today")
    
    def test_status_change_history(self, auth_headers):
        """Test status change tracking"""
        # Create task
        create_resp = requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json={
            "title": "TEST_Status tracking task",
            "priority": "medium"
        })
        assert create_resp.status_code == 201
        task_id = create_resp.json()["task_id"]
        
        # Change status to in-progress
        update_resp = requests.put(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers, json={
            "status": "in-progress"
        })
        assert update_resp.status_code == 200
        
        # Change status to completed
        update_resp = requests.put(f"{BASE_URL}/api/tasks/{task_id}", headers=auth_headers, json={
            "status": "completed"
        })
        assert update_resp.status_code == 200
        data = update_resp.json()
        
        # Check status history
        assert "status_history" in data
        assert len(data["status_history"]) >= 2, "Expected at least 2 status history entries"
        print(f"✓ Status history tracking: {len(data['status_history'])} entries")
    
    def test_create_task_with_linked_goal(self, auth_headers):
        """Create task linked to a goal"""
        # First create a goal
        goal_resp = requests.post(f"{BASE_URL}/api/goals", headers=auth_headers, json={
            "title": "TEST_Goal for linking",
            "description": "Goal to link tasks to",
            "week_start": datetime.now().strftime("%Y-%m-%d")
        })
        assert goal_resp.status_code == 201
        goal_id = goal_resp.json()["goal_id"]
        
        # Create task linked to goal
        task_resp = requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json={
            "title": "TEST_Linked task",
            "description": "Task linked to goal",
            "priority": "high",
            "linked_goal_id": goal_id
        })
        assert task_resp.status_code == 201
        data = task_resp.json()
        assert data["linked_goal_id"] == goal_id
        print(f"✓ Created task linked to goal: {data['task_id']} -> {goal_id}")
    
    def test_get_tasks_by_goal(self, auth_headers):
        """Get tasks filtered by linked goal"""
        # Create goal
        goal_resp = requests.post(f"{BASE_URL}/api/goals", headers=auth_headers, json={
            "title": "TEST_Filter goal",
            "week_start": datetime.now().strftime("%Y-%m-%d")
        })
        goal_id = goal_resp.json()["goal_id"]
        
        # Create linked task
        requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json={
            "title": "TEST_Task for filter",
            "linked_goal_id": goal_id
        })
        
        # Filter by goal
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers, params={"linked_goal_id": goal_id})
        assert response.status_code == 200
        tasks = response.json()
        assert len(tasks) >= 1
        assert all(t.get("linked_goal_id") == goal_id for t in tasks)
        print(f"✓ Tasks filtered by goal: {len(tasks)} tasks")


# ============ FOCUS TIMER / POMODORO TESTS ============

class TestFocusTimer:
    """Test Focus Timer features: presets, sessions, XP tracking"""
    
    def test_start_pomodoro_session(self, auth_headers):
        """Start a pomodoro session"""
        response = requests.post(f"{BASE_URL}/api/pomodoro/start", headers=auth_headers, json={
            "focus_duration": 25,
            "break_duration": 5
        })
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "session_id" in data
        assert data["focus_duration"] == 25
        assert data["break_duration"] == 5
        assert data["completed"] == False
        print(f"✓ Started pomodoro session: {data['session_id']}")
        return data["session_id"]
    
    def test_start_session_with_task(self, auth_headers):
        """Start session linked to a task"""
        # Create task first
        task_resp = requests.post(f"{BASE_URL}/api/tasks", headers=auth_headers, json={
            "title": "TEST_Task for pomodoro",
            "priority": "high"
        })
        task_id = task_resp.json()["task_id"]
        
        # Start session with task
        response = requests.post(f"{BASE_URL}/api/pomodoro/start", headers=auth_headers, json={
            "focus_duration": 50,
            "break_duration": 10,
            "task_id": task_id
        })
        assert response.status_code == 201
        data = response.json()
        assert data["task_id"] == task_id
        print(f"✓ Started session linked to task: {data['session_id']}")
        return data["session_id"]
    
    def test_complete_pomodoro_session(self, auth_headers):
        """Complete a pomodoro session and earn XP"""
        # Start session
        start_resp = requests.post(f"{BASE_URL}/api/pomodoro/start", headers=auth_headers, json={
            "focus_duration": 25,
            "break_duration": 5
        })
        session_id = start_resp.json()["session_id"]
        
        # Complete session
        response = requests.post(f"{BASE_URL}/api/pomodoro/{session_id}/complete", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["completed"] == True
        assert data["completed_at"] is not None
        print(f"✓ Completed pomodoro session: {session_id}")
    
    def test_get_pomodoro_stats(self, auth_headers):
        """Get pomodoro statistics"""
        response = requests.get(f"{BASE_URL}/api/pomodoro/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "today_sessions" in data
        assert "week_sessions" in data
        assert "total_focus_time_minutes" in data
        assert "average_daily_sessions" in data
        print(f"✓ Pomodoro stats: {data['today_sessions']} today, {data['week_sessions']} this week")
    
    def test_get_recent_sessions(self, auth_headers):
        """Get recent pomodoro sessions"""
        response = requests.get(f"{BASE_URL}/api/pomodoro/sessions", headers=auth_headers, params={"days": 7})
        assert response.status_code == 200
        sessions = response.json()
        assert isinstance(sessions, list)
        print(f"✓ Retrieved {len(sessions)} recent sessions")
    
    def test_preset_durations(self, auth_headers):
        """Test different timer presets"""
        presets = [
            {"name": "Classic", "focus": 25, "break": 5},
            {"name": "Extended", "focus": 50, "break": 10},
            {"name": "Short Burst", "focus": 15, "break": 3},
            {"name": "Deep Work", "focus": 90, "break": 20},
        ]
        
        for preset in presets:
            response = requests.post(f"{BASE_URL}/api/pomodoro/start", headers=auth_headers, json={
                "focus_duration": preset["focus"],
                "break_duration": preset["break"]
            })
            assert response.status_code == 201, f"Failed for preset {preset['name']}"
            data = response.json()
            assert data["focus_duration"] == preset["focus"]
            assert data["break_duration"] == preset["break"]
            print(f"✓ Preset {preset['name']} ({preset['focus']}/{preset['break']}) works")


# ============ STUDY GROUPS TESTS ============

class TestStudyGroupsMulti:
    """Test multi-group system: create, join, leave, switch"""
    
    def test_create_group_v2(self, auth_headers):
        """Create a study group using v2 endpoint"""
        response = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_Group_{int(time.time())}",
            "description": "Test group for multi-group feature",
            "is_public": True
        })
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "group_id" in data
        assert data["member_count"] == 1
        print(f"✓ Created group: {data['group_id']}")
        return data["group_id"]
    
    def test_get_my_groups(self, auth_headers):
        """Get all groups user is member of"""
        response = requests.get(f"{BASE_URL}/api/groups/my/all", headers=auth_headers)
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        print(f"✓ User is in {len(groups)} groups")
        return groups
    
    def test_get_public_groups(self, auth_headers):
        """Get list of public groups"""
        response = requests.get(f"{BASE_URL}/api/groups", headers=auth_headers)
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        print(f"✓ Found {len(groups)} public groups")
    
    def test_get_group_details(self, auth_headers):
        """Get detailed group info"""
        # Create group first
        create_resp = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_Details_Group_{int(time.time())}",
            "description": "Group for details test"
        })
        group_id = create_resp.json()["group_id"]
        
        # Get details
        response = requests.get(f"{BASE_URL}/api/groups/{group_id}/details", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["group_id"] == group_id
        assert "members" in data
        assert "total_xp" in data
        assert "weekly_xp" in data
        print(f"✓ Group details retrieved: {data['name']}")
    
    def test_leave_group_v2(self, auth_headers):
        """Leave a group using v2 endpoint"""
        # Create group
        create_resp = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_Leave_Group_{int(time.time())}",
            "description": "Group to leave"
        })
        group_id = create_resp.json()["group_id"]
        
        # Leave group
        response = requests.post(f"{BASE_URL}/api/groups/{group_id}/leave/v2", headers=auth_headers)
        assert response.status_code == 200
        print(f"✓ Left group: {group_id}")
    
    def test_set_primary_group(self, auth_headers):
        """Set a group as primary"""
        # Create group
        create_resp = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_Primary_Group_{int(time.time())}",
            "description": "Primary group test"
        })
        group_id = create_resp.json()["group_id"]
        
        # Set as primary
        response = requests.post(f"{BASE_URL}/api/groups/{group_id}/set-primary", headers=auth_headers)
        assert response.status_code == 200
        print(f"✓ Set primary group: {group_id}")


# ============ GROUP CHAT TESTS ============

class TestGroupChat:
    """Test group chat functionality"""
    
    def test_send_message(self, auth_headers):
        """Send a message to group chat"""
        # Create group
        create_resp = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_Chat_Group_{int(time.time())}",
            "description": "Chat test group"
        })
        group_id = create_resp.json()["group_id"]
        
        # Send message
        response = requests.post(f"{BASE_URL}/api/groups/{group_id}/messages", headers=auth_headers, json={
            "content": "Hello, this is a test message!"
        })
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["content"] == "Hello, this is a test message!"
        assert data["message_type"] == "text"
        print(f"✓ Sent message: {data['message_id']}")
        return group_id
    
    def test_get_messages(self, auth_headers):
        """Get group chat messages"""
        # Create group and send message
        create_resp = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_Messages_Group_{int(time.time())}",
            "description": "Messages test"
        })
        group_id = create_resp.json()["group_id"]
        
        # Send a few messages
        for i in range(3):
            requests.post(f"{BASE_URL}/api/groups/{group_id}/messages", headers=auth_headers, json={
                "content": f"Test message {i+1}"
            })
        
        # Get messages
        response = requests.get(f"{BASE_URL}/api/groups/{group_id}/messages", headers=auth_headers)
        assert response.status_code == 200
        messages = response.json()
        assert isinstance(messages, list)
        # Should have system message + 3 test messages
        assert len(messages) >= 3
        print(f"✓ Retrieved {len(messages)} messages")


# ============ GROUP GOALS TESTS ============

class TestGroupGoals:
    """Test group goals and contributions"""
    
    def test_create_group_goal(self, auth_headers):
        """Create a shared group goal"""
        # Create group
        create_resp = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_Goals_Group_{int(time.time())}",
            "description": "Goals test group"
        })
        group_id = create_resp.json()["group_id"]
        
        # Create goal
        response = requests.post(f"{BASE_URL}/api/groups/{group_id}/goals", headers=auth_headers, json={
            "title": "Complete 100 Pomodoros",
            "description": "Team goal to complete 100 focus sessions",
            "target_count": 100,
            "target_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        })
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["title"] == "Complete 100 Pomodoros"
        assert data["target_count"] == 100
        assert data["current_count"] == 0
        print(f"✓ Created group goal: {data['goal_id']}")
        return group_id, data["goal_id"]
    
    def test_get_group_goals(self, auth_headers):
        """Get all goals for a group"""
        # Create group and goal
        create_resp = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_GetGoals_Group_{int(time.time())}",
            "description": "Get goals test"
        })
        group_id = create_resp.json()["group_id"]
        
        # Create goal
        requests.post(f"{BASE_URL}/api/groups/{group_id}/goals", headers=auth_headers, json={
            "title": "Test Goal",
            "target_count": 10
        })
        
        # Get goals
        response = requests.get(f"{BASE_URL}/api/groups/{group_id}/goals", headers=auth_headers)
        assert response.status_code == 200
        goals = response.json()
        assert isinstance(goals, list)
        assert len(goals) >= 1
        print(f"✓ Retrieved {len(goals)} group goals")
    
    def test_contribute_to_goal(self, auth_headers):
        """Contribute to a group goal"""
        # Create group and goal
        create_resp = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_Contribute_Group_{int(time.time())}",
            "description": "Contribution test"
        })
        group_id = create_resp.json()["group_id"]
        
        goal_resp = requests.post(f"{BASE_URL}/api/groups/{group_id}/goals", headers=auth_headers, json={
            "title": "Contribution Test Goal",
            "target_count": 10
        })
        goal_id = goal_resp.json()["goal_id"]
        
        # Contribute
        response = requests.post(f"{BASE_URL}/api/groups/{group_id}/goals/{goal_id}/contribute", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["new_count"] == 1
        assert "xp_earned" in data
        print(f"✓ Contributed to goal: count={data['new_count']}, XP={data['xp_earned']}")
    
    def test_goal_progress_tracking(self, auth_headers):
        """Test goal progress calculation"""
        # Create group and goal
        create_resp = requests.post(f"{BASE_URL}/api/groups/v2", headers=auth_headers, json={
            "name": f"TEST_Progress_Group_{int(time.time())}",
            "description": "Progress test"
        })
        group_id = create_resp.json()["group_id"]
        
        goal_resp = requests.post(f"{BASE_URL}/api/groups/{group_id}/goals", headers=auth_headers, json={
            "title": "Progress Test Goal",
            "target_count": 5
        })
        goal_id = goal_resp.json()["goal_id"]
        
        # Make 3 contributions
        for _ in range(3):
            requests.post(f"{BASE_URL}/api/groups/{group_id}/goals/{goal_id}/contribute", headers=auth_headers)
        
        # Check progress
        goals_resp = requests.get(f"{BASE_URL}/api/groups/{group_id}/goals", headers=auth_headers)
        goals = goals_resp.json()
        goal = next((g for g in goals if g["goal_id"] == goal_id), None)
        
        assert goal is not None
        assert goal["current_count"] == 3
        assert goal["progress"] == 60.0  # 3/5 = 60%
        print(f"✓ Goal progress: {goal['current_count']}/{goal['target_count']} = {goal['progress']}%")


# ============ LEADERBOARD TESTS ============

class TestLeaderboard:
    """Test leaderboard functionality"""
    
    def test_get_user_leaderboard(self, auth_headers):
        """Get user leaderboard"""
        response = requests.get(f"{BASE_URL}/api/leaderboard", headers=auth_headers, params={"period": "weekly"})
        assert response.status_code == 200
        data = response.json()
        assert "leaderboard" in data
        assert "period" in data
        print(f"✓ User leaderboard: {len(data['leaderboard'])} users")
    
    def test_get_group_leaderboard(self, auth_headers):
        """Get group leaderboard"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/groups", headers=auth_headers, params={"period": "weekly"})
        assert response.status_code == 200
        data = response.json()
        assert "leaderboard" in data
        print(f"✓ Group leaderboard: {len(data['leaderboard'])} groups")


# ============ CLEANUP ============

class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_tasks(self, auth_headers):
        """Delete test tasks"""
        response = requests.get(f"{BASE_URL}/api/tasks", headers=auth_headers)
        if response.status_code == 200:
            tasks = response.json()
            deleted = 0
            for task in tasks:
                if task.get("title", "").startswith("TEST_"):
                    del_resp = requests.delete(f"{BASE_URL}/api/tasks/{task['task_id']}", headers=auth_headers)
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test tasks")
    
    def test_cleanup_test_goals(self, auth_headers):
        """Delete test goals"""
        response = requests.get(f"{BASE_URL}/api/goals", headers=auth_headers)
        if response.status_code == 200:
            goals = response.json()
            deleted = 0
            for goal in goals:
                if goal.get("title", "").startswith("TEST_"):
                    del_resp = requests.delete(f"{BASE_URL}/api/goals/{goal['goal_id']}", headers=auth_headers)
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test goals")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
