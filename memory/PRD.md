# StudySmart - Product Requirements Document

## Overview
StudySmart is a comprehensive productivity web app designed for students, featuring AI-powered study tools, task management, focus timers, goal tracking, and social study groups.

## Tech Stack
- **Frontend:** React 18, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT + Google OAuth2 (Emergent-managed)
- **AI:** OpenAI GPT-4o via Emergent LLM Key

## Core Features

### 1. Task Management ✅
- CRUD operations for tasks
- Priority levels (low, medium, high, urgent)
- Due dates with overdue detection
- Estimated time tracking
- Link tasks to goals
- Tags support
- Status workflow (pending → in-progress → completed)
- "Today's Tasks" smart filter
- Status history tracking
- XP rewards on completion

### 2. Focus Timer (Pomodoro) ✅
- Customizable timer (5-90 min focus, 1-30 min break)
- Preset modes: Classic (25/5), Extended (50/10), Short Burst (15/3), Deep Work (90/20)
- Session tracking with streak counter
- Link sessions to tasks
- Sound notifications
- Daily progress tracking (sessions/goal)
- Weekly statistics
- Recent sessions history
- XP rewards on session completion

### 3. Goals System ✅
- Weekly goals with categories
- Milestones and timeline
- Progress tracking via linked tasks
- AI-powered goal breakdown
- Subtasks with checkboxes
- Progress logs
- XP/badges rewards
- Streak tracking

### 4. Study Groups ✅ (NEW)
**Multi-Group Support:**
- Join up to 5 groups simultaneously
- Create public/private groups
- Switch between groups in sidebar
- Set primary group for XP bonuses
- Leave groups (ownership transfer)

**Group Chat:**
- Real-time messaging with polling
- System messages for events
- Achievement announcements
- User avatars and timestamps

**Shared Goals:**
- Create collaborative goals
- Contribute progress (+1)
- Track contributors
- XP rewards for contributions
- Completion celebration messages

**Leaderboard:**
- Group rankings by XP
- Weekly XP tracking
- Member stats (streak, XP)

### 5. Smart Daily Planner ✅
- AI-powered schedule generation
- Energy level inputs (morning, afternoon, evening)
- Multiple calendar views (Daily, Weekly, Monthly, Yearly)
- Time block management
- Read-only Google Calendar integration
- Overload detection

### 6. Dashboard ✅
- Overview of tasks, goals, sessions
- Progress charts (Recharts)
- Weekly activity visualization
- Quick stats display

### 7. Analytics/Insights ✅
- Task completion trends
- Focus time analysis
- Daily statistics
- Productivity metrics

## Authentication ✅
- Email/password registration and login
- Google OAuth2 social login
- JWT token-based sessions
- Protected routes

