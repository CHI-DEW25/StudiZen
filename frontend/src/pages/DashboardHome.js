import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, tasksApi, pomodoroApi, aiApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import Leaderboard from '../components/Leaderboard';
import {
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Brain,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Timer,
  Flame,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const DashboardHome = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [burnoutCheck, setBurnoutCheck] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, dailyRes, tasksRes] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getDailyStats(7),
          tasksApi.getAll({ status: 'pending' }),
        ]);
        
        setOverview(overviewRes.data);
        setDailyStats(dailyRes.data);
        setRecentTasks(tasksRes.data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchAiAdvice = async () => {
    setIsAiLoading(true);
    try {
      const [adviceRes, burnoutRes] = await Promise.all([
        aiApi.getStudyCoach(),
        aiApi.checkBurnout(),
      ]);
      setAiAdvice(adviceRes.data);
      setBurnoutCheck(burnoutRes.data);
    } catch (error) {
      console.error('Error fetching AI advice:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const statCards = overview ? [
    {
      title: 'Tasks Completed',
      value: overview.tasks.completed,
      total: overview.tasks.total,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-gradient-to-br from-emerald-400/20 to-emerald-600/20',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    },
    {
      title: 'Focus Time',
      value: `${Math.round(overview.pomodoro.total_focus_time_minutes / 60)}h`,
      subtitle: 'this week',
      icon: Clock,
      color: 'text-violet-500',
      bgColor: 'bg-gradient-to-br from-violet-400/20 to-violet-600/20',
      iconBg: 'bg-gradient-to-br from-violet-400 to-violet-600',
    },
    {
      title: 'Active Goals',
      value: overview.goals.active,
      subtitle: `${overview.goals.completed} completed`,
      icon: Target,
      color: 'text-amber-500',
      bgColor: 'bg-gradient-to-br from-amber-400/20 to-amber-600/20',
      iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
    },
    {
      title: 'Productivity Score',
      value: `${overview.productivity_score}%`,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-gradient-to-br from-cyan-400/20 to-cyan-600/20',
      iconBg: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
    },
  ] : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card-strong rounded-xl p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-muted-foreground">
              {entry.name}: <span className="text-foreground font-medium">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-home">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold">
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Student'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your productivity overview for today
          </p>
        </div>
        <Button
          onClick={fetchAiAdvice}
          disabled={isAiLoading}
          className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30"
          data-testid="get-ai-advice-btn"
        >
          {isAiLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          Get AI Advice
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="glass-card rounded-2xl card-hover border-0"
            data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}
          >
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-2xl md:text-3xl font-bold font-mono text-foreground">
                {stat.value}
                {stat.total && (
                  <span className="text-muted-foreground text-lg">/{stat.total}</span>
                )}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <Card className="lg:col-span-2 glass-card rounded-2xl border-0 card-hover">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Focus Time This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="day" 
                    stroke="rgba(0,0,0,0.4)"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="rgba(0,0,0,0.4)"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="focus_time_minutes"
                    name="Focus (min)"
                    stroke="#8b5cf6"
                    fill="url(#focusGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Coach Card */}
        <Card className="glass-card rounded-2xl border-0 card-hover overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10" />
          <CardHeader className="relative">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              AI Study Coach
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-4">
            {aiAdvice ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiAdvice.advice}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-xl glass">
                    <p className="text-lg font-bold text-violet-600">{aiAdvice.data_summary.tasks_completed}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                  <div className="text-center p-3 rounded-xl glass">
                    <p className="text-lg font-bold text-cyan-600">{aiAdvice.data_summary.focus_time_hours}h</p>
                    <p className="text-xs text-muted-foreground">Focus</p>
                  </div>
                  <div className="text-center p-3 rounded-xl glass">
                    <p className="text-lg font-bold text-amber-600">{aiAdvice.data_summary.sessions_completed}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Brain className="w-12 h-12 text-violet-400/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Click "Get AI Advice" to receive personalized study tips
                </p>
              </div>
            )}

            {/* Burnout Warning */}
            {burnoutCheck && burnoutCheck.risk_level !== 'low' && (
              <div className={`p-4 rounded-xl ${
                burnoutCheck.risk_level === 'high' 
                  ? 'bg-rose-500/10 border border-rose-500/30' 
                  : 'bg-amber-500/10 border border-amber-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    burnoutCheck.risk_level === 'high' ? 'text-rose-500' : 'text-amber-500'
                  }`} />
                  <span className="font-medium text-sm">
                    {burnoutCheck.risk_level === 'high' ? 'High Burnout Risk' : 'Moderate Workload'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {burnoutCheck.warnings[0]}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card className="glass-card rounded-2xl border-0 card-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Pending Tasks</CardTitle>
            <Link to="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="rounded-lg" data-testid="view-all-tasks-btn">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div
                  key={task.task_id}
                  className="flex items-center gap-3 p-3 rounded-xl glass hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    task.priority === 'urgent' ? 'bg-rose-500' :
                    task.priority === 'high' ? 'bg-amber-500' :
                    task.priority === 'medium' ? 'bg-violet-500' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    {task.subject && (
                      <p className="text-xs text-muted-foreground">{task.subject}</p>
                    )}
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">All caught up! No pending tasks.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card rounded-2xl border-0 card-hover">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link to="/dashboard/tasks">
              <Button
                variant="outline"
                className="w-full h-auto py-6 rounded-xl glass border-0 hover:bg-white/60 dark:hover:bg-white/10 flex flex-col gap-2"
                data-testid="quick-add-task-btn"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-foreground">Add Task</span>
              </Button>
            </Link>
            <Link to="/dashboard/focus">
              <Button
                variant="outline"
                className="w-full h-auto py-6 rounded-xl glass border-0 hover:bg-white/60 dark:hover:bg-white/10 flex flex-col gap-2"
                data-testid="quick-start-focus-btn"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-white" />
                </div>
                <span className="text-foreground">Start Focus</span>
              </Button>
            </Link>
            <Link to="/dashboard/goals">
              <Button
                variant="outline"
                className="w-full h-auto py-6 rounded-xl glass border-0 hover:bg-white/60 dark:hover:bg-white/10 flex flex-col gap-2"
                data-testid="quick-set-goal-btn"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-foreground">Set Goal</span>
              </Button>
            </Link>
            <Link to="/dashboard/analytics">
              <Button
                variant="outline"
                className="w-full h-auto py-6 rounded-xl glass border-0 hover:bg-white/60 dark:hover:bg-white/10 flex flex-col gap-2"
                data-testid="quick-view-stats-btn"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-foreground">View Stats</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Section */}
      <Leaderboard currentUser={user} userStats={overview} />
    </div>
  );
};

export default DashboardHome;
