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
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-xl p-3 border border-border/10">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-muted-forground-400">
              {entry.name}: <span className="text-emerald-400 font-medium">{entry.value}</span>
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const statCards = overview ? [
    {
      title: 'Tasks Completed',
      value: overview.tasks.completed,
      total: overview.tasks.total,
      change: '+12%',
      isPositive: true,
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
    },
    {
      title: 'Focus Time',
      value: `${Math.round(overview.pomodoro.total_focus_time_minutes / 60)}h`,
      subtitle: 'this week',
      change: '+8%',
      isPositive: true,
      icon: Clock,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/20',
    },
    {
      title: 'Active Goals',
      value: overview.goals.active,
      subtitle: `${overview.goals.completed} done`,
      change: overview.goals.completed > 0 ? '+1' : '0',
      isPositive: overview.goals.completed > 0,
      icon: Target,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
    },
    {
      title: 'Productivity',
      value: `${overview.productivity_score}%`,
      subtitle: 'score',
      change: '+5%',
      isPositive: true,
      icon: TrendingUp,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20',
    },
  ] : [];

  return (
    <div className="space-y-8" data-testid="dashboard-home">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            Welcome back, <span className="text-gradient-green">{user?.name?.split(' ')[0] || 'Student'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your productivity overview for today
          </p>
        </div>
        <Button
          onClick={fetchAiAdvice}
          disabled={isAiLoading}
          className="btn-primary rounded-xl"
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

      {/* Stat Cards - Puzzle Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="glass-card glass-card-hover rounded-2xl p-6"
            data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center border border-border/5`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {stat.isPositive ? '↑' : '↓'} {stat.change}
              </div>
            </div>
            <p className="text-sm text-muted-foreground-500 mb-1">{stat.title}</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground font-mono">
              {stat.value}
              {stat.total && (
                <span className="text-muted-foreground-600 text-lg">/{stat.total}</span>
              )}
            </p>
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground-600 mt-1">{stat.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Focus Time This Week</h3>
              <p className="text-sm text-muted-foreground-500">Your daily productivity trends</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12% vs last week</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="day" 
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="focus_time_minutes"
                  name="Focus (min)"
                  stroke="#22c55e"
                  fill="url(#focusGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Coach Card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px]" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg glow-green">
                <Sparkles className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">AI Study Coach</h3>
                <p className="text-xs text-muted-foreground-500">Personalized insights</p>
              </div>
            </div>

            {aiAdvice ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground-400 leading-relaxed">
                  {aiAdvice.advice}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-xl bg-card border border-white/5">
                    <p className="text-lg font-bold text-emerald-400 font-mono">{aiAdvice.data_summary.tasks_completed}</p>
                    <p className="text-[10px] text-muted-foreground-500 uppercase">Tasks</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-card/5 border border-white/5">
                    <p className="text-lg font-bold text-violet-400 font-mono">{aiAdvice.data_summary.focus_time_hours}h</p>
                    <p className="text-[10px] text-muted-foreground-500 uppercase">Focus</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-card/5 border border-white/5">
                    <p className="text-lg font-bold text-amber-400 font-mono">{aiAdvice.data_summary.sessions_completed}</p>
                    <p className="text-[10px] text-muted-foreground-500 uppercase">Sessions</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Brain className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground-500">
                  Click "Get AI Advice" for personalized tips
                </p>
              </div>
            )}

            {/* Burnout Warning */}
            {burnoutCheck && burnoutCheck.risk_level !== 'low' && (
              <div className={`mt-4 p-4 rounded-xl ${
                burnoutCheck.risk_level === 'high' 
                  ? 'bg-red-500/10 border border-red-500/20' 
                  : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    burnoutCheck.risk_level === 'high' ? 'text-red-400' : 'text-amber-400'
                  }`} />
                  <span className="font-medium text-sm text-white">
                    {burnoutCheck.risk_level === 'high' ? 'High Burnout Risk' : 'Moderate Workload'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {burnoutCheck.warnings[0]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading text-lg font-semibold text-foreground">Pending Tasks</h3>
            <Link to="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="text-muted-foreground-400 hover:text-white rounded-lg" data-testid="view-all-tasks-btn">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div
                  key={task.task_id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card-foreground/5 border border-foreground/5 hover:bg-secondary-foreground/10 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-amber-500' :
                    task.priority === 'medium' ? 'bg-emerald-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{task.title}</p>
                    {task.subject && (
                      <p className="text-xs text-muted-foreground-500">{task.subject}</p>
                    )}
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground-500 bg-card-foreground/5 px-2 py-1 rounded-lg">
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground-600">All caught up! No pending tasks.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/dashboard/tasks">
              <button
                className="w-full p-6 rounded-xl bg-card-foreground/5 border border-foreground/5 hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all group"
                data-testid="quick-add-task-btn"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-foreground">Add Task</span>
              </button>
            </Link>
            <Link to="/dashboard/focus">
              <button
                className="w-full p-6 rounded-xl bg-card-foreground/5 border border-foreground/5 hover:bg-violet-500/10 hover:border-violet-500/20 transition-all group"
                data-testid="quick-start-focus-btn"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <Timer className="w-6 h-6 text-violet-400" />
                </div>
                <span className="text-sm font-medium text-foreground">Start Focus</span>
              </button>
            </Link>
            <Link to="/dashboard/goals">
              <button
                className="w-full p-6 rounded-xl bg-card-foreground/5 border border-border/5 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all group"
                data-testid="quick-set-goal-btn"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-foreground">Set Goal</span>
              </button>
            </Link>
            <Link to="/dashboard/analytics">
              <button
                className="w-full p-6 rounded-xl bg-card-foreground/5 border border-foreground/5 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all group"
                data-testid="quick-view-stats-btn"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-sm font-medium text-foreground">View Stats</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <Leaderboard currentUser={user} userStats={overview} />
    </div>
  );
};

export default DashboardHome;