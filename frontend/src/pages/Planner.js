import React, { useState, useEffect, useCallback } from 'react';
import { plannerApi, calendarApi, tasksApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
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
  Play,
  CheckCircle,
  RefreshCw,
  Info,
  Link2,
  Unlink,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, subDays, parseISO, isToday } from 'date-fns';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [energyLevel, setEnergyLevel] = useState('medium');
  const [calendarStatus, setCalendarStatus] = useState({ connected: false });
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [tasks, setTasks] = useState([]);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    fetchSchedule();
    fetchTasks();
    checkCalendarStatus();
  }, [dateString]);

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

  const fetchTasks = async () => {
    try {
      const res = await tasksApi.getAll({ status: 'pending' });
      setTasks(res.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
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

  const handleBlockReorder = async (newBlocks) => {
    // Update local state immediately for smooth UX
    setSchedule(prev => ({ ...prev, blocks: newBlocks }));
    
    // TODO: Implement backend reorder if needed
  };

  const navigateDate = (direction) => {
    setSelectedDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
  };

  const blocks = schedule?.blocks || [];
  const totalWorkMinutes = blocks
    .filter(b => b.type === 'task')
    .reduce((acc, b) => {
      const [startH, startM] = b.start.split(':').map(Number);
      const [endH, endM] = b.end.split(':').map(Number);
      return acc + (endH * 60 + endM) - (startH * 60 + startM);
    }, 0);

  const completedBlocks = blocks.filter(b => b.completed).length;
  const progress = blocks.length > 0 ? (completedBlocks / blocks.length) * 100 : 0;

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
          {/* Google Calendar Connection */}
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

      {/* Date Navigation & Controls */}
      <Card className="bg-card/50 border-border/10 rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate('prev')}
                className="rounded-xl"
                data-testid="prev-day-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEE, MMM d')}
                </span>
                {isToday(selectedDate) && (
                  <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                    Today
                  </span>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate('next')}
                className="rounded-xl"
                data-testid="next-day-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Energy Level */}
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

            {/* Generate Button */}
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
          </div>
        </CardContent>
      </Card>

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

      {/* Main Content */}
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
                    onClick={handleExplainSchedule}
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
                <div className="space-y-2">
                  <AnimatePresence>
                    {blocks.map((block, index) => (
                      <TimelineBlock
                        key={block.id}
                        block={block}
                        index={index}
                        onDelete={() => handleDeleteBlock(block.id)}
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
                    onClick={generateSchedule}
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

// Timeline Block Component
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
      transition={{ delay: index * 0.05 }}
      className={`group flex items-stretch gap-3 p-3 rounded-xl border-l-4 ${getBlockColor()} hover:scale-[1.01] transition-transform`}
      data-testid={`schedule-block-${block.id}`}
    >
      {/* Time */}
      <div className="flex flex-col justify-center min-w-[70px]">
        <span className="font-mono text-sm font-medium">{block.start}</span>
        <span className="font-mono text-xs text-muted-foreground">{block.end}</span>
      </div>

      {/* Content */}
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

      {/* Actions */}
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

      {/* Locked indicator */}
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
