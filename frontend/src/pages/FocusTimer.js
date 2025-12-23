import React, { useState, useEffect, useRef, useCallback } from 'react';
import { pomodoroApi, tasksApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
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
} from 'lucide-react';
import { toast } from 'sonner';

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
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    fetchStats();
    
    // Create audio element for notifications
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdG2MkZaZnJmYm5mWko6DfHZ1c3J0dXV4e36Bg4WHi4+Sk5WZnZ6en52bmJWTkY+Mh4J+fHp4d3Z2dnh6fH+BhIiLjo+RlJibnZ6fn56cmpmXlZKPi4eDf3x7enl4d3h5e32Ag4aJjI+Rk5WYm52en5+fnpyamJaTkI2JhoN/fXt6eHd3eHl7foCDhoqNkJKUl5qcnp+fn56dnJqYlpOQjYqHhIB+fHp5eHh4eXt9gIOGiYyPkpSXmpydnp+fnp6cm5mWk5CNioeDgH58e3l4eHh5e32Ag4aJjI+SlJeam52en5+fnp2cmpmXlJGOi4eDgH58e3l4d3h5e32AgoaJjI+RlJeam52en5+fn56cm5mWlJGOi4eDgH58enl4eHh5fH6BhIeKjZCSlZibnZ6fn5+fnZybmZeTkI2KhoOAf314eHh4eXt+gYSHio2Qk5WYm52en5+fn56dnJqYlZKPjIiEgX98enl4eHh6fH6BhYiLjpGUl5qcnp+fn5+enZyamJWSkY6LiISBfnx6eHh4eXt9gIOGiYyPkpSXmpydnp+fn56dnJqYlpOQjYqHg4B+fHt5eHh4enx+gYSHio2QkpWYm52en5+fn56dnJqYlpKPjIqGg4B+fHp5eHh4ent+gYSHio2Qk5WYm52en5+fnp6dnJqYlZKPjIqGg4B+fHp5eHd4ent+gYSHioyPkpWYm52en5+fnp2cm5qYlZKPjIqGgn5+fHp4d3d5ent+gYWIi46RlJeam52en5+fnp2cm5mXlJGOi4eFgn9+fHp5eHh5e31/goWIi46RlJeam52en5+fnp2cm5mWk5CNioeEgX9+fHp5eHh5e31/goWIi46RlJeam52en5+fnp6dm5mXlJGOi4eDgH5+fHp4eHh6e31/goWIi46RlJeam52en5+fnp2cm5qXlJGOi4eDgH58fHp5eHh5e31/goWIi46RlJeam52en5+fnp2cmpmXlJGOi4eDgH58e3p5eHh5e32AgoaJjI+SlJeam52en5+fnp2cmpmWk5CNioeEgX98e3p5eHh5en2AgoaJjI+SlZibnZ6fn5+fnp2cmpmWk5CNioeEgH9+fHp5eHh5en1/goWIi46Rk5aZm52fn5+fnp2cm5mXlJGOioeDgH9+fHp5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWlJGOi4eDgH58e3p5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWlJGOi4eDgH58e3p4eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWk5CNi4eEgX98e3p5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWlJGOi4eDgH58e3p5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46Rk5aZnJ2fn5+fnp2cm5mWk5CNi4eDgH98e3p5eHh5e31/goWIi46RlJaZnJ2fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5en1/goWIi46RlJaZnJ2fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5en2AgoaJjI+SlZibnZ6fn5+fnp2cmpmWk5CNioeEgH98e3p5eHh5en1/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHh5e31/goWIi46RlJeam52fn5+fnp2cm5mWk5CNi4eDgH58e3p5eHg=');
    
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
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

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
          toast.success('Focus session complete! Time for a break.');
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100
    : ((focusDuration * 60 - timeLeft) / (focusDuration * 60)) * 100;

  return (
    <div className="space-y-6" data-testid="focus-timer-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold">Focus Timer</h1>
        <p className="text-muted-foreground">Stay focused with the Pomodoro technique</p>
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
                  max={60}
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
              <label className="text-sm font-medium mb-3 block">Link to Task (optional)</label>
              <Select value={selectedTask || ''} onValueChange={setSelectedTask}>
                <SelectTrigger className="rounded-xl" data-testid="task-select">
                  <SelectValue placeholder="Select a task to focus on" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No task</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.task_id} value={task.task_id}>
                      {task.title}
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
                <Flame className="w-5 h-5 text-primary" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-5xl font-bold font-mono text-primary" data-testid="sessions-today">
                  {sessionsToday}
                </p>
                <p className="text-sm text-muted-foreground mt-1">sessions completed</p>
              </div>
              <Progress value={(sessionsToday / 8) * 100} className="mt-4 h-2" />
              <p className="text-xs text-muted-foreground text-center mt-2">
                {Math.max(0, 8 - sessionsToday)} more to daily goal
              </p>
            </CardContent>
          </Card>

          {/* Weekly Stats */}
          {stats && (
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber" />
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
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-medium mb-3">Pomodoro Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Focus on one task at a time</li>
                <li>• Take breaks away from screen</li>
                <li>• Stretch during breaks</li>
                <li>• Stay hydrated</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
