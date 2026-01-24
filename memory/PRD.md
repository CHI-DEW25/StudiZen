# StudySmart - Product Requirements Document

## Original Problem Statement
Build a comprehensive productivity web app called "StudySmart" for students with:
- **Smart Task Manager:** CRUD for tasks with dependencies, filtering, and an auto time-blocking calendar
- **Pomodoro Focus Timer:** Customizable timer with session tracking
- **Weekly Goals System:** Create goals, link tasks, and track progress with AI realism evaluation
- **Progress & Analytics Dashboard:** Visual charts for tasks, focus time, and goal completion
- **Smart Daily Planner:** AI-powered scheduling with priority scoring, energy-aware optimization, and Google Calendar integration

### AI-Powered Features
- AI Study Coach: Personalized advice based on user data
- AI Task Breakdown Assistant: Breaks large tasks into smaller steps
- AI Weekly Summary & Motivation: End-of-week summaries
- AI Pattern Detection: Identifies optimal study times and potential burnout
- **AI Schedule Generator:** Optimizes daily schedules based on task priorities, energy levels, and calendar events

### Authentication & Data Storage
- Phase 1: LocalStorage (COMPLETED - using MongoDB)
- Phase 2: Firebase for auth (Email/Google) and cloud data storage (PENDING)

### UX/UI Requirements
- Responsive, mobile-first design
- Dark/light mode (FIXED)
- Toast notifications
- Clean dashboard layout
- "Puzzle-style" glassmorphism theme

---

## Architecture

```
/app/
├── backend/
│   ├── server.py       # FastAPI server with all endpoints
│   ├── .env            # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY, GOOGLE_CLIENT_ID/SECRET
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Leaderboard.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   ├── layouts/
│   │   │   └── DashboardLayout.js
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   ├── DashboardHome.js
│   │   │   ├── Goals.js
│   │   │   ├── Tasks.js
│   │   │   ├── FocusTimer.js
│   │   │   ├── Analytics.js
│   │   │   ├── Planner.js      # NEW - Smart Planner
│   │   │   └── Landing.js
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
└── memory/
    └── PRD.md
```

### Tech Stack
- **Frontend:** React, Tailwind CSS, Recharts, Framer Motion, Shadcn/UI
- **Backend:** FastAPI, Motor (async MongoDB)
- **Database:** MongoDB
- **Authentication:** JWT + Emergent-managed Google OAuth
- **AI Integration:** Emergent LLM Key (OpenAI GPT-4o)
- **Google Calendar:** Read-only integration for event overlay

---

## What's Implemented

### Completed (as of Jan 2026)

#### Core Features
- [x] JWT and Google Authentication
- [x] Dashboard with analytics overview
- [x] Tasks page - Full CRUD with priority scoring
- [x] Focus Timer - Pomodoro with customizable duration
- [x] **Goals page - FULLY IMPLEMENTED:**
  - Goal CRUD with title, description, linked tasks
  - AI-powered goal breakdown (generates 4-7 subtasks)
  - Subtasks with checkbox completion
  - Progress tracking (auto-calculated from subtasks)
  - Progress logging (minutes + notes)
  - Streak tracking (consecutive days of progress)
  - Quick progress checkboxes on goal cards (+25% progress per click)
- [x] Analytics page with charts
- [x] Settings page
- [x] **Light/Dark mode - FIXED**

#### NEW: Smart Planner (Notion-style)
- [x] **Priority Scoring System:**
  - Two axes: priority (low/medium/high) + urgency (none/soon/urgent)
  - Auto-calculates urgency from due date
  - Final score = priority_weight × urgency_weight
- [x] **AI Schedule Generation:**
  - Generates daily timeline with Pomodoro-style blocks (50 min work, 10 min break)
  - Considers energy level (low/medium/high)
  - Prioritizes urgent + high-priority tasks
  - Breaks long tasks into multiple sessions
  - Includes lunch break
- [x] **Multiple View Modes:**
  - **Daily**: Timeline with schedule blocks, Today's Focus, Pending Tasks
  - **Weekly**: 7-day grid with hours/tasks per day, overload detection
  - **Monthly**: Calendar grid showing tasks due per day
  - **Yearly**: 12-month overview with completion rates
