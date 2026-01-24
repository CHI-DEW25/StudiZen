import React, { useState, useEffect } from 'react';
import { analyticsApi, aiApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
} from 'lucide-react';
import { toast } from 'sonner';

const Analytics = () => {
  const [overview, setOverview] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, dailyRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getDailyStats(7),
      ]);
      setOverview(overviewRes.data);
      setDailyStats(dailyRes.data);
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

  const pieColors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const taskData = [
    { name: 'Completed', value: overview?.tasks.completed || 0 },
    { name: 'Pending', value: (overview?.tasks.total || 0) - (overview?.tasks.completed || 0) - (overview?.tasks.overdue || 0) },
    { name: 'Overdue', value: overview?.tasks.overdue || 0 },
  ];

  return (
    <div className="space-y-6" data-testid="analytics-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your productivity and progress</p>
        </div>
        
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
          AI Weekly Report
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Productivity Score</p>
                <p className="text-2xl font-bold font-mono">{overview?.productivity_score}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold font-mono">{overview?.tasks.completion_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Focus Time</p>
                <p className="text-2xl font-bold font-mono">
                  {Math.round(overview?.pomodoro.total_focus_time_minutes / 60)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Sessions/Day</p>
                <p className="text-2xl font-bold font-mono">
                  {overview?.pomodoro.average_daily_sessions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Focus Time Chart */}
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Daily Focus Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
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
                  <Bar
                    dataKey="focus_time_minutes"
                    name="Focus (min)"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Completed Chart */}
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
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
                  <Line
                    type="monotone"
                    dataKey="tasks_completed"
                    name="Tasks"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Distribution & Weekly Report */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Task Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {taskData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: pieColors[index] }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="font-mono font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Weekly Report */}
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyReport ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">{weeklyReport.summary}</p>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary font-mono">
                      {weeklyReport.stats.tasks_completed}
                    </p>
                    <p className="text-xs text-muted-foreground">Tasks Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan font-mono">
                      {weeklyReport.stats.focus_hours}h
                    </p>
                    <p className="text-xs text-muted-foreground">Focus Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber font-mono">
                      {weeklyReport.stats.sessions}
                    </p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Click "AI Weekly Report" to get your personalized summary
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals Summary */}
      <Card className="bg-card/50 border-white/10 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-amber" />
            Goals Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Goals</span>
                <span className="font-mono font-bold text-primary">{overview?.goals.active}</span>
              </div>
              <Progress value={overview?.goals.active ? 50 : 0} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed Goals</span>
                <span className="font-mono font-bold text-emerald-500">{overview?.goals.completed}</span>
              </div>
              <Progress value={overview?.goals.completed ? 100 : 0} className="h-2 [&>div]:bg-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;