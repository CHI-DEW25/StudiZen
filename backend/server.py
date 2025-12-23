from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 168  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    subject: Optional[str] = ""
    priority: str = "medium"  # low, medium, high, urgent
    due_date: Optional[str] = None
    estimated_time: Optional[int] = None  # in minutes
    depends_on: Optional[List[str]] = []  # list of task_ids
    scheduled_time: Optional[str] = None  # for time blocking

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    task_id: str
    user_id: str
    title: str
    description: str
    subject: str
    priority: str
    status: str  # pending, in_progress, completed, overdue
    due_date: Optional[str]
    estimated_time: Optional[int]
    depends_on: List[str]
    scheduled_time: Optional[str]
    completed_at: Optional[str]
    created_at: str

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    estimated_time: Optional[int] = None
    depends_on: Optional[List[str]] = None
    scheduled_time: Optional[str] = None

class PomodoroSessionCreate(BaseModel):
    focus_duration: int = 25  # minutes
    break_duration: int = 5   # minutes
    task_id: Optional[str] = None

class PomodoroSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    task_id: Optional[str]
    focus_duration: int
    break_duration: int
    completed: bool
    started_at: str
    completed_at: Optional[str]

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    target_tasks: Optional[List[str]] = []
    week_start: str  # ISO date string

class Goal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    goal_id: str
    user_id: str
    title: str
    description: str
    target_tasks: List[str]
    week_start: str
    progress: float  # 0-100
    completed: bool
    created_at: str

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_tasks: Optional[List[str]] = None
    completed: Optional[bool] = None

