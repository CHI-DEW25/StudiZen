import React, { useState, useEffect } from 'react';
import { plannerApi, calendarApi, tasksApi, goalsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import {
  Calendar as CalendarIcon,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Battery,
  BatteryLow,
  BatteryFull,
  Coffee,
  CheckCircle,
  Info,
  Link2,
  Unlink,
  Trash2,
  AlertTriangle,
  TrendingUp,
  LayoutGrid,
  List,
  Target,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  format, 
  addDays, 
  subDays, 
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfWeek, 
  endOfWeek, 
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isToday,
  isSameDay,
  isSameMonth,
  getDay,
  getDaysInMonth,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly, yearly
  const [schedule, setSchedule] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [energyLevel, setEnergyLevel] = useState('medium');
  const [calendarStatus, setCalendarStatus] = useState({ connected: false });
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showOverloadWarning, setShowOverloadWarning] = useState(false);
  const [overloadSuggestion, setOverloadSuggestion] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchSchedule();
    } else if (viewMode === 'weekly') {
      fetchWeeklyData();
    } else if (viewMode === 'monthly') {
      fetchMonthlyData();
    } else if (viewMode === 'yearly') {
      fetchYearlyData();
    }
    fetchTasks();
    fetchGoals();
    checkCalendarStatus();
  }, [dateString, viewMode]);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await plannerApi.getSchedule(dateString);
      setSchedule(res.data);
      if (res.data.energy_level) {
        setEnergyLevel(res.data.energy_level);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyData = async () => {
    setIsLoading(true);
    try {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const weekData = await Promise.all(
        days.map(async (day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          try {
            const res = await plannerApi.getSchedule(dayStr);
            const blocks = res.data.blocks || [];
            const taskBlocks = blocks.filter(b => b.type === 'task');
            const totalMinutes = taskBlocks.reduce((acc, b) => {
              const [startH, startM] = b.start.split(':').map(Number);
              const [endH, endM] = b.end.split(':').map(Number);
              return acc + (endH * 60 + endM) - (startH * 60 + startM);
            }, 0);
            
            return {
              date: day,
              dateStr: dayStr,
              blocks: blocks.length,
              taskBlocks: taskBlocks.length,
              totalMinutes,
              isOverloaded: totalMinutes > 480, // More than 8 hours
              schedule: res.data
            };
          } catch {
            return {
              date: day,
              dateStr: dayStr,
              blocks: 0,
              taskBlocks: 0,
              totalMinutes: 0,
              isOverloaded: false,
              schedule: null
            };
          }
        })
      );
      
      setWeeklyData(weekData);
      
      // Check for overload
      const overloadedDays = weekData.filter(d => d.isOverloaded);
      if (overloadedDays.length > 0) {
        checkOverloadAndSuggest(weekData);
      }
    } catch (error) {
      console.error('Failed to fetch weekly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    setIsLoading(true);
    try {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      
      // Get tasks with due dates in this month
      const tasksRes = await tasksApi.getAll();
      const allTasks = tasksRes.data || [];
      
      const daysInMonth = getDaysInMonth(selectedDate);
      const monthData = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        const day = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dueTasks = allTasks.filter(t => t.due_date && t.due_date.startsWith(dayStr));
        
        monthData.push({
          date: day,
          dateStr: dayStr,
          taskCount: dueTasks.length,
          tasks: dueTasks,
          isOverloaded: dueTasks.length > 5
        });
      }
      
      setMonthlyData(monthData);
    } catch (error) {
      console.error('Failed to fetch monthly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchYearlyData = async () => {
    setIsLoading(true);
    try {
      const tasksRes = await tasksApi.getAll();
      const allTasks = tasksRes.data || [];
      
      const months = eachMonthOfInterval({
        start: startOfYear(selectedDate),
        end: endOfYear(selectedDate)
      });
      
      const yearData = months.map(month => {
        const monthStr = format(month, 'yyyy-MM');
        const monthTasks = allTasks.filter(t => 
          t.due_date && t.due_date.startsWith(monthStr)
        );
        const completedTasks = monthTasks.filter(t => t.status === 'completed');
        
        return {
          month,
          monthStr,
          label: format(month, 'MMM'),
          totalTasks: monthTasks.length,
          completedTasks: completedTasks.length,
          completionRate: monthTasks.length > 0 
            ? Math.round((completedTasks.length / monthTasks.length) * 100) 
            : 0
        };
      });
      
      setYearlyData(yearData);
    } catch (error) {
      console.error('Failed to fetch yearly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await tasksApi.getAll({ status: 'pending' });
      setTasks(res.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await goalsApi.getAll();
      setGoals(res.data?.filter(g => !g.completed) || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  const checkCalendarStatus = async () => {
    try {
      const res = await calendarApi.getStatus();
      setCalendarStatus(res.data);
    } catch (error) {
      console.error('Failed to check calendar status:', error);
    }
  };

  const checkOverloadAndSuggest = async (weekData) => {
    const overloadedDays = weekData.filter(d => d.isOverloaded);
    const lightDays = weekData.filter(d => d.totalMinutes < 240 && !d.isOverloaded);
    
    if (overloadedDays.length > 0 && lightDays.length > 0) {
      const suggestion = `You have ${overloadedDays.length} overloaded day(s) (${overloadedDays.map(d => format(d.date, 'EEE')).join(', ')}) with more than 8 hours of work. Consider moving some tasks to ${lightDays.map(d => format(d.date, 'EEE')).join(' or ')} which have lighter schedules.`;
      setOverloadSuggestion(suggestion);
      setShowOverloadWarning(true);
    }
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    try {
      const res = await plannerApi.generateSchedule({
        date: dateString,
        energy_level: energyLevel,
        available_start: '09:00',
        available_end: '21:00',
        include_breaks: true,
        pomodoro_style: true,
      });
      setSchedule(res.data);
      toast.success('Schedule generated! 🎯');
    } catch (error) {
      toast.error('Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const res = await calendarApi.getAuthUrl();
      const popup = window.open(res.data.authorization_url, 'Google Calendar', 'width=600,height=700');
      
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'GOOGLE_CALENDAR_SUCCESS') {
          setCalendarStatus({ connected: true });
          toast.success('Google Calendar connected!');
          fetchSchedule();
        } else if (event.data.type === 'GOOGLE_CALENDAR_ERROR') {
          toast.error('Failed to connect calendar');
        }
      }, { once: true });
    } catch (error) {
      toast.error('Failed to get authorization URL');
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      await calendarApi.disconnect();
      setCalendarStatus({ connected: false });
      toast.success('Calendar disconnected');
    } catch (error) {
      toast.error('Failed to disconnect calendar');
    }
  };

  const handleExplainSchedule = async () => {
    try {
      const res = await plannerApi.explainSchedule(dateString);
      setExplanation(res.data.explanation);
      setShowExplanation(true);
    } catch (error) {
      toast.error('Failed to get explanation');
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      await plannerApi.deleteBlock(dateString, blockId);
      fetchSchedule();
      toast.success('Block removed');
    } catch (error) {
      toast.error('Failed to remove block');
    }
  };

  const navigateDate = (direction) => {
    if (viewMode === 'daily') {
      setSelectedDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
    } else if (viewMode === 'weekly') {
      setSelectedDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    } else if (viewMode === 'monthly') {
      setSelectedDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    } else if (viewMode === 'yearly') {
      setSelectedDate(prev => direction === 'next' ? addYears(prev, 1) : subYears(prev, 1));
    }
  };

  const getDateLabel = () => {
    if (viewMode === 'daily') {
      return isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEE, MMM d');
    } else if (viewMode === 'weekly') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else if (viewMode === 'monthly') {
      return format(selectedDate, 'MMMM yyyy');
    } else {
      return format(selectedDate, 'yyyy');
    }
  };

  const blocks = schedule?.blocks || [];
  const totalWorkMinutes = blocks
    .filter(b => b.type === 'task')
    .reduce((acc, b) => {
      const [startH, startM] = b.start.split(':').map(Number);
      const [endH, endM] = b.end.split(':').map(Number);
      return acc + (endH * 60 + endM) - (startH * 60 + startM);
    }, 0);

  const EnergyIcon = energyLevel === 'high' ? BatteryFull : energyLevel === 'low' ? BatteryLow : Battery;

  return (
    <div className="space-y-6" data-testid="planner-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Smart Planner</h1>
          <p className="text-muted-foreground">AI-powered daily schedule optimization</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {calendarStatus.connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnectCalendar}
              className="rounded-xl text-xs"
              data-testid="disconnect-calendar-btn"
            >
              <Unlink className="w-3 h-3 mr-1" />
              Disconnect Calendar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectCalendar}
              className="rounded-xl text-xs"
              data-testid="connect-calendar-btn"
            >
              <Link2 className="w-3 h-3 mr-1" />
              Connect Google Calendar
            </Button>
          )}
        </div>
      </div>

      {/* Overload Warning */}
      <AnimatePresence>
        {showOverloadWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-amber-500/10 border-amber-500/30 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-500">Overload Detected</p>
                    <p className="text-sm text-muted-foreground mt-1">{overloadSuggestion}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOverloadWarning(false)}
                    className="text-muted-foreground"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Navigation & Controls */}
      <Card className="bg-card/50 border-border/10 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* View Mode Selector */}
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32 rounded-xl" data-testid="view-mode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">
                    <span className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Daily
                    </span>
                  </SelectItem>
                  <SelectItem value="weekly">
                    <span className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      Weekly
                    </span>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Monthly
                    </span>
                  </SelectItem>
                  <SelectItem value="yearly">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Yearly
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate('prev')}
                className="rounded-xl"
                data-testid="prev-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] rounded-xl justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{getDateLabel()}</span>
                    {viewMode === 'daily' && isToday(selectedDate) && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                        Today
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate('next')}
                className="rounded-xl"
                data-testid="next-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Energy Level (Daily only) */}
            {viewMode === 'daily' && (
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <EnergyIcon className="w-4 h-4" />
                  Energy:
                </Label>
                <Select value={energyLevel} onValueChange={setEnergyLevel}>
                  <SelectTrigger className="w-32 rounded-xl" data-testid="energy-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <BatteryLow className="w-4 h-4 text-orange-500" />
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <Battery className="w-4 h-4 text-yellow-500" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <BatteryFull className="w-4 h-4 text-green-500" />
                        High
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Generate Button (Daily only) */}
            {viewMode === 'daily' && (
              <Button
                onClick={generateSchedule}
                disabled={isGenerating}
                className="rounded-xl glow-primary"
                data-testid="generate-schedule-btn"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Schedule
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content - View Dependent */}
      {viewMode === 'daily' && (
        <DailyView
          schedule={schedule}
          blocks={blocks}
          tasks={tasks}
          isLoading={isLoading}
          totalWorkMinutes={totalWorkMinutes}
          calendarStatus={calendarStatus}
          onGenerateSchedule={generateSchedule}
          onExplainSchedule={handleExplainSchedule}
          onDeleteBlock={handleDeleteBlock}
          isGenerating={isGenerating}
        />
      )}

      {viewMode === 'weekly' && (
        <WeeklyView
          weeklyData={weeklyData}
          isLoading={isLoading}
          selectedDate={selectedDate}
          onDayClick={(date) => {
            setSelectedDate(date);
            setViewMode('daily');
          }}
        />
      )}

      {viewMode === 'monthly' && (
        <MonthlyView
          monthlyData={monthlyData}
          isLoading={isLoading}
          selectedDate={selectedDate}
          onDayClick={(date) => {
            setSelectedDate(date);
            setViewMode('daily');
          }}
        />
      )}

      {viewMode === 'yearly' && (
        <YearlyView
          yearlyData={yearlyData}
          isLoading={isLoading}
          selectedDate={selectedDate}
          onMonthClick={(date) => {
            setSelectedDate(date);
            setViewMode('monthly');
          }}
        />
      )}

      {/* Explanation Dialog */}
      <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Schedule Explanation
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert">
            <p className="text-muted-foreground">{explanation}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ DAILY VIEW ============
const DailyView = ({ 
  schedule, 
  blocks, 
  tasks,
  goals,
  isLoading, 
  totalWorkMinutes, 
  calendarStatus,
  onGenerateSchedule,
  onExplainSchedule,
  onDeleteBlock,
  isGenerating
}) => {
  return (
    <>
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(totalWorkMinutes / 60 * 10) / 10}h</p>
                <p className="text-xs text-muted-foreground">Planned work</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blocks.filter(b => b.type === 'task').length}</p>
                <p className="text-xs text-muted-foreground">Task blocks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Coffee className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blocks.filter(b => b.type === 'break').length}</p>
                <p className="text-xs text-muted-foreground">Break blocks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blocks.filter(b => b.type === 'event').length}</p>
                <p className="text-xs text-muted-foreground">Calendar events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card className="bg-card/50 border-border/10 rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Daily Timeline
                </CardTitle>
                {schedule && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExplainSchedule}
                    className="text-xs"
                    data-testid="explain-schedule-btn"
                  >
                    <Info className="w-4 h-4 mr-1" />
                    Explain
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : blocks.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {blocks.map((block, index) => (
                      <TimelineBlock
                        key={block.id}
                        block={block}
                        index={index}
                        onDelete={() => onDeleteBlock(block.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No schedule yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate an AI-optimized schedule based on your tasks and energy level
                  </p>
                  <Button
                    onClick={onGenerateSchedule}
                    disabled={isGenerating}
                    className="rounded-xl"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Schedule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Today's Focus */}
          <Card className="bg-card/50 border-border/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blocks.filter(b => b.type === 'task').length > 0 ? (
                <div className="space-y-3">
                  {blocks.filter(b => b.type === 'task').slice(0, 3).map((block, i) => (
                    <div key={block.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      <span className="text-sm flex-1 truncate">{block.title}</span>
                      <span className="text-xs text-muted-foreground">{block.start}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Generate a schedule to see your focus tasks
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="bg-card/50 border-border/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Pending Tasks ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tasks.slice(0, 8).map((task) => (
                  <div
                    key={task.task_id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm flex-1 truncate">{task.title}</span>
                    {task.estimated_time && (
                      <span className="text-xs text-muted-foreground">{task.estimated_time}m</span>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calendar Status */}
          <Card className="bg-card/50 border-border/10 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    calendarStatus.connected ? 'bg-emerald-500/20' : 'bg-muted'
                  }`}>
                    <CalendarIcon className={`w-5 h-5 ${
                      calendarStatus.connected ? 'text-emerald-400' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Google Calendar</p>
                    <p className="text-xs text-muted-foreground">
                      {calendarStatus.connected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  calendarStatus.connected ? 'bg-emerald-500' : 'bg-muted-foreground'
                }`} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

// ============ WEEKLY VIEW ============
const WeeklyView = ({ weeklyData, isLoading, selectedDate, onDayClick }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalWeekMinutes = weeklyData.reduce((acc, d) => acc + d.totalMinutes, 0);
  const overloadedCount = weeklyData.filter(d => d.isOverloaded).length;

  return (
    <div className="space-y-6">
      {/* Weekly Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(totalWeekMinutes / 60)}h</p>
                <p className="text-xs text-muted-foreground">Total planned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weeklyData.reduce((acc, d) => acc + d.taskBlocks, 0)}</p>
                <p className="text-xs text-muted-foreground">Total blocks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(totalWeekMinutes / 60 / 7)}h</p>
                <p className="text-xs text-muted-foreground">Daily average</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-border/10 rounded-2xl ${overloadedCount > 0 ? 'bg-red-500/10' : 'bg-card/50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                overloadedCount > 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${overloadedCount > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{overloadedCount}</p>
                <p className="text-xs text-muted-foreground">Overloaded days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Grid */}
      <Card className="bg-card/50 border-border/10 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Week Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {weeklyData.map((day) => (
              <motion.div
                key={day.dateStr}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onDayClick(day.date)}
                className={`p-4 rounded-xl cursor-pointer transition-colors ${
                  isToday(day.date) 
                    ? 'bg-primary/20 border-2 border-primary' 
                    : day.isOverloaded 
                      ? 'bg-red-500/10 border border-red-500/30' 
                      : 'bg-secondary/30 hover:bg-secondary/50'
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">{format(day.date, 'EEE')}</p>
                <p className="text-lg font-bold">{format(day.date, 'd')}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">{Math.round(day.totalMinutes / 60)}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">{day.taskBlocks} tasks</span>
                  </div>
                </div>
                {day.isOverloaded && (
                  <div className="mt-2">
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Overload
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ MONTHLY VIEW ============
const MonthlyView = ({ monthlyData, isLoading, selectedDate, onDayClick }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstDayOfMonth = startOfMonth(selectedDate);
  const startingDayOfWeek = getDay(firstDayOfMonth);
  const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Adjust for Monday start

  const totalTasks = monthlyData.reduce((acc, d) => acc + d.taskCount, 0);
  const overloadedDays = monthlyData.filter(d => d.isOverloaded).length;

  return (
    <div className="space-y-6">
      {/* Monthly Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-xs text-muted-foreground">Tasks due</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{monthlyData.length}</p>
                <p className="text-xs text-muted-foreground">Days in month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-border/10 rounded-2xl ${overloadedDays > 0 ? 'bg-amber-500/10' : 'bg-card/50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                overloadedDays > 0 ? 'bg-amber-500/20' : 'bg-emerald-500/20'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${overloadedDays > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{overloadedDays}</p>
                <p className="text-xs text-muted-foreground">Busy days (5+ tasks)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-card/50 border-border/10 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Month Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for offset */}
            {Array.from({ length: adjustedStart }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {monthlyData.map((day) => (
              <motion.div
                key={day.dateStr}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDayClick(day.date)}
                className={`aspect-square p-2 rounded-xl cursor-pointer flex flex-col items-center justify-center transition-colors ${
                  isToday(day.date)
                    ? 'bg-primary/20 border-2 border-primary'
                    : day.isOverloaded
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : day.taskCount > 0
                        ? 'bg-secondary/50 hover:bg-secondary/70'
                        : 'bg-secondary/20 hover:bg-secondary/30'
                }`}
              >
                <span className="text-sm font-medium">{format(day.date, 'd')}</span>
                {day.taskCount > 0 && (
                  <span className={`text-xs mt-1 ${day.isOverloaded ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {day.taskCount} task{day.taskCount !== 1 ? 's' : ''}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ YEARLY VIEW ============
const YearlyView = ({ yearlyData, isLoading, selectedDate, onMonthClick }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalTasks = yearlyData.reduce((acc, m) => acc + m.totalTasks, 0);
  const totalCompleted = yearlyData.reduce((acc, m) => acc + m.completedTasks, 0);
  const avgCompletionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Yearly Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-xs text-muted-foreground">Total tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgCompletionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{format(selectedDate, 'yyyy')}</p>
                <p className="text-xs text-muted-foreground">Year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card className="bg-card/50 border-border/10 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Year Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {yearlyData.map((month) => (
              <motion.div
                key={month.monthStr}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onMonthClick(month.month)}
                className={`p-4 rounded-xl cursor-pointer transition-colors ${
                  isSameMonth(month.month, new Date())
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-secondary/30 hover:bg-secondary/50'
                }`}
              >
                <p className="text-lg font-bold">{month.label}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Tasks</span>
                    <span>{month.totalTasks}</span>
                  </div>
                  <Progress value={month.completionRate} className="h-1.5" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Done</span>
                    <span className="text-emerald-400">{month.completionRate}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ TIMELINE BLOCK ============
const TimelineBlock = ({ block, index, onDelete }) => {
  const [startH, startM] = block.start.split(':').map(Number);
  const [endH, endM] = block.end.split(':').map(Number);
  const duration = (endH * 60 + endM) - (startH * 60 + startM);

  const getBlockColor = () => {
    switch (block.type) {
      case 'task': return 'border-l-emerald-500 bg-emerald-500/10';
      case 'break': return 'border-l-amber-500 bg-amber-500/10';
      case 'event': return 'border-l-violet-500 bg-violet-500/10';
      default: return 'border-l-gray-500 bg-gray-500/10';
    }
  };

  const getTypeIcon = () => {
    switch (block.type) {
      case 'task': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'break': return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'event': return <CalendarIcon className="w-4 h-4 text-violet-400" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }}
      className={`group flex items-stretch gap-3 p-3 rounded-xl border-l-4 ${getBlockColor()} hover:scale-[1.01] transition-transform`}
      data-testid={`schedule-block-${block.id}`}
    >
      <div className="flex flex-col justify-center min-w-[70px]">
        <span className="font-mono text-sm font-medium">{block.start}</span>
        <span className="font-mono text-xs text-muted-foreground">{block.end}</span>
      </div>

      <div className="flex-1 flex items-center gap-3">
        {getTypeIcon()}
        <div className="flex-1">
          <p className="font-medium text-sm">{block.title}</p>
          <p className="text-xs text-muted-foreground">
            {duration} min • {block.type}
            {block.is_locked && ' • Locked'}
          </p>
        </div>
      </div>

      {!block.is_locked && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {block.is_locked && (
        <div className="flex items-center">
          <span className="text-xs text-violet-400 px-2 py-1 rounded-full bg-violet-500/10">
            Calendar
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default Planner;
