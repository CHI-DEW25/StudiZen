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

# XP Configuration
XP_CONFIG = {
    "task_completed": {"low": 20, "medium": 30, "high": 40, "urgent": 50},
    "pomodoro_session": 25,
    "goal_completed": 100,
    "streak_bonus": 10,  # per day of streak
    "study_group_bonus": 1.2,  # 20% bonus for group members
}

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
    priority: str = "medium"
    due_date: Optional[str] = None
    estimated_time: Optional[int] = None
    depends_on: Optional[List[str]] = []
    scheduled_time: Optional[str] = None

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    task_id: str
    user_id: str
    title: str
    description: str
    subject: str
    priority: str
    status: str
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
    focus_duration: int = 25
    break_duration: int = 5
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
    week_start: str
    streak: Optional[int] = 0
    progress_logs: Optional[List[dict]] = []
    category: Optional[str] = "academic"  # academic, personal, health, career, other
    milestones: Optional[List[dict]] = []  # [{id, title, percentage, completed, xp_reward}]
    xp_reward: Optional[int] = 100  # Base XP for completing the goal
    deadline: Optional[str] = None

class Goal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    goal_id: str
    user_id: str
    title: str
    description: str
    target_tasks: List[str]
    week_start: str
    progress: float
    completed: bool
    created_at: str
    streak: Optional[int] = 0
    subtasks: Optional[List[dict]] = []
    progress_logs: Optional[List[dict]] = []
    category: Optional[str] = "academic"
    milestones: Optional[List[dict]] = []
    xp_reward: Optional[int] = 100
    deadline: Optional[str] = None
    xp_earned: Optional[int] = 0  # XP earned so far from milestones

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_tasks: Optional[List[str]] = None
    completed: Optional[bool] = None
    progress: Optional[float] = None
    streak: Optional[int] = None
    subtasks: Optional[List[dict]] = None
    progress_logs: Optional[List[dict]] = None
    category: Optional[str] = None
    milestones: Optional[List[dict]] = None
    xp_reward: Optional[int] = None
    deadline: Optional[str] = None
    xp_earned: Optional[int] = None

class AIRequest(BaseModel):
    prompt: Optional[str] = None
    task_title: Optional[str] = None
    context: Optional[str] = None

class StudyGroupCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    is_public: bool = True

class StudyGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

# ============ PLANNER MODELS ============

class ScheduleBlock(BaseModel):
    id: str
    start: str  # HH:MM format
    end: str    # HH:MM format
    type: str   # "task" | "break" | "event" | "focus"
    task_id: Optional[str] = None
    title: str
    priority_score: Optional[float] = None
    is_locked: bool = False  # Google Calendar events are locked
    color: Optional[str] = None

class DaySchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    schedule_id: str
    user_id: str
    date: str  # YYYY-MM-DD
    blocks: List[dict]
    energy_level: str = "medium"  # "low" | "medium" | "high"
    available_hours: float = 8.0
    created_at: str
    updated_at: str

class ScheduleGenerateRequest(BaseModel):
    date: str  # YYYY-MM-DD
    energy_level: str = "medium"
    available_start: str = "09:00"
    available_end: str = "21:00"
    include_breaks: bool = True
    pomodoro_style: bool = True  # 50 min work, 10 min break