class AIRequest(BaseModel):
    prompt: Optional[str] = None
    task_title: Optional[str] = None
    context: Optional[str] = None

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request, credentials = Depends(security)) -> dict:
    # Check for session_token cookie first (Google OAuth)
    session_token = request.cookies.get("session_token")
    if session_token:
        session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session_doc:
            expires_at = session_doc.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
                if user_doc:
                    return user_doc
    
    # Fall back to JWT Bearer token
    if credentials:
        token = credentials.credentials
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("user_id")
            user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            if user_doc:
                return user_doc
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    
    raise HTTPException(status_code=401, detail="Not authenticated")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email)
    return {
        "token": token,
        "user": {
            "user_id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "picture": None
        }
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get("password_hash") or not verify_password(user_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user_doc["user_id"], user_doc["email"])
    return {
        "token": token,
        "user": {
            "user_id": user_doc["user_id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "picture": user_doc.get("picture")
        }
    }

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Process Google OAuth session_id and create session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent auth API to get user data
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        user_data = resp.json()
    
    # Check if user exists, create if not
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_data["name"], "picture": user_data.get("picture")}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = user_data.get("session_token", f"session_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user_id,
        "email": user_data["email"],
        "name": user_data["name"],
        "picture": user_data.get("picture")
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "picture": current_user.get("picture")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ TASK ROUTES ============

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    task_id = f"task_{uuid.uuid4().hex[:12]}"
    task_doc = {
        "task_id": task_id,
        "user_id": current_user["user_id"],
        "title": task_data.title,
        "description": task_data.description or "",
        "subject": task_data.subject or "",
        "priority": task_data.priority,
        "status": "pending",
        "due_date": task_data.due_date,
        "estimated_time": task_data.estimated_time,
        "depends_on": task_data.depends_on or [],
        "scheduled_time": task_data.scheduled_time,
        "completed_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tasks.insert_one(task_doc)
    return Task(**{k: v for k, v in task_doc.items() if k != "_id"})

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    subject: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["user_id"]}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if subject:
        query["subject"] = subject
    
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    return [Task(**t) for t in tasks]

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one(
        {"task_id": task_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**task)

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in task_data.model_dump().items() if v is not None}
    
    if task_data.status == "completed":
        update_dict["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.tasks.update_one(
        {"task_id": task_id, "user_id": current_user["user_id"]},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    return Task(**task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"task_id": task_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# ============ POMODORO ROUTES ============

@api_router.post("/pomodoro/start", response_model=PomodoroSession)
async def start_pomodoro(session_data: PomodoroSessionCreate, current_user: dict = Depends(get_current_user)):
    session_id = f"pomo_{uuid.uuid4().hex[:12]}"
    session_doc = {
        "session_id": session_id,
        "user_id": current_user["user_id"],
        "task_id": session_data.task_id,
        "focus_duration": session_data.focus_duration,
        "break_duration": session_data.break_duration,
        "completed": False,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    await db.pomodoro_sessions.insert_one(session_doc)
    return PomodoroSession(**{k: v for k, v in session_doc.items() if k != "_id"})

@api_router.post("/pomodoro/{session_id}/complete", response_model=PomodoroSession)
async def complete_pomodoro(session_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.pomodoro_sessions.update_one(
        {"session_id": session_id, "user_id": current_user["user_id"]},
        {"$set": {"completed": True, "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = await db.pomodoro_sessions.find_one({"session_id": session_id}, {"_id": 0})
    return PomodoroSession(**session)

@api_router.get("/pomodoro/sessions", response_model=List[PomodoroSession])
async def get_pomodoro_sessions(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    sessions = await db.pomodoro_sessions.find(
        {"user_id": current_user["user_id"], "started_at": {"$gte": start_date}},
        {"_id": 0}
    ).to_list(1000)
    return [PomodoroSession(**s) for s in sessions]

@api_router.get("/pomodoro/stats")
async def get_pomodoro_stats(current_user: dict = Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    today_sessions = await db.pomodoro_sessions.count_documents({
        "user_id": current_user["user_id"],
        "completed": True,
        "started_at": {"$gte": today_start}
    })
    
    week_sessions = await db.pomodoro_sessions.find(
        {"user_id": current_user["user_id"], "completed": True, "started_at": {"$gte": week_start}},
        {"_id": 0}
    ).to_list(1000)
    
    total_focus_time = sum(s.get("focus_duration", 25) for s in week_sessions)
    
    return {
        "today_sessions": today_sessions,
        "week_sessions": len(week_sessions),
        "total_focus_time_minutes": total_focus_time,
        "average_daily_sessions": len(week_sessions) / 7
    }

# ============ GOALS ROUTES ============

@api_router.post("/goals", response_model=Goal)
async def create_goal(goal_data: GoalCreate, current_user: dict = Depends(get_current_user)):
    goal_id = f"goal_{uuid.uuid4().hex[:12]}"
    goal_doc = {
        "goal_id": goal_id,
        "user_id": current_user["user_id"],
        "title": goal_data.title,
        "description": goal_data.description or "",
        "target_tasks": goal_data.target_tasks or [],
        "week_start": goal_data.week_start,
        "progress": 0.0,
        "completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.goals.insert_one(goal_doc)
    return Goal(**{k: v for k, v in goal_doc.items() if k != "_id"})

@api_router.get("/goals", response_model=List[Goal])
async def get_goals(current_user: dict = Depends(get_current_user)):
    goals = await db.goals.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Calculate progress for each goal
    for goal in goals:
        if goal["target_tasks"]:
            completed_tasks = await db.tasks.count_documents({
                "task_id": {"$in": goal["target_tasks"]},
                "status": "completed"
            })
            goal["progress"] = (completed_tasks / len(goal["target_tasks"])) * 100
    
    return [Goal(**g) for g in goals]

@api_router.put("/goals/{goal_id}", response_model=Goal)
async def update_goal(goal_id: str, goal_data: GoalUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in goal_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.goals.update_one(
        {"goal_id": goal_id, "user_id": current_user["user_id"]},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal = await db.goals.find_one({"goal_id": goal_id}, {"_id": 0})
    return Goal(**goal)

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.goals.delete_one({"goal_id": goal_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}

# ============ ANALYTICS ROUTES ============

@api_router.get("/analytics/overview")
async def get_analytics_overview(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    
    # Task stats
    total_tasks = await db.tasks.count_documents({"user_id": user_id})
    completed_tasks = await db.tasks.count_documents({"user_id": user_id, "status": "completed"})
    overdue_tasks = await db.tasks.count_documents({
        "user_id": user_id,
        "status": {"$ne": "completed"},
        "due_date": {"$lt": datetime.now(timezone.utc).isoformat()}
    })
    
    # Pomodoro stats
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    week_sessions = await db.pomodoro_sessions.find(
        {"user_id": user_id, "completed": True, "started_at": {"$gte": week_start}},
        {"_id": 0}
    ).to_list(1000)
    
    total_focus_time = sum(s.get("focus_duration", 25) for s in week_sessions)
    
    # Goal stats
    active_goals = await db.goals.count_documents({"user_id": user_id, "completed": False})
    completed_goals = await db.goals.count_documents({"user_id": user_id, "completed": True})
    
    # Productivity score (simple calculation)
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    focus_score = min(len(week_sessions) / 28 * 100, 100)  # 4 sessions/day target
    productivity_score = (completion_rate + focus_score) / 2
    
    return {
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "overdue": overdue_tasks,
            "completion_rate": round(completion_rate, 1)
        },
        "pomodoro": {
            "sessions_this_week": len(week_sessions),
            "total_focus_time_minutes": total_focus_time,
            "average_daily_sessions": round(len(week_sessions) / 7, 1)
        },
        "goals": {
            "active": active_goals,
            "completed": completed_goals
        },
        "productivity_score": round(productivity_score, 1)
    }

@api_router.get("/analytics/daily-stats")
async def get_daily_stats(days: int = 7, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    daily_stats = []
    
    for i in range(days):
        day_date = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day_date.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_end = day_date.replace(hour=23, minute=59, second=59, microsecond=999999).isoformat()
        
        tasks_completed = await db.tasks.count_documents({
            "user_id": user_id,
            "completed_at": {"$gte": day_start, "$lte": day_end}
        })
        
        sessions = await db.pomodoro_sessions.find({
            "user_id": user_id,
            "completed": True,
            "started_at": {"$gte": day_start, "$lte": day_end}
        }, {"_id": 0}).to_list(100)
        
        focus_time = sum(s.get("focus_duration", 25) for s in sessions)
        
        daily_stats.append({
            "date": day_date.strftime("%Y-%m-%d"),
            "day": day_date.strftime("%a"),
            "tasks_completed": tasks_completed,
            "pomodoro_sessions": len(sessions),
            "focus_time_minutes": focus_time
        })
    
    return list(reversed(daily_stats))

# ============ AI ROUTES ============

@api_router.post("/ai/study-coach")
async def ai_study_coach(current_user: dict = Depends(get_current_user)):
    """AI Study Coach - Analyzes patterns and provides personalized advice"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_id = current_user["user_id"]
    
    # Gather user data
    tasks = await db.tasks.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    sessions = await db.pomodoro_sessions.find(
        {"user_id": user_id, "started_at": {"$gte": week_start}},
        {"_id": 0}
    ).to_list(100)
    goals = await db.goals.find({"user_id": user_id}, {"_id": 0}).to_list(20)
    
    completed_tasks = len([t for t in tasks if t["status"] == "completed"])
    pending_tasks = len([t for t in tasks if t["status"] == "pending"])
    overdue_tasks = len([t for t in tasks if t.get("due_date") and t["due_date"] < datetime.now(timezone.utc).isoformat() and t["status"] != "completed"])
    total_sessions = len([s for s in sessions if s["completed"]])
    total_focus = sum(s.get("focus_duration", 25) for s in sessions if s["completed"])
    
    context = f"""
    Student Productivity Data (Last 7 days):
    - Total tasks: {len(tasks)}
    - Completed tasks: {completed_tasks}
    - Pending tasks: {pending_tasks}
    - Overdue tasks: {overdue_tasks}
    - Pomodoro sessions completed: {total_sessions}
    - Total focus time: {total_focus} minutes
    - Active goals: {len([g for g in goals if not g["completed"]])}
    
    Task priorities breakdown:
    - High/Urgent: {len([t for t in tasks if t['priority'] in ['high', 'urgent']])}
    - Medium: {len([t for t in tasks if t['priority'] == 'medium'])}
    - Low: {len([t for t in tasks if t['priority'] == 'low'])}
    """
    
    chat = LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=f"coach_{user_id}_{datetime.now().strftime('%Y%m%d')}",
        system_message="You are an AI Study Coach. Analyze the student's productivity data and provide 2-3 specific, actionable tips. Be encouraging but direct. Focus on patterns and concrete suggestions. Keep response under 150 words."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(text=f"Based on this data, give me personalized study tips:\n{context}")
    response = await chat.send_message(message)
    
    return {"advice": response, "data_summary": {
        "tasks_completed": completed_tasks,
        "focus_time_hours": round(total_focus / 60, 1),
        "sessions_completed": total_sessions
    }}

@api_router.post("/ai/break-down-task")
async def ai_break_down_task(request: AIRequest, current_user: dict = Depends(get_current_user)):
    """AI Task Breakdown - Breaks large tasks into smaller steps"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    if not request.task_title:
        raise HTTPException(status_code=400, detail="task_title is required")
    
    chat = LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=f"breakdown_{uuid.uuid4().hex[:8]}",
        system_message="You are a task breakdown assistant. Break down the given task into 3-6 smaller, actionable subtasks. Each subtask should be specific and achievable in 15-45 minutes. Return as a JSON array of objects with 'title' and 'estimated_minutes' fields."
    ).with_model("openai", "gpt-4o")
    
    context = request.context or ""
    message = UserMessage(text=f"Break down this task into smaller steps:\nTask: {request.task_title}\nContext: {context}")
    response = await chat.send_message(message)
    
    # Try to parse as JSON
    import json
    try:
        # Extract JSON from response
        json_start = response.find('[')
        json_end = response.rfind(']') + 1
        if json_start != -1 and json_end > json_start:
            subtasks = json.loads(response[json_start:json_end])
        else:
            subtasks = [{"title": response, "estimated_minutes": 30}]
    except:
        subtasks = [{"title": response, "estimated_minutes": 30}]
    
    return {"original_task": request.task_title, "subtasks": subtasks}

@api_router.post("/ai/weekly-summary")
async def ai_weekly_summary(current_user: dict = Depends(get_current_user)):
    """AI Weekly Summary - End of week reflection and motivation"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_id = current_user["user_id"]
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    tasks = await db.tasks.find({"user_id": user_id}, {"_id": 0}).to_list(200)
    sessions = await db.pomodoro_sessions.find(
        {"user_id": user_id, "started_at": {"$gte": week_start}},
        {"_id": 0}
    ).to_list(200)
    goals = await db.goals.find({"user_id": user_id}, {"_id": 0}).to_list(20)
    
    completed_this_week = len([t for t in tasks if t.get("completed_at") and t["completed_at"] >= week_start])
    total_focus = sum(s.get("focus_duration", 25) for s in sessions if s["completed"])
    
    context = f"""
    Weekly Summary Data:
    - Tasks completed this week: {completed_this_week}
    - Total Pomodoro sessions: {len([s for s in sessions if s["completed"]])}
    - Total focus time: {total_focus} minutes ({round(total_focus/60, 1)} hours)
    - Goals in progress: {len([g for g in goals if not g["completed"]])}
    - Goals completed: {len([g for g in goals if g["completed"]])}
    """
    
    chat = LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=f"summary_{user_id}_{datetime.now().strftime('%Y%m%d')}",
        system_message="You are a supportive study coach. Write a brief, encouraging weekly summary (under 100 words). Acknowledge achievements, note one area for improvement, and end with motivation for next week. Be warm but concise."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(text=f"Write my weekly study summary:\n{context}")
    response = await chat.send_message(message)
    
    return {
        "summary": response,
        "stats": {
            "tasks_completed": completed_this_week,
            "focus_hours": round(total_focus / 60, 1),
            "sessions": len([s for s in sessions if s["completed"]])
        }
    }

@api_router.post("/ai/burnout-check")
async def ai_burnout_check(current_user: dict = Depends(get_current_user)):
    """AI Burnout Detection - Checks for signs of overwork"""
    user_id = current_user["user_id"]
    
    # Check last 4 days
    check_start = (datetime.now(timezone.utc) - timedelta(days=4)).isoformat()
    
    sessions = await db.pomodoro_sessions.find(
        {"user_id": user_id, "completed": True, "started_at": {"$gte": check_start}},
        {"_id": 0}
    ).to_list(200)
    
    tasks = await db.tasks.find(
        {"user_id": user_id, "status": {"$ne": "completed"}},
        {"_id": 0}
    ).to_list(200)
    
    overdue_count = len([t for t in tasks if t.get("due_date") and t["due_date"] < datetime.now(timezone.utc).isoformat()])
    total_focus = sum(s.get("focus_duration", 25) for s in sessions)
    daily_avg = total_focus / 4
    
    warnings = []
    risk_level = "low"
    
    if daily_avg > 240:  # More than 4 hours/day
        warnings.append("You've been averaging over 4 hours of focus time daily. Consider taking breaks.")
        risk_level = "medium"
    
    if len(sessions) > 24:  # More than 6 sessions/day average
        warnings.append("High number of Pomodoro sessions detected. Make sure you're resting properly.")
        risk_level = "medium"
    
    if overdue_count > 5:
        warnings.append(f"You have {overdue_count} overdue tasks. Consider prioritizing or rescheduling.")
        risk_level = "high" if risk_level == "medium" else "medium"
    
    if daily_avg > 360 and len(sessions) > 32:
        risk_level = "high"
        warnings.append("Warning: Signs of potential burnout detected. Please take a break!")
    
    if not warnings:
        warnings.append("Looking good! Your workload appears balanced.")
    
    return {
        "risk_level": risk_level,
        "warnings": warnings,
        "stats": {
            "avg_daily_focus_minutes": round(daily_avg, 0),
            "sessions_last_4_days": len(sessions),
            "overdue_tasks": overdue_count
        }
    }

# ============ ROOT & HEALTH ============

@api_router.get("/")
async def root():
    return {"message": "StudySmart API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
