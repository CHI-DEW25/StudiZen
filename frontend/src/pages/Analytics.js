import React, { useState, useEffect } from 'react';
import { analyticsApi, aiApi, tasksApi, goalsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Loader2,
  Calendar,
  Flame,
  Award,
  AlertTriangle,
  Sparkles,
  Activity,
  BarChart3,
  PieChartIcon,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [studyCoach, setStudyCoach] = useState(null);
  const [burnoutCheck, setBurnoutCheck] = useState(null);
  const [focusPatterns, setFocusPatterns] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [isBurnoutLoading, setIsBurnoutLoading] = useState(false);
  const [isPatternsLoading, setIsPatternsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, dailyRes, tasksRes, goalsRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getDailyStats(14),
        tasksApi.getAll(),
        goalsApi.getAll(),
      ]);
      setOverview(overviewRes.data);
      setDailyStats(dailyRes.data);
      setTasks(tasksRes.data || []);
      setGoals(goalsRes.data || []);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyReport = async () => {
    setIsReportLoading(true);
    try {
      const response = await aiApi.getWeeklySummary();
      setWeeklyReport(response.data);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsReportLoading(false);
    }
  };

  const fetchStudyCoach = async () => {
    setIsCoachLoading(true);
    try {
      const response = await aiApi.getStudyCoach();
      setStudyCoach(response.data);
    } catch (error) {
      toast.error('Failed to get AI advice');
    } finally {
      setIsCoachLoading(false);
    }
  };

  const fetchBurnoutCheck = async () => {
    setIsBurnoutLoading(true);
    try {
      const response = await aiApi.checkBurnout();
      setBurnoutCheck(response.data);
    } catch (error) {
      toast.error('Failed to check burnout');
    } finally {
      setIsBurnoutLoading(false);
    }
  };

  const fetchFocusPatterns = async () => {
    setIsPatternsLoading(true);
    try {
      const response = await aiApi.getFocusPatterns();
      setFocusPatterns(response.data);
    } catch (error) {
      toast.error('Failed to analyze patterns');
    } finally {
      setIsPatternsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur border border-white/10 rounded-xl p-3 shadow-lg">
          <p className="text-sm font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const pieColors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(142, 76%, 36%)'];
  const taskStatusColors = ['#22c55e', '#3b82f6', '#ef4444'];

  // Calculate additional metrics
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.is_overdue).length;
  const completedGoals = goals.filter(g => g.completed).length;
  const activeGoals = goals.filter(g => !g.completed).length;

  const taskStatusData = [
    { name: 'Completed', value: completedTasks, fill: '#22c55e' },
    { name: 'Pending', value: pendingTasks - overdueTasks, fill: '#3b82f6' },
    { name: 'Overdue', value: overdueTasks, fill: '#ef4444' },
  ];

  const goalProgressData = goals.slice(0, 5).map(g => ({
    name: g.title.substring(0, 20) + (g.title.length > 20 ? '...' : ''),
    progress: g.progress || 0,
    fill: g.completed ? '#22c55e' : 'hsl(var(--primary))',
  }));

  // Priority breakdown
  const priorityData = [
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length, fill: '#ef4444' },
    { name: 'High', value: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length, fill: '#f59e0b' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium' && t.status !== 'completed').length, fill: '#3b82f6' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low' && t.status !== 'completed').length, fill: '#6b7280' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="analytics-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground">Track your productivity and get AI-powered insights</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchData}
            className="rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-card/50 rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg">
            <CheckCircle className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="focus" className="rounded-lg">
            <Clock className="w-4 h-4 mr-2" />
            Focus
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg">
            <Brain className="w-4 h-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Productivity Score */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-violet-500/10 border-primary/20 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Award className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Productivity Score</p>
                    <p className="text-3xl font-bold font-mono text-primary">{overview?.productivity_score || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Task Completion</p>
                    <p className="text-3xl font-bold font-mono">{overview?.tasks?.completion_rate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Clock className="w-7 h-7 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Focus Time</p>
                    <p className="text-3xl font-bold font-mono">
                      {Math.round((overview?.pomodoro?.total_focus_time_minutes || 0) / 60)}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Target className="w-7 h-7 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Goals Progress</p>
                    <p className="text-3xl font-bold font-mono">{completedGoals}/{goals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Daily Activity (Last 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStats}>
                      <defs>
                        <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="focus_time_minutes"
                        name="Focus (min)"
                        stroke="hsl(var(--primary))"
                        fill="url(#focusGradient)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="tasks_completed"
                        name="Tasks"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Task Status Pie */}
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  Task Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {taskStatusData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tasks Completed vs Overdue */}
            <Card className="lg:col-span-2 bg-card/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Tasks: Completed vs Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="tasks_completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Priority Breakdown */}
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Priority Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priorityData.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{item.name}</span>
                        <span className="font-mono">{item.value}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${(item.value / (tasks.length || 1)) * 100}%`,
                            backgroundColor: item.fill 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {overdueTasks > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">{overdueTasks} overdue tasks</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Goal Progress */}
          {goals.length > 0 && (
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Goal Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goals.slice(0, 6).map((goal) => (
                    <div key={goal.goal_id} className="p-4 rounded-xl bg-secondary/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm truncate pr-2">{goal.title}</span>
                        {goal.completed && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      </div>
                      <Progress value={goal.progress || 0} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">{Math.round(goal.progress || 0)}% complete</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Focus Tab */}
        <TabsContent value="focus" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Focus Time Trend */}
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Focus Time Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="focus_time_minutes"
                        name="Focus (min)"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#06b6d4' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sessions Stats */}
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Pomodoro Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="pomodoro_sessions" name="Sessions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Focus Pattern Analysis */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Focus Pattern Analysis
              </CardTitle>
              <Button
                onClick={fetchFocusPatterns}
                disabled={isPatternsLoading}
                variant="outline"
                className="rounded-xl"
                data-testid="analyze-patterns-btn"
              >
                {isPatternsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {focusPatterns ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{focusPatterns.analysis}</p>
                    
                    <div className="mt-4 p-4 rounded-xl bg-primary/10">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Total sessions:</span>{' '}
                        <span className="font-mono font-bold">{focusPatterns.total_sessions}</span>
                      </p>
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">Total focus:</span>{' '}
                        <span className="font-mono font-bold">{Math.round(focusPatterns.total_focus_minutes / 60)}h {focusPatterns.total_focus_minutes % 60}m</span>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Peak Hours</h4>
                    <div className="space-y-2">
                      {focusPatterns.peak_hours?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                          <span className="font-mono">{item.hour}:00</span>
                          <span className="text-sm text-muted-foreground">{item.sessions} sessions</span>
                        </div>
                      ))}
                    </div>
                    
                    <h4 className="font-medium mt-4 mb-3">By Day of Week</h4>
                    <div className="flex gap-2">
                      {focusPatterns.day_breakdown?.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex-1 text-center p-2 rounded-lg bg-secondary/30"
                          title={`${item.minutes} minutes`}
                        >
                          <p className="text-xs text-muted-foreground">{item.day}</p>
                          <p className="font-mono text-sm">{Math.round(item.minutes / 60)}h</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Click "Analyze" to get AI-powered insights about your focus patterns</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI Study Coach */}
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Study Coach
                </CardTitle>
                <Button
                  onClick={fetchStudyCoach}
                  disabled={isCoachLoading}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  data-testid="get-advice-btn"
                >
                  {isCoachLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Get Advice'
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {studyCoach ? (
                  <div>
                    <p className="text-sm whitespace-pre-wrap">{studyCoach.advice}</p>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <p className="text-2xl font-bold font-mono text-primary">{studyCoach.data_summary?.tasks_completed}</p>
                        <p className="text-xs text-muted-foreground">Tasks Done</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold font-mono text-cyan-400">{studyCoach.data_summary?.focus_time_hours}h</p>
                        <p className="text-xs text-muted-foreground">Focus Time</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold font-mono text-amber-400">{studyCoach.data_summary?.sessions_completed}</p>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Get personalized study tips based on your data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Burnout Check */}
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Burnout Detection
                </CardTitle>
                <Button
                  onClick={fetchBurnoutCheck}
                  disabled={isBurnoutLoading}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  data-testid="check-burnout-btn"
                >
                  {isBurnoutLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Check Now'
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {burnoutCheck ? (
                  <div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                      burnoutCheck.risk_level === 'low' ? 'bg-green-500/10 text-green-400' :
                      burnoutCheck.risk_level === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {burnoutCheck.risk_level === 'low' ? <CheckCircle className="w-4 h-4" /> :
                       burnoutCheck.risk_level === 'medium' ? <AlertTriangle className="w-4 h-4" /> :
                       <AlertTriangle className="w-4 h-4" />}
                      <span className="font-medium capitalize">{burnoutCheck.risk_level} Risk</span>
                    </div>
                    
                    <ul className="space-y-2">
                      {burnoutCheck.warnings?.map((warning, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <p className="text-lg font-bold font-mono">{burnoutCheck.stats?.avg_daily_focus_minutes}m</p>
                        <p className="text-xs text-muted-foreground">Daily Avg</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold font-mono">{burnoutCheck.stats?.sessions_last_4_days}</p>
                        <p className="text-xs text-muted-foreground">Sessions (4d)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold font-mono text-red-400">{burnoutCheck.stats?.overdue_tasks}</p>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Check for signs of burnout and overwork</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Weekly Report */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-400" />
                AI Weekly Summary
              </CardTitle>
              <Button
                onClick={fetchWeeklyReport}
                disabled={isReportLoading}
                className="rounded-xl"
                data-testid="generate-report-btn"
              >
                {isReportLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Generate Report
              </Button>
            </CardHeader>
            <CardContent>
              {weeklyReport ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm whitespace-pre-wrap">{weeklyReport.summary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-primary/10 text-center">
                      <p className="text-3xl font-bold font-mono text-primary">{weeklyReport.stats?.tasks_completed}</p>
                      <p className="text-xs text-muted-foreground mt-1">Tasks Completed</p>
                    </div>
                    <div className="p-4 rounded-xl bg-cyan-500/10 text-center">
                      <p className="text-3xl font-bold font-mono text-cyan-400">{weeklyReport.stats?.focus_hours}h</p>
                      <p className="text-xs text-muted-foreground mt-1">Focus Hours</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 text-center">
                      <p className="text-3xl font-bold font-mono text-amber-400">{weeklyReport.stats?.sessions}</p>
                      <p className="text-xs text-muted-foreground mt-1">Sessions</p>
                    </div>
                    <div className="p-4 rounded-xl bg-violet-500/10 text-center">
                      <p className="text-3xl font-bold font-mono text-violet-400">{weeklyReport.stats?.xp_earned}</p>
                      <p className="text-xs text-muted-foreground mt-1">XP Earned</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Generate an AI-powered summary of your week</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