class ScheduleBlockUpdate(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None
    task_id: Optional[str] = None

class UserPreferences(BaseModel):
    default_energy: str = "medium"
    work_start: str = "09:00"
    work_end: str = "21:00"
    pomodoro_work: int = 50
    pomodoro_break: int = 10
    google_calendar_connected: bool = False

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

# ============ XP HELPERS ============

def get_week_start():
    """Get the start of the current week (Monday)"""
    today = datetime.now(timezone.utc)
    return (today - timedelta(days=today.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)

def get_month_start():
    """Get the start of the current month"""
    today = datetime.now(timezone.utc)
    return today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

async def award_xp(user_id: str, amount: int, reason: str, group_id: str = None):
    """Award XP to a user and update leaderboard stats"""
    # Apply group bonus if user is in a study group
    final_amount = amount
    if group_id:
        final_amount = int(amount * XP_CONFIG["study_group_bonus"])
    
    week_start = get_week_start().isoformat()
    month_start = get_month_start().isoformat()
    
    # Update user's XP
    await db.users.update_one(
        {"user_id": user_id},
        {
            "$inc": {
                "total_xp": final_amount,
                "weekly_xp": final_amount,
                "monthly_xp": final_amount
            },
            "$set": {
                "last_xp_update": datetime.now(timezone.utc).isoformat(),
                "current_week": week_start,
                "current_month": month_start
            }
        }
    )
    
    # Log XP transaction
    await db.xp_transactions.insert_one({
        "transaction_id": f"xp_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "amount": final_amount,
        "reason": reason,
        "group_id": group_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Update group XP if applicable
    if group_id:
        await db.study_groups.update_one(
            {"group_id": group_id},
            {"$inc": {"total_xp": final_amount, "weekly_xp": final_amount}}
        )
    
    return final_amount

async def check_and_reset_periodic_xp(user_id: str):
    """Check if weekly/monthly XP needs to be reset"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        return
    
    current_week = get_week_start().isoformat()
    current_month = get_month_start().isoformat()
    
    updates = {}
    
    if user.get("current_week") != current_week:
        updates["weekly_xp"] = 0
        updates["current_week"] = current_week
    
    if user.get("current_month") != current_month:
        updates["monthly_xp"] = 0
        updates["current_month"] = current_month
    
    if updates:
        await db.users.update_one({"user_id": user_id}, {"$set": updates})

async def calculate_streak(user_id: str):
    """Calculate the current streak for a user"""
    today = datetime.now(timezone.utc).date()
    streak = 0
    
    # Get all completed tasks and sessions for the user
    for i in range(365):  # Check up to a year
        check_date = today - timedelta(days=i)
        day_start = datetime.combine(check_date, datetime.min.time()).replace(tzinfo=timezone.utc).isoformat()
        day_end = datetime.combine(check_date, datetime.max.time()).replace(tzinfo=timezone.utc).isoformat()
        
        # Check for any activity on this day
        task_count = await db.tasks.count_documents({
            "user_id": user_id,
            "completed_at": {"$gte": day_start, "$lte": day_end}
        })
        
        session_count = await db.pomodoro_sessions.count_documents({
            "user_id": user_id,
            "completed": True,
            "completed_at": {"$gte": day_start, "$lte": day_end}
        })
        
        if task_count > 0 or session_count > 0:
            streak += 1
        else:
            if i > 0:  # Allow today to have no activity
                break
    
    # Update user's streak
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"current_streak": streak}}
    )
    
    return streak

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
        "total_xp": 0,
        "weekly_xp": 0,
        "monthly_xp": 0,
        "current_streak": 0,
        "current_week": get_week_start().isoformat(),
        "current_month": get_month_start().isoformat(),
        "study_group_id": None,
        "badges": [],
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
            "picture": None,
            "total_xp": 0,
            "weekly_xp": 0,
            "current_streak": 0
        }
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get("password_hash") or not verify_password(user_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check and reset periodic XP
    await check_and_reset_periodic_xp(user_doc["user_id"])
    
    token = create_jwt_token(user_doc["user_id"], user_doc["email"])
    return {
        "token": token,
        "user": {
            "user_id": user_doc["user_id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "picture": user_doc.get("picture"),
            "total_xp": user_doc.get("total_xp", 0),
            "weekly_xp": user_doc.get("weekly_xp", 0),
            "current_streak": user_doc.get("current_streak", 0)
        }
    }

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        user_data = resp.json()
    
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_data["name"], "picture": user_data.get("picture")}}
        )
        await check_and_reset_periodic_xp(user_id)
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "total_xp": 0,
            "weekly_xp": 0,
            "monthly_xp": 0,
            "current_streak": 0,
            "current_week": get_week_start().isoformat(),
            "current_month": get_month_start().isoformat(),
            "study_group_id": None,
            "badges": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
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
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {
        "user_id": user_id,
        "email": user_data["email"],
        "name": user_data["name"],
        "picture": user_data.get("picture"),
        "total_xp": user.get("total_xp", 0),
        "weekly_xp": user.get("weekly_xp", 0),
        "current_streak": user.get("current_streak", 0)
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    await check_and_reset_periodic_xp(current_user["user_id"])
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "total_xp": user.get("total_xp", 0),
        "weekly_xp": user.get("weekly_xp", 0),
        "monthly_xp": user.get("monthly_xp", 0),
        "current_streak": user.get("current_streak", 0),
        "study_group_id": user.get("study_group_id"),
        "badges": user.get("badges", [])
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============ TASK ROUTES ============

@api_router.post("/tasks", response_model=Task, status_code=201)
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
    # Get current task state
    current_task = await db.tasks.find_one(
        {"task_id": task_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not current_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_dict = {k: v for k, v in task_data.model_dump().items() if v is not None}
    
    # Check if task is being completed
    if task_data.status == "completed" and current_task["status"] != "completed":
        update_dict["completed_at"] = datetime.now(timezone.utc).isoformat()
        
        # Award XP for completing task
        xp_amount = XP_CONFIG["task_completed"].get(current_task["priority"], 30)
        user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        await award_xp(
            current_user["user_id"], 
            xp_amount, 
            f"Completed task: {current_task['title']}",
            user.get("study_group_id")
        )
        
        # Update streak
        await calculate_streak(current_user["user_id"])
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await db.tasks.update_one(
        {"task_id": task_id, "user_id": current_user["user_id"]},
        {"$set": update_dict}
    )
    
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    return Task(**task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"task_id": task_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# ============ POMODORO ROUTES ============

@api_router.post("/pomodoro/start", response_model=PomodoroSession, status_code=201)
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
    session = await db.pomodoro_sessions.find_one(
        {"session_id": session_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["completed"]:
        return PomodoroSession(**session)
    
    await db.pomodoro_sessions.update_one(
        {"session_id": session_id, "user_id": current_user["user_id"]},
        {"$set": {"completed": True, "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Award XP for completing pomodoro session
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    await award_xp(
        current_user["user_id"],
        XP_CONFIG["pomodoro_session"],
        "Completed Pomodoro session",
        user.get("study_group_id")
    )
    
    # Update streak
    await calculate_streak(current_user["user_id"])
    
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

@api_router.post("/goals", response_model=Goal, status_code=201)
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
        "streak": goal_data.streak or 0,
        "subtasks": [],
        "progress_logs": goal_data.progress_logs or [],
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
    
    for goal in goals:
        # Calculate progress from subtasks if present
        if goal.get("subtasks") and len(goal["subtasks"]) > 0:
            completed_subtasks = len([s for s in goal["subtasks"] if s.get("completed")])
            goal["progress"] = (completed_subtasks / len(goal["subtasks"])) * 100
        elif goal["target_tasks"]:
            completed_tasks = await db.tasks.count_documents({
                "task_id": {"$in": goal["target_tasks"]},
                "status": "completed"
            })
            goal["progress"] = (completed_tasks / len(goal["target_tasks"])) * 100
        
        # Ensure default values for new fields
        goal.setdefault("streak", 0)
        goal.setdefault("subtasks", [])
        goal.setdefault("progress_logs", [])
    
    return [Goal(**g) for g in goals]

@api_router.put("/goals/{goal_id}", response_model=Goal)
async def update_goal(goal_id: str, goal_data: GoalUpdate, current_user: dict = Depends(get_current_user)):
    current_goal = await db.goals.find_one(
        {"goal_id": goal_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not current_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_dict = {k: v for k, v in goal_data.model_dump().items() if v is not None}
    
    # Check if goal is being completed
    if goal_data.completed and not current_goal["completed"]:
        user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        await award_xp(
            current_user["user_id"],
            XP_CONFIG["goal_completed"],
            f"Completed goal: {current_goal['title']}",
            user.get("study_group_id")
        )
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await db.goals.update_one(
        {"goal_id": goal_id, "user_id": current_user["user_id"]},
        {"$set": update_dict}
    )
    
    goal = await db.goals.find_one({"goal_id": goal_id}, {"_id": 0})
    return Goal(**goal)

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.goals.delete_one({"goal_id": goal_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}

class GoalBreakdownRequest(BaseModel):
    goal: str
    description: Optional[str] = ""
    completed: Optional[bool] = False
    subtasks: Optional[List[dict]] = None
    progress: Optional[float] = 0
    progressLogs: Optional[List[dict]] = None
    streak: Optional[int] = 0
    lastProgressDate: Optional[str] = None

@api_router.post("/goals/{goal_id}/breakdown")
async def breakdown_goal(goal_id: str, request: GoalBreakdownRequest, current_user: dict = Depends(get_current_user)):
    """Use AI to break down a goal into actionable subtasks"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import json
    
    goal = await db.goals.find_one(
        {"goal_id": goal_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    chat = LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=f"breakdown_{goal_id}_{uuid.uuid4().hex[:8]}",
        system_message="""You are a goal breakdown assistant for students. Break down the given goal into 4-7 actionable, specific subtasks.
Each subtask should:
- Be achievable in 15-60 minutes
- Be specific and measurable
- Progress logically toward the goal

Return ONLY a JSON array of objects with 'title' field. Example:
[{"title": "Review chapter 1 key concepts"}, {"title": "Complete practice problems 1-10"}]"""
    ).with_model("openai", "gpt-4o")
    
    context = f"Goal: {request.goal}"
    if request.description:
        context += f"\nDescription: {request.description}"
    
    message = UserMessage(text=f"Break down this goal into actionable steps:\n{context}")
    response = await chat.send_message(message)
    
    try:
        json_start = response.find('[')
        json_end = response.rfind(']') + 1
        if json_start != -1 and json_end > json_start:
            subtasks = json.loads(response[json_start:json_end])
        else:
            subtasks = [{"title": "Work on: " + request.goal}]
    except:
        subtasks = [{"title": "Work on: " + request.goal}]
    
    return subtasks

# ============ LEADERBOARD ROUTES ============

@api_router.get("/leaderboard")
async def get_leaderboard(
    period: str = "weekly",  # weekly, monthly, alltime
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get the leaderboard for students"""
    await check_and_reset_periodic_xp(current_user["user_id"])
    
    # Determine which XP field to sort by
    xp_field = "total_xp"
    if period == "weekly":
        xp_field = "weekly_xp"
    elif period == "monthly":
        xp_field = "monthly_xp"
    
    # Get top users
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).sort(xp_field, -1).limit(limit).to_list(limit)
    
    leaderboard = []
    for i, user in enumerate(users):
        # Calculate focus hours this period
        if period == "weekly":
            start_date = get_week_start().isoformat()
        elif period == "monthly":
            start_date = get_month_start().isoformat()
        else:
            start_date = "2020-01-01"
        
        sessions = await db.pomodoro_sessions.find(
            {"user_id": user["user_id"], "completed": True, "started_at": {"$gte": start_date}},
            {"_id": 0}
        ).to_list(1000)
        focus_minutes = sum(s.get("focus_duration", 25) for s in sessions)
        
        tasks_completed = await db.tasks.count_documents({
            "user_id": user["user_id"],
            "status": "completed",
            "completed_at": {"$gte": start_date}
        })
        
        leaderboard.append({
            "rank": i + 1,
            "user_id": user["user_id"],
            "name": user["name"],
            "picture": user.get("picture"),
            "xp": user.get(xp_field, 0),
            "total_xp": user.get("total_xp", 0),
            "streak": user.get("current_streak", 0),
            "focus_hours": round(focus_minutes / 60, 1),
            "tasks_completed": tasks_completed,
            "badges": user.get("badges", []),
            "study_group_id": user.get("study_group_id"),
            "is_current_user": user["user_id"] == current_user["user_id"]
        })
    
    # Get current user's rank if not in top
    current_user_in_list = any(u["is_current_user"] for u in leaderboard)
    current_user_rank = None
    
    if not current_user_in_list:
        # Count users with more XP
        user_xp = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        if user_xp:
            higher_count = await db.users.count_documents({
                xp_field: {"$gt": user_xp.get(xp_field, 0)}
            })
            current_user_rank = higher_count + 1
    
    return {
        "period": period,
        "leaderboard": leaderboard,
        "current_user_rank": current_user_rank
    }

@api_router.get("/leaderboard/groups")
async def get_group_leaderboard(
    period: str = "weekly",
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get the study groups leaderboard"""
    xp_field = "weekly_xp" if period == "weekly" else "total_xp"
    
    groups = await db.study_groups.find(
        {},
        {"_id": 0}
    ).sort(xp_field, -1).limit(limit).to_list(limit)
    
    leaderboard = []
    for i, group in enumerate(groups):
        member_count = await db.users.count_documents({"study_group_id": group["group_id"]})
        leaderboard.append({
            "rank": i + 1,
            "group_id": group["group_id"],
            "name": group["name"],
            "description": group.get("description", ""),
            "xp": group.get(xp_field, 0),
            "total_xp": group.get("total_xp", 0),
            "member_count": member_count,
            "owner_id": group["owner_id"],
            "is_member": current_user.get("study_group_id") == group["group_id"]
        })
    
    return {
        "period": period,
        "leaderboard": leaderboard
    }

# ============ STUDY GROUPS ROUTES ============

@api_router.post("/groups", status_code=201)
async def create_study_group(group_data: StudyGroupCreate, current_user: dict = Depends(get_current_user)):
    """Create a new study group"""
    # Check if user is already in a group
    if current_user.get("study_group_id"):
        raise HTTPException(status_code=400, detail="You are already in a study group. Leave first to create a new one.")
    
    group_id = f"group_{uuid.uuid4().hex[:12]}"
    group_doc = {
        "group_id": group_id,
        "name": group_data.name,
        "description": group_data.description or "",
        "owner_id": current_user["user_id"],
        "is_public": group_data.is_public,
        "total_xp": 0,
        "weekly_xp": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.study_groups.insert_one(group_doc)
    
    # Add user to the group
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"study_group_id": group_id}}
    )
    
    return {
        "group_id": group_id,
        "name": group_data.name,
        "description": group_data.description,
        "owner_id": current_user["user_id"],
        "member_count": 1
    }

@api_router.get("/groups")
async def get_study_groups(
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get list of public study groups"""
    query = {"is_public": True}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    groups = await db.study_groups.find(query, {"_id": 0}).sort("total_xp", -1).to_list(50)
    
    result = []
    for group in groups:
        member_count = await db.users.count_documents({"study_group_id": group["group_id"]})
        result.append({
            "group_id": group["group_id"],
            "name": group["name"],
            "description": group.get("description", ""),
            "owner_id": group["owner_id"],
            "total_xp": group.get("total_xp", 0),
            "weekly_xp": group.get("weekly_xp", 0),
            "member_count": member_count,
            "is_member": current_user.get("study_group_id") == group["group_id"]
        })
    
    return result

@api_router.get("/groups/{group_id}")
async def get_study_group(group_id: str, current_user: dict = Depends(get_current_user)):
    """Get details of a study group"""
    group = await db.study_groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get members
    members = await db.users.find(
        {"study_group_id": group_id},
        {"_id": 0, "password_hash": 0}
    ).sort("weekly_xp", -1).to_list(100)
    
    return {
        "group_id": group["group_id"],
        "name": group["name"],
        "description": group.get("description", ""),
        "owner_id": group["owner_id"],
        "total_xp": group.get("total_xp", 0),
        "weekly_xp": group.get("weekly_xp", 0),
        "is_public": group.get("is_public", True),
        "created_at": group["created_at"],
        "members": [{
            "user_id": m["user_id"],
            "name": m["name"],
            "picture": m.get("picture"),
            "weekly_xp": m.get("weekly_xp", 0),
            "total_xp": m.get("total_xp", 0),
            "streak": m.get("current_streak", 0),
            "is_owner": m["user_id"] == group["owner_id"]
        } for m in members],
        "is_member": current_user.get("study_group_id") == group_id,
        "is_owner": current_user["user_id"] == group["owner_id"]
    }

@api_router.post("/groups/{group_id}/join")
async def join_study_group(group_id: str, current_user: dict = Depends(get_current_user)):
    """Join a study group"""
    if current_user.get("study_group_id"):
        raise HTTPException(status_code=400, detail="You are already in a study group. Leave first to join another.")
    
    group = await db.study_groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if not group.get("is_public", True):
        raise HTTPException(status_code=403, detail="This group is private")
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"study_group_id": group_id}}
    )
    
    return {"message": f"Successfully joined {group['name']}"}

@api_router.post("/groups/{group_id}/leave")
async def leave_study_group(group_id: str, current_user: dict = Depends(get_current_user)):
    """Leave a study group"""
    if current_user.get("study_group_id") != group_id:
        raise HTTPException(status_code=400, detail="You are not in this group")
    
    group = await db.study_groups.find_one({"group_id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if user is owner
    if group["owner_id"] == current_user["user_id"]:
        # Transfer ownership or delete group
        other_members = await db.users.find(
            {"study_group_id": group_id, "user_id": {"$ne": current_user["user_id"]}},
            {"_id": 0}
        ).to_list(1)
        
        if other_members:
            # Transfer to first other member
            await db.study_groups.update_one(
                {"group_id": group_id},
                {"$set": {"owner_id": other_members[0]["user_id"]}}
            )
        else:
            # Delete the group
            await db.study_groups.delete_one({"group_id": group_id})
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"study_group_id": None}}
    )
    
    return {"message": "Successfully left the group"}

@api_router.get("/groups/my/current")
async def get_my_study_group(current_user: dict = Depends(get_current_user)):
    """Get the current user's study group"""
    group_id = current_user.get("study_group_id")
    if not group_id:
        return None
    
    return await get_study_group(group_id, current_user)

# ============ ANALYTICS ROUTES ============

@api_router.get("/analytics/overview")
async def get_analytics_overview(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    
    total_tasks = await db.tasks.count_documents({"user_id": user_id})
    completed_tasks = await db.tasks.count_documents({"user_id": user_id, "status": "completed"})
    overdue_tasks = await db.tasks.count_documents({
        "user_id": user_id,
        "status": {"$ne": "completed"},
        "due_date": {"$lt": datetime.now(timezone.utc).isoformat()}
    })
    
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    week_sessions = await db.pomodoro_sessions.find(
        {"user_id": user_id, "completed": True, "started_at": {"$gte": week_start}},
        {"_id": 0}
    ).to_list(1000)
    
    total_focus_time = sum(s.get("focus_duration", 25) for s in week_sessions)
    
    active_goals = await db.goals.count_documents({"user_id": user_id, "completed": False})
    completed_goals = await db.goals.count_documents({"user_id": user_id, "completed": True})
    
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    focus_score = min(len(week_sessions) / 28 * 100, 100)
    productivity_score = (completion_rate + focus_score) / 2
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
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
        "productivity_score": round(productivity_score, 1),
        "xp": {
            "total": user.get("total_xp", 0),
            "weekly": user.get("weekly_xp", 0),
            "monthly": user.get("monthly_xp", 0)
        },
        "streak": user.get("current_streak", 0)
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
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_id = current_user["user_id"]
    
    tasks = await db.tasks.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    sessions = await db.pomodoro_sessions.find(
        {"user_id": user_id, "started_at": {"$gte": week_start}},
        {"_id": 0}
    ).to_list(100)
    goals = await db.goals.find({"user_id": user_id}, {"_id": 0}).to_list(20)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
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
    - Current streak: {user.get('current_streak', 0)} days
    - Weekly XP: {user.get('weekly_xp', 0)}
    
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
    
    import json
    try:
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
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_id = current_user["user_id"]
    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    tasks = await db.tasks.find({"user_id": user_id}, {"_id": 0}).to_list(200)
    sessions = await db.pomodoro_sessions.find(
        {"user_id": user_id, "started_at": {"$gte": week_start}},
        {"_id": 0}
    ).to_list(200)
    goals = await db.goals.find({"user_id": user_id}, {"_id": 0}).to_list(20)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    completed_this_week = len([t for t in tasks if t.get("completed_at") and t["completed_at"] >= week_start])
    total_focus = sum(s.get("focus_duration", 25) for s in sessions if s["completed"])
    
    context = f"""
    Weekly Summary Data:
    - Tasks completed this week: {completed_this_week}
    - Total Pomodoro sessions: {len([s for s in sessions if s["completed"]])}
    - Total focus time: {total_focus} minutes ({round(total_focus/60, 1)} hours)
    - Goals in progress: {len([g for g in goals if not g["completed"]])}
    - Goals completed: {len([g for g in goals if g["completed"]])}
    - Weekly XP earned: {user.get('weekly_xp', 0)}
    - Current streak: {user.get('current_streak', 0)} days
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
            "sessions": len([s for s in sessions if s["completed"]]),
            "xp_earned": user.get('weekly_xp', 0)
        }
    }

@api_router.post("/ai/burnout-check")
async def ai_burnout_check(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    
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
    
    if daily_avg > 240:
        warnings.append("You've been averaging over 4 hours of focus time daily. Consider taking breaks.")
        risk_level = "medium"
    
    if len(sessions) > 24:
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

# ============ SMART PLANNER ============

def calculate_priority_score(task: dict) -> float:
    """Calculate priority score based on priority and urgency"""
    priority_weights = {"low": 1, "medium": 2, "high": 3}
    urgency_weights = {"none": 1, "soon": 2, "urgent": 3}
    
    priority = task.get("priority", "medium")
    priority_weight = priority_weights.get(priority, 2)
    
    # Calculate urgency from due date
    urgency = "none"
    if task.get("due_date"):
        try:
            due = datetime.fromisoformat(task["due_date"].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            days_until = (due - now).days
            
            if days_until <= 1:
                urgency = "urgent"
            elif days_until <= 3:
                urgency = "soon"
        except:
            pass
    
    urgency_weight = urgency_weights.get(urgency, 1)
    
    # Final score: priority * urgency (higher = more important)
    return priority_weight * urgency_weight

def get_energy_task_filter(energy_level: str, task_priority: str) -> bool:
    """Filter tasks based on energy level"""
    if energy_level == "high":
        return True  # Can do any task
    elif energy_level == "medium":
        return task_priority != "urgent"  # Avoid most demanding
    else:  # low energy
        return task_priority in ["low", "medium"]  # Only lighter tasks

@api_router.get("/planner/schedule/{date}")
async def get_schedule(date: str, current_user: dict = Depends(get_current_user)):
    """Get the schedule for a specific date"""
    schedule = await db.schedules.find_one(
        {"user_id": current_user["user_id"], "date": date},
        {"_id": 0}
    )
    
    if not schedule:
        return {"schedule_id": None, "date": date, "blocks": [], "energy_level": "medium"}
    
    return schedule

@api_router.post("/planner/generate")
async def generate_schedule(request: ScheduleGenerateRequest, current_user: dict = Depends(get_current_user)):
    """Generate an AI-optimized daily schedule"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import json
    
    user_id = current_user["user_id"]
    
    # Get pending tasks
    tasks = await db.tasks.find(
        {"user_id": user_id, "status": {"$ne": "completed"}},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate priority scores and filter by energy
    scored_tasks = []
    for task in tasks:
        score = calculate_priority_score(task)
        task["priority_score"] = score
        
        # Energy-based filtering
        if request.energy_level == "low" and task.get("priority") == "high":
            task["priority_score"] *= 0.5  # Reduce priority for demanding tasks on low energy days
        elif request.energy_level == "high" and task.get("priority") == "high":
            task["priority_score"] *= 1.3  # Boost priority for important tasks on high energy days
        
        scored_tasks.append(task)
    
    # Sort by priority score (descending)
    scored_tasks.sort(key=lambda x: x["priority_score"], reverse=True)
    
    # Get Google Calendar events if connected
    google_events = []
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if user and user.get("google_tokens"):
        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            from google.auth.transport.requests import Request as GoogleRequest
            
            tokens = user["google_tokens"]
            creds = Credentials(
                token=tokens.get('access_token'),
                refresh_token=tokens.get('refresh_token'),
                token_uri='https://oauth2.googleapis.com/token',
                client_id=os.environ.get('GOOGLE_CLIENT_ID'),
                client_secret=os.environ.get('GOOGLE_CLIENT_SECRET')
            )
            
            if creds.expired and creds.refresh_token:
                creds.refresh(GoogleRequest())
                await db.users.update_one(
                    {"user_id": user_id},
                    {"$set": {"google_tokens.access_token": creds.token}}
                )
            
            service = build('calendar', 'v3', credentials=creds)
            
            # Get events for the requested date
            date_start = f"{request.date}T00:00:00Z"
            date_end = f"{request.date}T23:59:59Z"
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=date_start,
                timeMax=date_end,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            google_events = events_result.get('items', [])
        except Exception as e:
            logging.warning(f"Failed to fetch Google Calendar events: {e}")
    
    # Build context for AI
    tasks_context = "\n".join([
        f"- {t['title']} (priority: {t.get('priority', 'medium')}, score: {t['priority_score']:.1f}, est: {t.get('estimated_time', 30)}min)"
        for t in scored_tasks[:15]  # Top 15 tasks
    ])
    
    events_context = ""
    if google_events:
        events_context = "\nExisting calendar events (LOCKED - cannot move):\n" + "\n".join([
            f"- {e.get('summary', 'Event')} ({e['start'].get('dateTime', e['start'].get('date', ''))[:16]} - {e['end'].get('dateTime', e['end'].get('date', ''))[:16]})"
            for e in google_events
        ])
    
    ai_prompt = f"""You are a productivity planner.

Given:
- Energy level: {request.energy_level}
- Available hours: {request.available_start} to {request.available_end}
- Pomodoro style: {request.pomodoro_style} (50 min work, 10 min break)
- Include breaks: {request.include_breaks}

Tasks (sorted by priority score):
{tasks_context}
{events_context}

Generate a realistic daily schedule.
Rules:
- High priority + urgent tasks first
- Break tasks into ≤50 minute sessions
- Include 10 min breaks between work blocks
- For low energy: schedule easier tasks, more breaks
- For high energy: tackle harder tasks in morning
- Avoid scheduling over locked events
- Return JSON only

Output format:
{{
  "schedule": [
    {{"start": "09:00", "end": "09:50", "type": "task", "title": "Task name", "task_id": "task_xxx"}},
    {{"start": "09:50", "end": "10:00", "type": "break", "title": "Short break"}},
    {{"start": "10:00", "end": "10:50", "type": "task", "title": "Another task"}}
  ],
  "explanation": "Brief explanation of the schedule logic"
}}"""
    
    chat = LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=f"planner_{user_id}_{request.date}",
        system_message="You are an AI productivity planner. Generate optimal daily schedules based on task priorities, energy levels, and existing commitments. Always return valid JSON."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(text=ai_prompt)
    response = await chat.send_message(message)
    
    # Parse AI response
    try:
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            ai_schedule = json.loads(response[json_start:json_end])
        else:
            raise ValueError("No JSON found")
    except Exception as e:
        logging.error(f"Failed to parse AI schedule: {e}")
        # Fallback: generate rule-based schedule
        ai_schedule = generate_rule_based_schedule(scored_tasks, request, google_events)
    
    # Add Google Calendar events as locked blocks
    blocks = []
    for event in google_events:
        start_dt = event['start'].get('dateTime', event['start'].get('date', ''))
        end_dt = event['end'].get('dateTime', event['end'].get('date', ''))
        
        blocks.append({
            "id": f"gcal_{event.get('id', uuid.uuid4().hex[:8])}",
            "start": start_dt[11:16] if 'T' in start_dt else "00:00",
            "end": end_dt[11:16] if 'T' in end_dt else "23:59",
            "type": "event",
            "title": event.get('summary', 'Calendar Event'),
            "is_locked": True,
            "color": "#8B5CF6"  # Purple for calendar events
        })
    
    # Add AI-generated schedule blocks
    for block in ai_schedule.get("schedule", []):
        block_id = block.get("task_id") or f"block_{uuid.uuid4().hex[:8]}"
        blocks.append({
            "id": block_id,
            "start": block["start"],
            "end": block["end"],
            "type": block["type"],
            "title": block["title"],
            "task_id": block.get("task_id"),
            "is_locked": False,
            "color": "#22C55E" if block["type"] == "task" else "#6B7280"
        })
    
    # Sort blocks by start time
    blocks.sort(key=lambda x: x["start"])
    
    # Save schedule
    schedule_id = f"sched_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    schedule_doc = {
        "schedule_id": schedule_id,
        "user_id": user_id,
        "date": request.date,
        "blocks": blocks,
        "energy_level": request.energy_level,
        "available_hours": calculate_available_hours(request.available_start, request.available_end),
        "explanation": ai_schedule.get("explanation", ""),
        "created_at": now,
        "updated_at": now
    }
    
    # Upsert: update if exists, insert if not
    await db.schedules.update_one(
        {"user_id": user_id, "date": request.date},
        {"$set": schedule_doc},
        upsert=True
    )
    
    return schedule_doc

def generate_rule_based_schedule(tasks: list, request: ScheduleGenerateRequest, google_events: list) -> dict:
    """Fallback rule-based schedule generator"""
    schedule = []
    current_time = datetime.strptime(request.available_start, "%H:%M")
    end_time = datetime.strptime(request.available_end, "%H:%M")
    
    work_duration = 50 if request.pomodoro_style else 60
    break_duration = 10 if request.include_breaks else 0
    
    # Get locked event times
    locked_times = []
    for event in google_events:
        start_dt = event['start'].get('dateTime', '')
        end_dt = event['end'].get('dateTime', '')
        if start_dt and end_dt:
            locked_times.append((start_dt[11:16], end_dt[11:16]))
    
    task_index = 0
    while current_time < end_time and task_index < len(tasks):
        block_start = current_time.strftime("%H:%M")
        block_end = (current_time + timedelta(minutes=work_duration)).strftime("%H:%M")
        
        # Check if this conflicts with a locked event
        conflicts = False
        for lock_start, lock_end in locked_times:
            if block_start < lock_end and block_end > lock_start:
                conflicts = True
                # Skip to after the locked event
                current_time = datetime.strptime(lock_end, "%H:%M")
                break
        
        if conflicts:
            continue
        
        task = tasks[task_index]
        schedule.append({
            "start": block_start,
            "end": block_end,
            "type": "task",
            "title": task["title"],
            "task_id": task.get("task_id")
        })
        
        current_time += timedelta(minutes=work_duration)
        
        # Add break
        if request.include_breaks and current_time < end_time:
            schedule.append({
                "start": current_time.strftime("%H:%M"),
                "end": (current_time + timedelta(minutes=break_duration)).strftime("%H:%M"),
                "type": "break",
                "title": "Short break"
            })
            current_time += timedelta(minutes=break_duration)
        
        task_index += 1
    
    return {"schedule": schedule, "explanation": "Rule-based schedule generated as fallback"}

def calculate_available_hours(start: str, end: str) -> float:
    """Calculate hours between two HH:MM times"""
    start_dt = datetime.strptime(start, "%H:%M")
    end_dt = datetime.strptime(end, "%H:%M")
    return (end_dt - start_dt).seconds / 3600

@api_router.put("/planner/schedule/{date}/block/{block_id}")
async def update_schedule_block(
    date: str, 
    block_id: str, 
    update: ScheduleBlockUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update a specific block in a schedule (drag-and-drop support)"""
    schedule = await db.schedules.find_one(
        {"user_id": current_user["user_id"], "date": date},
        {"_id": 0}
    )
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Find and update the block
    blocks = schedule.get("blocks", [])
    for i, block in enumerate(blocks):
        if block.get("id") == block_id:
            if block.get("is_locked"):
                raise HTTPException(status_code=400, detail="Cannot modify locked blocks")
            
            if update.start:
                blocks[i]["start"] = update.start
            if update.end:
                blocks[i]["end"] = update.end
            if update.task_id is not None:
                blocks[i]["task_id"] = update.task_id
            break
    else:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Re-sort blocks
    blocks.sort(key=lambda x: x["start"])
    
    await db.schedules.update_one(
        {"user_id": current_user["user_id"], "date": date},
        {"$set": {"blocks": blocks, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Block updated", "blocks": blocks}

@api_router.delete("/planner/schedule/{date}/block/{block_id}")
async def delete_schedule_block(date: str, block_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a block from the schedule"""
    schedule = await db.schedules.find_one(
        {"user_id": current_user["user_id"], "date": date},
        {"_id": 0}
    )
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    blocks = schedule.get("blocks", [])
    original_count = len(blocks)
    blocks = [b for b in blocks if b.get("id") != block_id or b.get("is_locked")]
    
    if len(blocks) == original_count:
        raise HTTPException(status_code=404, detail="Block not found or is locked")
    
    await db.schedules.update_one(
        {"user_id": current_user["user_id"], "date": date},
        {"$set": {"blocks": blocks, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Block deleted"}

@api_router.post("/planner/reschedule-task/{task_id}")
async def reschedule_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Auto-reschedule a skipped task with increased priority"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    task = await db.tasks.find_one(
        {"task_id": task_id, "user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Increase priority if not already high
    current_priority = task.get("priority", "medium")
    new_priority = current_priority
    if current_priority == "low":
        new_priority = "medium"
    elif current_priority == "medium":
        new_priority = "high"
    
    # Update task with increased priority
    await db.tasks.update_one(
        {"task_id": task_id},
        {"$set": {"priority": new_priority, "rescheduled_count": task.get("rescheduled_count", 0) + 1}}
    )
    
    # Generate AI explanation
    chat = LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=f"reschedule_{task_id}",
        system_message="You are a productivity assistant. Explain briefly (1-2 sentences) why a task was rescheduled."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(text=f"Task '{task['title']}' was rescheduled. Priority changed from {current_priority} to {new_priority}. Explain why this happened and encourage the user.")
    explanation = await chat.send_message(message)
    
    return {
        "task_id": task_id,
        "old_priority": current_priority,
        "new_priority": new_priority,
        "explanation": explanation
    }

@api_router.get("/planner/explain/{date}")
async def explain_schedule(date: str, current_user: dict = Depends(get_current_user)):
    """AI explains why the schedule was arranged this way"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    schedule = await db.schedules.find_one(
        {"user_id": current_user["user_id"], "date": date},
        {"_id": 0}
    )
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    blocks_summary = "\n".join([
        f"- {b['start']}-{b['end']}: {b['title']} ({b['type']})"
        for b in schedule.get("blocks", [])[:10]
    ])
    
    chat = LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY'),
        session_id=f"explain_{date}",
        system_message="You are a productivity coach. Explain a daily schedule in a friendly, helpful way. Keep it under 100 words."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(text=f"""Explain this schedule for {date} (energy level: {schedule.get('energy_level', 'medium')}):
{blocks_summary}

Why was it arranged this way? What's the strategy?""")
    
    explanation = await chat.send_message(message)
    
    return {"date": date, "explanation": explanation}

# ============ GOOGLE CALENDAR INTEGRATION ============

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_CALENDAR_REDIRECT_URI', 
    os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001') + '/api/calendar/callback')

@api_router.get("/calendar/auth-url")
async def get_calendar_auth_url(current_user: dict = Depends(get_current_user)):
    """Get Google Calendar OAuth authorization URL"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Calendar not configured")
    
    scopes = "https://www.googleapis.com/auth/calendar.readonly"
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"scope={scopes}&"
        f"response_type=code&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={current_user['user_id']}"
    )
    
    return {"authorization_url": auth_url}

@api_router.get("/calendar/callback")
async def calendar_callback(code: str, state: str):
    """Handle Google Calendar OAuth callback"""
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': GOOGLE_CLIENT_ID,
                'client_secret': GOOGLE_CLIENT_SECRET,
                'redirect_uri': GOOGLE_REDIRECT_URI,
                'grant_type': 'authorization_code'
            }
        )
    
    if token_resp.status_code != 200:
        logging.error(f"Token exchange failed: {token_resp.text}")
        return Response(
            content=f"<script>window.opener.postMessage({{type: 'GOOGLE_CALENDAR_ERROR', error: 'Failed to connect'}}, '*'); window.close();</script>",
            media_type="text/html"
        )
    
    tokens = token_resp.json()
    
    # Save tokens to user
    await db.users.update_one(
        {"user_id": state},
        {"$set": {
            "google_tokens": tokens,
            "google_calendar_connected": True
        }}
    )
    
    # Return success and close popup
    frontend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000').replace('/api', '')
    return Response(
        content=f"<script>window.opener.postMessage({{type: 'GOOGLE_CALENDAR_SUCCESS'}}, '*'); window.close();</script>",
        media_type="text/html"
    )

@api_router.get("/calendar/events")
async def get_calendar_events(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get Google Calendar events for a specific date or today"""
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
    if not user or not user.get("google_tokens"):
        raise HTTPException(status_code=400, detail="Google Calendar not connected")
    
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from google.auth.transport.requests import Request as GoogleRequest
        
        tokens = user["google_tokens"]
        creds = Credentials(
            token=tokens.get('access_token'),
            refresh_token=tokens.get('refresh_token'),
            token_uri='https://oauth2.googleapis.com/token',
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET
        )
        
        # Refresh if expired
        if creds.expired and creds.refresh_token:
            creds.refresh(GoogleRequest())
            await db.users.update_one(
                {"user_id": current_user["user_id"]},
                {"$set": {"google_tokens.access_token": creds.token}}
            )
        
        service = build('calendar', 'v3', credentials=creds)
        
        # Default to today if no date provided
        if not date:
            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        date_start = f"{date}T00:00:00Z"
        date_end = f"{date}T23:59:59Z"
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=date_start,
            timeMax=date_end,
            singleEvents=True,
            orderBy='startTime',
            maxResults=50
        ).execute()
        
        events = []
        for event in events_result.get('items', []):
            start = event['start'].get('dateTime', event['start'].get('date', ''))
            end = event['end'].get('dateTime', event['end'].get('date', ''))
            
            events.append({
                "id": event.get('id'),
                "title": event.get('summary', 'Untitled Event'),
                "start": start,
                "end": end,
                "is_all_day": 'date' in event['start'],
                "color": event.get('colorId', '#8B5CF6')
            })
        
        return {"date": date, "events": events}
        
    except Exception as e:
        logging.error(f"Failed to fetch calendar events: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")

@api_router.delete("/calendar/disconnect")
async def disconnect_calendar(current_user: dict = Depends(get_current_user)):
    """Disconnect Google Calendar"""
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$unset": {"google_tokens": ""}, "$set": {"google_calendar_connected": False}}
    )
    return {"message": "Google Calendar disconnected"}

@api_router.get("/calendar/status")
async def get_calendar_status(current_user: dict = Depends(get_current_user)):
    """Check if Google Calendar is connected"""
    user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    return {
        "connected": bool(user and user.get("google_calendar_connected")),
        "has_tokens": bool(user and user.get("google_tokens"))
    }

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

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
