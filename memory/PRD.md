# StudySmart - Product Requirements Document

## Original Problem Statement
Build a comprehensive productivity web app called "StudySmart" for students with:
- **Smart Task Manager:** CRUD for tasks with dependencies, filtering, and an auto time-blocking calendar
- **Pomodoro Focus Timer:** Customizable timer with session tracking
- **Weekly Goals System:** Create goals, link tasks, and track progress with AI realism evaluation
- **Progress & Analytics Dashboard:** Visual charts for tasks, focus time, and goal completion

### AI-Powered Features
- AI Study Coach: Personalized advice based on user data
- AI Task Breakdown Assistant: Breaks large tasks into smaller steps
- AI Weekly Summary & Motivation: End-of-week summaries
- AI Pattern Detection: Identifies optimal study times and potential burnout

### Authentication & Data Storage
- Phase 1: LocalStorage (COMPLETED - using MongoDB)
- Phase 2: Firebase for auth (Email/Google) and cloud data storage (PENDING)

### UX/UI Requirements
- Responsive, mobile-first design
- Dark/light mode
- Toast notifications
- Clean dashboard layout
- "Puzzle-style" glassmorphism theme

---

## Architecture

```
/app/
├── backend/
│   ├── server.py       # FastAPI server with all endpoints
│   ├── .env            # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY
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

---

## What's Implemented

### Completed (as of Jan 2026)

#### Core Features
- [x] JWT and Google Authentication
- [x] Dashboard with analytics overview
- [x] Tasks page - Full CRUD
- [x] Focus Timer - Pomodoro with customizable duration
- [x] **Goals page - FULLY IMPLEMENTED:**
  - Goal CRUD with title, description, linked tasks
  - AI-powered goal breakdown (generates 4-7 subtasks)
  - Subtasks with checkbox completion
  - Progress tracking (auto-calculated from subtasks)
  - Progress logging (minutes + notes)
  - Streak tracking (consecutive days of progress)
  - Mark complete/reopen functionality
  - **Quick progress checkboxes on goal cards** - click to add +25% progress & increment streak
- [x] Analytics page with charts
- [x] Settings page

#### AI Features
- [x] AI Study Coach endpoint
- [x] AI Task Breakdown
- [x] AI Weekly Summary
- [x] AI Burnout Check
- [x] **AI Goal Breakdown** (POST /api/goals/{id}/breakdown)

#### Gamification (Backend Ready)
- [x] XP System - awards XP for completing tasks, sessions, goals
- [x] Streak tracking
- [x] Leaderboard API (individual + groups)
- [x] Study Groups API (CRUD, join/leave)

#### UI/UX
- [x] Dark "Puzzle-style" theme with glassmorphism
- [x] Custom gradient navbar
- [x] Responsive design
- [x] Toast notifications (Sonner)

---

## Prioritized Backlog

### P0 - High Priority
- [ ] Connect Leaderboard component to real API (currently using mock data)
- [ ] Implement collapsible sidebar

### P1 - Medium Priority
- [ ] Integrate XP system with frontend (show XP gains via toasts)
- [ ] Implement Study Groups UI (create, join, view members)

### P2 - Lower Priority
- [ ] Migrate to Firebase for cloud storage
- [ ] Auto time-blocking calendar
- [ ] Task dependencies system
- [ ] Full AI Coach implementation

### P3 - Future Enhancements
- [ ] Mobile app version
- [ ] Export data functionality
- [ ] Collaboration features

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
- **POST /api/goals/{goal_id}/breakdown** - AI subtask generation

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

### Leaderboard
- GET /api/leaderboard
- GET /api/leaderboard/groups

### Study Groups
- GET/POST /api/groups
- GET /api/groups/{group_id}
- POST /api/groups/{group_id}/join
- POST /api/groups/{group_id}/leave

---

## Test Credentials
- Email: goaltest@test.com
- Password: test123

## Preview URL
https://studysmart-113.preview.emergentagent.com
