# StudySmart - Product Requirements Document

## Overview
StudySmart is a comprehensive productivity web app designed for students, featuring AI-powered study tools, task management, focus timers, goal tracking, and social study groups with full chat functionality.

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

### 4. Study Groups ✅ (ENHANCED)
**Multi-Group Support:**
- Join up to 5 groups simultaneously
- Create public/private groups
- Switch between groups in card view
- Set primary group for XP bonuses
- Leave groups (ownership transfer)

**Full-Screen Group View (NEW):**
- Click on group to enter full-screen immersive mode
- Back arrow (←) to exit and return to groups list
- Header with group name, member count, XP

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

**Group Stats Sidebar:**
- Total XP, Weekly XP
- Member count
- Active Goals count
- Top Contributors list

### 5. Smart Daily Planner ✅ (ENHANCED)
- AI-powered schedule generation
- Energy level inputs (morning, afternoon, evening)
- Multiple calendar views (Daily, Weekly, Monthly, Yearly)
- Time block management
- Read-only Google Calendar integration
- Overload detection
- **NEW: Pending Tasks sidebar with overdue badges**
- **NEW: Active Goals sidebar with progress bars**

### 6. Analytics & AI Insights ✅ (MAJOR UPDATE)

**Overview Tab:**
- Productivity Score
- Task Completion Rate
- Focus Time (hours)
- Goals Progress
- Daily Activity Chart (14 days)
- Task Distribution Pie Chart

**Tasks Tab:**
- Tasks Completed vs Overdue chart
- Priority Breakdown (Urgent, High, Medium, Low)
- Goal Progress cards

**Focus Tab:**
- Focus Time Trend chart
- Pomodoro Sessions chart
- AI Focus Pattern Analysis
  - Peak hours analysis
  - Day of week breakdown
  - Total sessions and focus time

**AI Insights Tab:**
- **AI Study Coach:** Personalized study tips based on user data
- **Burnout Detection:** Risk level (low/medium/high) with warnings
- **AI Weekly Summary:** End-of-week performance review

## API Endpoints

### Auth
- POST `/api/auth/register`, `/api/auth/login`
- GET `/api/auth/google/login`, `/api/auth/google/callback`
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

### AI Features
- POST `/api/ai/study-coach` - Personalized advice
- POST `/api/ai/break-down-task` - Task breakdown
- POST `/api/ai/weekly-summary` - Weekly summary
- POST `/api/ai/burnout-check` - Burnout detection
- POST `/api/ai/focus-patterns` - Focus pattern analysis

## Completed Work (January 2026)

### Jan 24, 2026 - Session 2
- ✅ **Study Groups Full-Screen Mode:** Click on group to enter immersive view with exit button
- ✅ **Enhanced Analytics Dashboard:** 4 tabs (Overview, Tasks, Focus, AI Insights)
- ✅ **AI Study Coach:** Personalized advice based on user data
- ✅ **AI Burnout Detection:** Risk assessment with warnings
- ✅ **AI Focus Pattern Analysis:** Peak hours and day breakdown
- ✅ **AI Weekly Summary:** End-of-week performance review
- ✅ **Planner Integration:** Shows tasks and goals in sidebar
- ✅ All tests passing (100%)

### Jan 24, 2026 - Session 1
- ✅ Enhanced Tasks with linked goals, tags, status history, overdue detection
- ✅ Enhanced Focus Timer with presets, streak tracking, session history
- ✅ Implemented multi-group Study Groups system
- ✅ Added group chat with real-time messaging
- ✅ Added shared group goals with contributions

### Previous Sessions
- ✅ Smart Daily Planner with AI scheduling
- ✅ Goals page with categories, milestones, XP
- ✅ Light/Dark mode theming fix
- ✅ Google Calendar integration (read-only)

## Upcoming Tasks

### P1 - High Priority
- [ ] Two-way Google Calendar sync
- [ ] Connect leaderboard to real API

### P2 - Medium Priority
- [ ] Collapsible sidebar in DashboardLayout
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

## Known Issues (Minor)
- React key warnings in Dashboard/Planner (duplicate keys)
- Recharts container sizing warning on initial load
- Both issues are non-critical and don't affect functionality
