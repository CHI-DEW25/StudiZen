import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, tasksApi, pomodoroApi, aiApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
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
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Focus Time',
      value: `${Math.round(overview.pomodoro.total_focus_time_minutes / 60)}h`,
      subtitle: 'this week',
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Goals',
      value: overview.goals.active,
      subtitle: `${overview.goals.completed} completed`,
      icon: Target,
      color: 'text-amber',
      bgColor: 'bg-amber/10',
    },
    {
      title: 'Productivity Score',
      value: `${overview.productivity_score}%`,
      icon: TrendingUp,
      color: 'text-cyan',
      bgColor: 'bg-cyan/10',
    },
  ] : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur border border-white/10 rounded-xl p-3 shadow-lg">
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
            Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] || 'Student'}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your productivity overview for today
          </p>
        </div>
        <Button
          onClick={fetchAiAdvice}
          disabled={isAiLoading}
          className="rounded-xl glow-primary"
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
            className="bg-card/50 border-white/10 rounded-2xl hover:border-primary/30 transition-colors"
            data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}
          >
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-2xl md:text-3xl font-bold font-mono">
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
        <Card className="lg:col-span-2 bg-card/50 border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Focus Time This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="focus_time_minutes"
                    name="Focus (min)"
                    stroke="hsl(var(--primary))"
                    fill="url(#focusGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Coach Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Study Coach
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiAdvice ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiAdvice.advice}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-lg font-bold text-primary">{aiAdvice.data_summary.tasks_completed}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-lg font-bold text-cyan">{aiAdvice.data_summary.focus_time_hours}h</p>
                    <p className="text-xs text-muted-foreground">Focus</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-lg font-bold text-amber">{aiAdvice.data_summary.sessions_completed}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Brain className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Click "Get AI Advice" to receive personalized study tips
                </p>
              </div>
            )}

            {/* Burnout Warning */}
            {burnoutCheck && burnoutCheck.risk_level !== 'low' && (
              <div className={`p-4 rounded-xl ${
                burnoutCheck.risk_level === 'high' 
                  ? 'bg-destructive/10 border border-destructive/30' 
                  : 'bg-amber/10 border border-amber/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    burnoutCheck.risk_level === 'high' ? 'text-destructive' : 'text-amber'
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
        <Card className="bg-card/50 border-white/10 rounded-2xl">
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'urgent' ? 'bg-destructive' :
                    task.priority === 'high' ? 'bg-amber' :
                    task.priority === 'medium' ? 'bg-primary' : 'bg-muted-foreground'
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
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link to="/dashboard/tasks">
              <Button
                variant="outline"
                className="w-full h-auto py-6 rounded-xl border-white/10 hover:border-primary/50 hover:bg-primary/5 flex flex-col gap-2"
                data-testid="quick-add-task-btn"
              >
                <CheckCircle className="w-6 h-6 text-primary" />
                <span>Add Task</span>
              </Button>
            </Link>
            <Link to="/dashboard/focus">
              <Button
                variant="outline"
                className="w-full h-auto py-6 rounded-xl border-white/10 hover:border-cyan/50 hover:bg-cyan/5 flex flex-col gap-2"
                data-testid="quick-start-focus-btn"
              >
                <Timer className="w-6 h-6 text-cyan" />
                <span>Start Focus</span>
              </Button>
            </Link>
            <Link to="/dashboard/goals">
              <Button
                variant="outline"
                className="w-full h-auto py-6 rounded-xl border-white/10 hover:border-amber/50 hover:bg-amber/5 flex flex-col gap-2"
                data-testid="quick-set-goal-btn"
              >
                <Target className="w-6 h-6 text-amber" />
                <span>Set Goal</span>
              </Button>
            </Link>
            <Link to="/dashboard/analytics">
              <Button
                variant="outline"
                className="w-full h-auto py-6 rounded-xl border-white/10 hover:border-rose/50 hover:bg-rose/5 flex flex-col gap-2"
                data-testid="quick-view-stats-btn"
              >
                <BarChart3 className="w-6 h-6 text-rose" />
                <span>View Stats</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