- [x] **Date Navigation:**
  - Calendar popover for date selection
  - View-specific navigation (day/week/month/year arrows)
  - Click-to-drill-down between views
- [x] **Overload Detection:**
  - Warns when days exceed 8 hours of work
  - Suggests redistributing tasks to lighter days
- [x] **Energy-aware Scheduling:**
  - Low energy: schedules easier tasks, more breaks
  - High energy: tackles harder tasks in morning
- [x] **Auto-Reschedule:**
  - Skipped tasks get priority boost
  - AI explains why rescheduled
- [x] **Google Calendar Integration (Read-only):**
  - OAuth flow for connecting
  - Imports events as locked blocks
  - Events shown in timeline with purple color
  - Prevents scheduling conflicts

#### AI Features
- [x] AI Study Coach endpoint
- [x] AI Task Breakdown
- [x] AI Weekly Summary
- [x] AI Burnout Check
- [x] AI Goal Breakdown
- [x] **AI Schedule Generator** (NEW)
- [x] **AI Schedule Explainer** (NEW)

#### Gamification (Backend Ready)
- [x] XP System - awards XP for completing tasks, sessions, goals
- [x] Streak tracking
- [x] Leaderboard API (individual + groups)
- [x] Study Groups API (CRUD, join/leave)

#### UI/UX
- [x] Dark "Puzzle-style" theme with glassmorphism
- [x] **Light mode - FIXED**
- [x] Custom gradient navbar
- [x] Responsive design
- [x] Toast notifications (Sonner)
- [x] Collapsible sidebar

---

## Prioritized Backlog

### P0 - High Priority
- [x] ~~Smart Planner with AI scheduling~~ DONE
- [x] ~~Light mode fix~~ DONE
- [ ] Connect Leaderboard component to real API (currently using mock data)

### P1 - Medium Priority
- [ ] Integrate XP system with frontend (show XP gains via toasts)
- [ ] Implement Study Groups UI (create, join, view members)
- [ ] Google Calendar two-way sync (create events)

### P2 - Lower Priority
- [ ] Migrate to Firebase for cloud storage
- [ ] Task dependencies system
- [ ] Full AI Coach implementation
- [ ] Weekly Preview (shows overload days)

### P3 - Future Enhancements
- [ ] Mobile app version
- [ ] Export data functionality
- [ ] Collaboration features
- [ ] Notion integration

---

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/session (Google OAuth)
- GET /api/auth/me
- POST /api/auth/logout

### Tasks
- GET/POST /api/tasks
- GET/PUT/DELETE /api/tasks/{task_id}

### Goals
- GET/POST /api/goals
- PUT/DELETE /api/goals/{goal_id}
- POST /api/goals/{goal_id}/breakdown

### Planner (NEW)
- GET /api/planner/schedule/{date}
- POST /api/planner/generate
- PUT /api/planner/schedule/{date}/block/{block_id}
- DELETE /api/planner/schedule/{date}/block/{block_id}
- POST /api/planner/reschedule-task/{task_id}
- GET /api/planner/explain/{date}

### Google Calendar (NEW)
- GET /api/calendar/auth-url
- GET /api/calendar/callback
- GET /api/calendar/events
- GET /api/calendar/status
- DELETE /api/calendar/disconnect

### Pomodoro
- POST /api/pomodoro/start
- POST /api/pomodoro/{session_id}/complete
- GET /api/pomodoro/sessions
- GET /api/pomodoro/stats

### Analytics
- GET /api/analytics/overview
- GET /api/analytics/daily-stats

### AI
- POST /api/ai/study-coach
- POST /api/ai/break-down-task
- POST /api/ai/weekly-summary
- POST /api/ai/burnout-check

### Leaderboard & Groups
- GET /api/leaderboard
- GET /api/leaderboard/groups
- GET/POST /api/groups
- POST /api/groups/{id}/join
- POST /api/groups/{id}/leave

---

## Test Credentials
- Email: goaltest@test.com
- Password: test123

## Preview URL
https://studysmart-113.preview.emergentagent.com