## API Endpoints

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/google/login`
- GET `/api/auth/google/callback`
- GET `/api/auth/me`

### Tasks
- GET/POST `/api/tasks`
- GET/PUT/DELETE `/api/tasks/{id}`
- GET `/api/tasks?today_only=true`
- GET `/api/tasks?linked_goal_id={id}`

### Pomodoro
- GET/POST `/api/pomodoro`
- POST `/api/pomodoro/{id}/complete`
- GET `/api/pomodoro/stats`

### Goals
- GET/POST `/api/goals`
- GET/PUT/DELETE `/api/goals/{id}`
- POST `/api/goals/{id}/breakdown`
- GET `/api/goals/weekly-review`

### Study Groups (Multi-Group)
- GET `/api/groups/my/all` - Get all user's groups
- POST `/api/groups/v2` - Create group
- POST `/api/groups/{id}/join/v2` - Join group
- POST `/api/groups/{id}/leave/v2` - Leave group
- GET `/api/groups/{id}/details` - Group details with members
- POST `/api/groups/{id}/set-primary` - Set primary group

### Group Chat
- GET `/api/groups/{id}/messages` - Get messages
- POST `/api/groups/{id}/messages` - Send message

### Group Goals
- GET `/api/groups/{id}/goals` - Get shared goals
- POST `/api/groups/{id}/goals` - Create goal
- POST `/api/groups/{id}/goals/{goalId}/contribute` - Contribute

### Planner
- POST `/api/planner/generate`
- GET/POST `/api/planner/schedule`

### Analytics
- GET `/api/analytics/overview`
- GET `/api/analytics/daily-stats`

### Leaderboard
- GET `/api/leaderboard` - Groups leaderboard

## Database Schema

### users
```json
{
  "user_id": "string",
  "email": "string",
  "name": "string",
  "password_hash": "string (optional)",
  "google_id": "string (optional)",
  "picture": "string (optional)",
  "xp": "number",
  "total_xp": "number",
  "weekly_xp": "number",
  "current_streak": "number",
  "longest_streak": "number",
  "study_group_id": "string (primary group)"
}
```

### tasks
```json
{
  "task_id": "string",
  "user_id": "string",
  "title": "string",
  "description": "string",
  "subject": "string",
  "priority": "low|medium|high|urgent",
  "status": "pending|in-progress|completed",
  "due_date": "string (ISO)",
  "estimated_time": "number (minutes)",
  "linked_goal_id": "string (optional)",
  "tags": ["string"],
  "status_history": [{"status", "timestamp", "note"}],
  "actual_time": "number (optional)",
  "is_overdue": "boolean",
  "completed_at": "string (ISO)",
  "created_at": "string (ISO)"
}
```

### group_memberships (NEW)
```json
{
  "membership_id": "string",
  "user_id": "string",
  "group_id": "string",
  "role": "owner|admin|member",
  "joined_at": "string (ISO)",
  "is_active": "boolean",
  "last_read_at": "string (ISO)"
}
```

### group_messages (NEW)
```json
{
  "message_id": "string",
  "group_id": "string",
  "user_id": "string",
  "user_name": "string",
  "user_picture": "string (optional)",
  "content": "string",
  "message_type": "text|system|achievement",
  "created_at": "string (ISO)"
}
```

### group_goals (NEW)
```json
{
  "goal_id": "string",
  "group_id": "string",
  "title": "string",
  "description": "string",
  "target_count": "number",
  "current_count": "number",
  "target_date": "string (optional)",
  "completed": "boolean",
  "contributors": [{"user_id", "user_name", "contributed_at"}],
  "created_by": "string",
  "created_at": "string (ISO)"
}
```

## Completed Work (January 2026)

### Jan 24, 2026
- ✅ Enhanced Tasks with linked goals, tags, status history, overdue detection
- ✅ Enhanced Tasks API with today_only filter and linked_goal_id filter
- ✅ Enhanced Focus Timer with presets, streak tracking, session history
- ✅ Implemented multi-group Study Groups system
- ✅ Added group chat with real-time messaging
- ✅ Added shared group goals with contributions
- ✅ Fixed CORS issue for localhost development
- ✅ All tests passing (100%)

### Previous Sessions
- ✅ Smart Daily Planner with AI scheduling
- ✅ Goals page with categories, milestones, XP
- ✅ Light/Dark mode theming fix
- ✅ Goal checkbox progress feature
- ✅ Google Calendar integration (read-only)

## Upcoming Tasks

### P1 - High Priority
- [ ] AI Study Coach implementation
- [ ] Burnout detection alerts
- [ ] Weekly AI summaries
- [ ] Analytics dashboard overhaul with new charts
- [ ] Connect leaderboard to real API (currently showing group leaderboard)

### P2 - Medium Priority
- [ ] Collapsible sidebar in DashboardLayout
- [ ] Two-way Google Calendar sync
- [ ] Firebase migration for cloud storage

### P3 - Low Priority
- [ ] Notion integration
- [ ] Focus XP system
- [ ] Achievement badges
- [ ] "Study Personality" labels
- [ ] Mobile app

## File Structure
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI server (monolithic)
│   ├── .env               # Environment variables
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/ui/ # Shadcn components
│   │   ├── context/       # React context (Auth)
│   │   ├── layouts/       # DashboardLayout
│   │   ├── lib/api.js     # API client
│   │   └── pages/         # All page components
│   └── package.json
└── memory/
    └── PRD.md             # This file
```

## Refactoring Needs
- Backend `server.py` is monolithic (~3000 lines) - needs to be split into separate route files using FastAPI's APIRouter
- Large frontend pages (Goals.js, Planner.js, StudyGroups.js) should be decomposed into smaller components
