import React, { useState, useEffect, useRef, useCallback } from 'react';
import { pomodoroApi, tasksApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Timer,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  Target,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const PRESETS = [
  { name: 'Classic', focus: 25, break: 5 },
  { name: 'Extended', focus: 50, break: 10 },
  { name: 'Short Burst', focus: 15, break: 3 },
  { name: 'Deep Work', focus: 90, break: 20 },
];

const FocusTimer = () => {
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [stats, setStats] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionsToday, setSessionsToday] = useState(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recentSessions, setRecentSessions] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(8);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchRecentSessions();
    
    // Create audio element for notifications
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdG2MkZaZnJmYm5mWko6DfHZ1c3J0dXV4e36Bg4WHi4+Sk5WZnZ6en52bmJWTkY+Mh4J+fHp4d3Z2dnh6fH+BhIiLjo+RlJibnZ6fn56cmpmXlZKPi4eDf3x7enl4d3h5e32Ag4aJjI+Rk5WYm52en5+fnpyamJaTkI2JhoN/fXt6eHd3eHl7foCDhoqNkJKUl5qcnp+fn56dnJqYlpOQjYqHhIB+fHp5eHh4eXt9gIOGiYyPkpSXmpydnp+fnp6cm5mWk5CNioeDgH58e3p5eHh4eXt9gIOGiYyPkpSXmpydnp+fnp6cm5mWlJGOi4eDgH58e3p5eHh5e32Ag4aJjI+RlJeam52en5+fnp2cmpmXlJGOi4eDgH58e3p5eHh5e32Ag4aJjI+RlJeam52en5+fn56cm5mWlJGOi4eDgH58e3l4eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWk5CNi4eEgX98e3p5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWlJGOi4eDgH58e3p5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWk5CNi4eDgH98e3p5eHh5e31/goWIi46RlJaZnJ2fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5en1/goWIi46RlJaZnJ2fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5en2AgoaJjI+SlZibnZ6fn5+fnp2cmpmWk5CNioeEgH98e3p5eHh5en1/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHg=');
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await tasksApi.getAll({ status: 'pending' });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await pomodoroApi.getStats();
      setStats(response.data);
      setSessionsToday(response.data.today_sessions);
      setTotalMinutesToday(response.data.today_sessions * focusDuration);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const response = await pomodoroApi.getSessions(7);
      setRecentSessions(response.data.slice(0, 10));
      
      // Calculate streak from sessions
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const completedDates = new Set(
        response.data
          .filter(s => s.completed)
          .map(s => new Date(s.started_at).toDateString())
      );
      
      let currentStreak = 0;
      let checkDate = new Date();
      while (completedDates.has(checkDate.toDateString())) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      }
      setStreak(currentStreak);
    } catch (error) {
      console.error('Failed to fetch sessions');
    }
  };

  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  const startTimer = async () => {
    if (!isRunning && !currentSession && !isBreak) {
      // Start new session
      try {
        const response = await pomodoroApi.start({
          focus_duration: focusDuration,
          break_duration: breakDuration,
          task_id: selectedTask,
        });
        setCurrentSession(response.data);
        toast.success('Focus session started! Stay concentrated.');
      } catch (error) {
        toast.error('Failed to start session');
        return;
      }
    }
    
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeLeft(isBreak ? breakDuration * 60 : focusDuration * 60);
  };

  const handleTimerComplete = useCallback(async () => {
    playSound();
    
    if (!isBreak) {
      // Focus session complete
      if (currentSession) {
        try {
          await pomodoroApi.complete(currentSession.session_id);
          setSessionsToday(prev => prev + 1);
          setTotalMinutesToday(prev => prev + focusDuration);
          toast.success(`Focus session complete! +25 XP earned. Time for a ${breakDuration} min break.`);
          fetchRecentSessions();
        } catch (error) {
          console.error('Failed to complete session');
        }
      }
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
      setCurrentSession(null);
    } else {
      // Break complete
      toast.success('Break over! Ready for another focus session?');
      setIsBreak(false);
      setTimeLeft(focusDuration * 60);
    }
  }, [isBreak, currentSession, breakDuration, focusDuration, playSound]);

  const applyPreset = (preset) => {
    if (isRunning) {
      toast.error('Stop the timer first to change presets');
      return;
    }
    setFocusDuration(preset.focus);
    setBreakDuration(preset.break);
    setTimeLeft(preset.focus * 60);
    toast.success(`Applied ${preset.name} preset`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100
    : ((focusDuration * 60 - timeLeft) / (focusDuration * 60)) * 100;

  const dailyProgress = (sessionsToday / dailyGoal) * 100;

  return (
    <div className="space-y-6" data-testid="focus-timer-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Focus Timer</h1>
          <p className="text-muted-foreground">Stay focused with the Pomodoro technique</p>
        </div>
        
        {/* Streak Badge */}
        {streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Flame className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-amber-400">{streak} day streak!</span>
          </div>
        )}
      </div>

      {/* Main Timer Card */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 border-white/10 rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            {/* Timer Display */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
                isBreak ? 'bg-cyan/10 text-cyan' : 'bg-primary/10 text-primary'
              }`}>
                {isBreak ? <Coffee className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {isBreak ? 'Break Time' : 'Focus Time'}
                </span>
                {selectedTask && !isBreak && (
                  <Badge variant="secondary" className="ml-2">
                    Working on task
                  </Badge>
                )}
              </div>
              
              <div className="relative w-64 h-64 mx-auto mb-8">
                {/* Circular progress background */}
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    fill="none"
                    stroke="hsl(var(--secondary))"
                    strokeWidth="8"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    fill="none"
                    stroke={isBreak ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 120}
                    strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                    className="transition-all duration-1000"
                  />
                </svg>
                
                {/* Time display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-6xl font-bold" data-testid="timer-display">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-sm text-muted-foreground mt-2">
                    {isBreak ? 'Take a breather' : 'Stay focused'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetTimer}
                  className="w-12 h-12 rounded-full"
                  data-testid="reset-timer-btn"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                
                <Button
                  size="lg"
                  onClick={isRunning ? pauseTimer : startTimer}
                  className={`w-20 h-20 rounded-full ${
                    isBreak ? 'bg-cyan hover:bg-cyan/90' : 'glow-primary'
                  }`}
                  data-testid="play-pause-btn"
                >
                  {isRunning ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="w-12 h-12 rounded-full"
                  data-testid="sound-toggle-btn"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className={`rounded-full ${
                    focusDuration === preset.focus && breakDuration === preset.break
                      ? 'bg-primary/20 border-primary'
                      : ''
                  }`}
                  disabled={isRunning}
                >
                  {preset.name} ({preset.focus}/{preset.break})
                </Button>
              ))}
            </div>

            {/* Timer Settings */}
            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Focus Duration</label>
                  <span className="text-sm text-muted-foreground">{focusDuration} min</span>
                </div>
                <Slider
                  value={[focusDuration]}
                  onValueChange={([value]) => {
                    setFocusDuration(value);
                    if (!isRunning && !isBreak) {
                      setTimeLeft(value * 60);
                    }
                  }}
                  min={5}
                  max={90}
                  step={5}
                  disabled={isRunning}
                  className="w-full"
                  data-testid="focus-duration-slider"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Break Duration</label>
                  <span className="text-sm text-muted-foreground">{breakDuration} min</span>
                </div>
                <Slider
                  value={[breakDuration]}
                  onValueChange={([value]) => {
                    setBreakDuration(value);
                    if (!isRunning && isBreak) {
                      setTimeLeft(value * 60);
                    }
                  }}
                  min={1}
                  max={30}
                  step={1}
                  disabled={isRunning}
                  className="w-full"
                  data-testid="break-duration-slider"
                />
              </div>
            </div>

            {/* Task Selection */}
            <div className="pt-6 border-t border-white/10 mt-6">
              <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                <Target className="w-4 h-4" />
                Link to Task (optional)
              </label>
              <Select value={selectedTask ?? "none"} onValueChange={(value) => setSelectedTask(value === "none" ? null : value)}>
                <SelectTrigger className="rounded-xl" data-testid="task-select">
                  <SelectValue placeholder="Select a task to focus on" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No task</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.task_id} value={task.task_id}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          task.priority === 'urgent' ? 'bg-red-400' :
                          task.priority === 'high' ? 'bg-amber-400' :
                          task.priority === 'medium' ? 'bg-primary' : 'bg-muted'
                        }`} />
                        {task.title}
                      </div>
                    </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Today's Progress */}
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 rounded-2xl">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-5xl font-bold font-mono text-primary" data-testid="sessions-today">
                  {sessionsToday}
                </p>
                <p className="text-sm text-muted-foreground mt-1">sessions completed</p>
              </div>
              <Progress value={Math.min(dailyProgress, 100)} className="h-2 mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{sessionsToday} / {dailyGoal} goal</span>
                <span>{Math.round(dailyProgress)}%</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total focus time</span>
                  <span className="font-mono font-bold">
                    {Math.floor(totalMinutesToday / 60)}h {totalMinutesToday % 60}m
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Stats */}
          {stats && (
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Sessions</span>
                  <span className="font-mono font-bold">{stats.week_sessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Focus Time</span>
                  <span className="font-mono font-bold">
                    {Math.round(stats.total_focus_time_minutes / 60)}h {stats.total_focus_time_minutes % 60}m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily Average</span>
                  <span className="font-mono font-bold">
                    {stats.average_daily_sessions.toFixed(1)} sessions
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Streak</span>
                  <span className="font-mono font-bold text-amber-400 flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {streak} days
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Sessions */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sessions yet. Start your first focus session!
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {recentSessions.map((session) => (
                    <div
                      key={session.session_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {session.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span>{session.focus_duration} min</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.started_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Pomodoro Tips
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Focus on one task at a time</li>
                <li>• Take breaks away from screen</li>
                <li>• Stretch during breaks</li>
                <li>• Stay hydrated</li>
                <li>• Complete 4 sessions for a long break</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
