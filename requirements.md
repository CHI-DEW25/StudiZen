# StudySmart - Student Productivity App

## Original Problem Statement
A comprehensive productivity web app designed for students to plan, track, and improve study habits. The dashboard combines task management, focus tracking, goal-setting, data visualisation, and AI-powered coaching into a single, cohesive system.

## User Choices
- **AI Integration**: OpenAI GPT-4o via Emergent LLM key
- **Authentication**: JWT (email/password) + Emergent-managed Google OAuth
- **Theme**: Dark mode default with light mode toggle
- **Charts**: Recharts
- **Design**: Rounded corners everywhere, purple/violet accents

## Architecture

### Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI + Recharts
- **Backend**: FastAPI (Python) + Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o via emergentintegrations library
- **Auth**: JWT tokens + Emergent Google OAuth

### Core Features Implemented
1. **Smart Task Manager** - CRUD operations, priorities, due dates, subjects, estimated time
2. **Pomodoro Focus Timer** - Customizable sessions, break tracking, daily/weekly stats
3. **Weekly Goals System** - Link tasks to goals, progress tracking
4. **Progress & Analytics Dashboard** - Charts, productivity score, completion rates
5. **AI Study Coach** - Personalized study tips based on patterns
6. **AI Task Breakdown** - Break large tasks into smaller steps
7. **AI Weekly Summary** - End-of-week reflection and motivation
8. **AI Burnout Detection** - Overwork warnings

### API Endpoints
- `/api/auth/*` - Authentication (register, login, logout, session, me)
- `/api/tasks/*` - Task CRUD operations
- `/api/pomodoro/*` - Focus sessions management
- `/api/goals/*` - Weekly goals management
- `/api/analytics/*` - Overview and daily stats
- `/api/ai/*` - AI features (study-coach, break-down-task, weekly-summary, burnout-check)

### File Structure
```
/app/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main router
│   │   ├── context/      # Auth & Theme providers
│   │   ├── layouts/      # Dashboard layout
│   │   ├── pages/        # All page components
│   │   ├── lib/          # API utilities
│   │   └── components/ui/ # Shadcn components
│   └── package.json
└── test_reports/
```

## Completed Tasks
- [x] Backend API with all endpoints
- [x] JWT authentication
- [x] Google OAuth integration
- [x] Task management (CRUD)
- [x] Pomodoro timer with stats
- [x] Weekly goals with progress
- [x] Analytics dashboard with charts
- [x] AI Study Coach
- [x] AI Task Breakdown
- [x] AI Weekly Summary
- [x] AI Burnout Detection
- [x] Dark/Light theme toggle
- [x] Responsive design
- [x] Landing page
- [x] Dashboard with sidebar navigation

## Next Action Items
1. **Task Dependencies** - Implement task dependency system (lock tasks until prerequisites complete)
2. **Calendar View** - Add drag-and-drop time blocking calendar for tasks
3. **Exam Countdown** - AI-powered exam preparation strategy
4. **Notifications** - Browser notifications for Pomodoro completion
5. **Data Export** - Export productivity data as CSV/PDF
6. **Mobile App** - Consider React Native for mobile version
