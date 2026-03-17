import React, { useState, useEffect, useCallback } from 'react';
import { plannerApi, calendarApi, tasksApi, goalsApi, aiApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Trash2,
  AlertTriangle,
  Target,
  BookOpen,
  GripVertical,
  Plus,
  Minus,
  Brain,
  Sun,
  Moon,
  Sunset,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// ============ DRAGGABLE BLOCK COMPONENT ============
const DraggableBlock = ({ block, onResize, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getBlockColor = (type) => {
    switch (type) {
      case 'focus': return 'bg-gradient-to-r from-primary/20 to-violet-500/20 border-primary/30';
      case 'break': return 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-cyan-500/30';
      case 'task': return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30';
      case 'goal': return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/30';
      case 'calendar': return 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30';
      default: return 'bg-secondary/30 border-white/10';
    }
  };

  const getBlockIcon = (type) => {
    switch (type) {
      case 'focus': return <Zap className="w-4 h-4 text-primary" />;
      case 'break': return <Coffee className="w-4 h-4 text-cyan-400" />;
      case 'task': return <CheckCircle className="w-4 h-4 text-amber-400" />;
      case 'goal': return <Target className="w-4 h-4 text-emerald-400" />;
      case 'calendar': return <CalendarIcon className="w-4 h-4 text-blue-400" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const duration = block.duration || 30;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative group rounded-xl border p-3 mb-2 ${getBlockColor(block.type)} ${
        isDragging ? 'shadow-xl ring-2 ring-primary z-50' : ''
      }`}
      data-testid={`block-${block.id}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex items-center justify-between pl-6">
        <div className="flex items-center gap-3">
          {getBlockIcon(block.type)}
          <div>
            <p className="font-medium text-sm">{block.title}</p>
            <p className="text-xs text-muted-foreground">
              {block.start_time} - {block.end_time} ({duration} min)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Resize buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onResize(block.id, -15)}
            disabled={duration <= 15}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-xs font-mono w-8 text-center">{duration}m</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onResize(block.id, 15)}
            disabled={duration >= 180}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete(block.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Priority indicator */}
      {block.priority && (
        <div className={`absolute right-2 top-2 w-2 h-2 rounded-full ${
          block.priority === 'urgent' ? 'bg-red-500' :
          block.priority === 'high' ? 'bg-amber-500' :
          block.priority === 'medium' ? 'bg-primary' : 'bg-muted'
        }`} />
      )}
    </motion.div>
  );
};

// ============ BLOCK OVERLAY (During drag) ============
const BlockOverlay = ({ block }) => {
  if (!block) return null;
  
  return (
    <div className="bg-card/95 backdrop-blur border border-primary rounded-xl p-3 shadow-2xl">
      <div className="flex items-center gap-3">
        <Zap className="w-4 h-4 text-primary" />
        <div>
          <p className="font-medium text-sm">{block.title}</p>
          <p className="text-xs text-muted-foreground">
            {block.start_time} - {block.end_time}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN PLANNER COMPONENT ============
const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('daily');
  const [blocks, setBlocks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [energyLevels, setEnergyLevels] = useState({
    morning: 'high',
    afternoon: 'medium',
    evening: 'low',
  });
  const [calendarStatus, setCalendarStatus] = useState({ connected: false });
  const [showOverloadWarning, setShowOverloadWarning] = useState(false);
  const [overloadMessage, setOverloadMessage] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
    checkCalendarStatus();
  }, [dateString]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, goalsRes, scheduleRes] = await Promise.all([
        tasksApi.getAll({ status: 'pending' }),
        goalsApi.getAll(),
        plannerApi.getSchedule(dateString).catch(() => ({ data: null })),
      ]);
      
      setTasks(tasksRes.data || []);
      setGoals(goalsRes.data?.filter(g => !g.completed) || []);
      
      if (scheduleRes.data?.blocks) {
        setBlocks(scheduleRes.data.blocks.map((b, i) => ({
          ...b,
          id: b.id || `block_${i}_${Date.now()}`,
        })));
      } else {
        setBlocks([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCalendarStatus = async () => {
    try {
      const res = await calendarApi.getStatus();
      setCalendarStatus(res.data || { connected: false });
      
      if (res.data?.connected) {
        const eventsRes = await calendarApi.getEvents(dateString);
        setCalendarEvents(eventsRes.data || []);
      }
    } catch (error) {
      console.error('Failed to check calendar status:', error);
    }
  };

  const generateAISchedule = async () => {
    setIsGenerating(true);
    try {
      // Gather all data for AI
      const priorityTasks = tasks
        .filter(t => t.due_date?.startsWith(dateString) || t.priority === 'urgent' || t.priority === 'high')
        .slice(0, 10);
      
      const activeGoals = goals.slice(0, 5);

      const response = await plannerApi.generate({
        date: dateString,
        energy_levels: energyLevels,
        tasks: priorityTasks.map(t => ({
          task_id: t.task_id,
          title: t.title,
          priority: t.priority,
          estimated_time: t.estimated_time || 30,
          due_date: t.due_date,
          subject: t.subject,
        })),
        goals: activeGoals.map(g => ({
          goal_id: g.goal_id,
          title: g.title,
          progress: g.progress,
        })),
        calendar_events: calendarEvents,
      });

      if (response.data) {
        const newBlocks = response.data.blocks.map((b, i) => ({
          ...b,
          id: `block_${i}_${Date.now()}`,
        }));
        setBlocks(newBlocks);
        
        // Check for overload
        const totalMinutes = newBlocks.reduce((acc, b) => acc + (b.duration || 30), 0);
        if (totalMinutes > 480) {
          setOverloadMessage(`You have ${Math.round(totalMinutes / 60)}h of work scheduled. Consider reducing some blocks.`);
          setShowOverloadWarning(true);
        }
        
        toast.success('AI schedule generated! You can drag blocks to reorder them.');
        
        // Save the schedule
        await plannerApi.saveSchedule({
          date: dateString,
          blocks: newBlocks,
        });
      }
    } catch (error) {
      toast.error('Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchAISuggestions = async () => {
    setIsAiLoading(true);
    try {
      const response = await aiApi.getFocusPatterns();
      setAiSuggestions(response.data);
    } catch (error) {
      toast.error('Failed to get AI suggestions');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle drag events
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Recalculate times based on new order
        let currentTime = 8 * 60; // Start at 8:00 AM
        const updatedItems = newItems.map((item) => {
          const startHour = Math.floor(currentTime / 60);
          const startMin = currentTime % 60;
          const duration = item.duration || 30;
          const endTime = currentTime + duration;
          const endHour = Math.floor(endTime / 60);
          const endMin = endTime % 60;
          
          currentTime = endTime;
          
          return {
            ...item,
            start_time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
            end_time: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
          };
        });
        
        // Save updated schedule
        plannerApi.saveSchedule({
          date: dateString,
          blocks: updatedItems,
        }).catch(console.error);
        
        return updatedItems;
      });
      
      toast.success('Block moved! Schedule updated.');
    }
  };

  const handleResizeBlock = async (blockId, delta) => {
    setBlocks((items) => {
      const newItems = items.map((item) => {
        if (item.id === blockId) {
          const newDuration = Math.max(15, Math.min(180, (item.duration || 30) + delta));
          return { ...item, duration: newDuration };
        }
        return item;
      });
      
      // Recalculate end times
      let currentTime = 8 * 60;
      const updatedItems = newItems.map((item) => {
        const startHour = Math.floor(currentTime / 60);
        const startMin = currentTime % 60;
        const duration = item.duration || 30;
        const endTime = currentTime + duration;
        const endHour = Math.floor(endTime / 60);
        const endMin = endTime % 60;
        
        currentTime = endTime;
        
        return {
          ...item,
          start_time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
          end_time: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
        };
      });
      
      // Save
      plannerApi.saveSchedule({
        date: dateString,
        blocks: updatedItems,
      }).catch(console.error);
      
      return updatedItems;
    });
  };

  const handleDeleteBlock = async (blockId) => {
    setBlocks((items) => {
      const newItems = items.filter((item) => item.id !== blockId);
      
      // Recalculate times
      let currentTime = 8 * 60;
      const updatedItems = newItems.map((item) => {
        const startHour = Math.floor(currentTime / 60);
        const startMin = currentTime % 60;
        const duration = item.duration || 30;
        const endTime = currentTime + duration;
        const endHour = Math.floor(endTime / 60);
        const endMin = endTime % 60;
        
        currentTime = endTime;
        
        return {
          ...item,
          start_time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
          end_time: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
        };
      });
      
      // Save
      plannerApi.saveSchedule({
        date: dateString,
        blocks: updatedItems,
      }).catch(console.error);
      
      return updatedItems;
    });
    
    toast.success('Block removed');
  };

  const addQuickBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type,
      title: type === 'focus' ? 'Focus Session' : type === 'break' ? 'Break' : 'New Block',
      duration: type === 'break' ? 15 : 30,
      start_time: '08:00',
      end_time: '08:30',
    };
    
    setBlocks((prev) => {
      const newItems = [...prev, newBlock];
      
      // Recalculate times
      let currentTime = 8 * 60;
      return newItems.map((item) => {
        const startHour = Math.floor(currentTime / 60);
        const startMin = currentTime % 60;
        const duration = item.duration || 30;
        const endTime = currentTime + duration;
        const endHour = Math.floor(endTime / 60);
        const endMin = endTime % 60;
        
        currentTime = endTime;
        
        return {
          ...item,
          start_time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
          end_time: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
        };
      });
    });
  };

  const navigateDate = (direction) => {
    setSelectedDate((prev) => addDays(prev, direction));
  };

  const totalWorkMinutes = blocks
    .filter(b => b.type !== 'break')
    .reduce((acc, b) => acc + (b.duration || 30), 0);

  const totalBreakMinutes = blocks
    .filter(b => b.type === 'break')
    .reduce((acc, b) => acc + (b.duration || 15), 0);

  const activeBlock = activeId ? blocks.find(b => b.id === activeId) : null;

  const EnergyIcon = ({ level }) => {
    switch (level) {
      case 'high': return <BatteryFull className="w-4 h-4 text-green-400" />;
      case 'medium': return <Battery className="w-4 h-4 text-yellow-400" />;
      case 'low': return <BatteryLow className="w-4 h-4 text-red-400" />;
      default: return <Battery className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="planner-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Smart Planner</h1>
          <p className="text-muted-foreground">AI-powered scheduling with drag & drop</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Navigation */}
          <div className="flex items-center gap-2 bg-card/50 rounded-xl p-1 border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate(-1)}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-8 px-3 rounded-lg font-medium">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(selectedDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) setSelectedDate(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate(1)}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateAISchedule}
            disabled={isGenerating}
            className="rounded-xl glow-primary"
            data-testid="generate-schedule-btn"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate AI Schedule
          </Button>
        </div>
      </div>

      {/* Overload Warning */}
      <AnimatePresence>
        {showOverloadWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-amber-500/10 border-amber-500/30 rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-sm text-amber-200">{overloadMessage}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOverloadWarning(false)}
                  className="text-amber-400"
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Schedule Timeline */}
        <div className="lg:col-span-8">
          <Card className="bg-card/50 border-white/10 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/10 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Today's Schedule
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuickBlock('focus')}
                    className="rounded-lg"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Focus
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuickBlock('break')}
                    className="rounded-lg"
                  >
                    <Coffee className="w-4 h-4 mr-1" />
                    Break
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {blocks.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      <AnimatePresence>
                        {blocks.map((block) => (
                          <DraggableBlock
                            key={block.id}
                            block={block}
                            onResize={handleResizeBlock}
                            onDelete={handleDeleteBlock}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    <BlockOverlay block={activeBlock} />
                  </DragOverlay>
                </DndContext>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No schedule yet</p>
                  <p className="text-sm mt-1">Click "Generate AI Schedule" to create an optimized plan</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <Card className="bg-card/50 border-white/10 rounded-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-mono text-primary">
                  {Math.floor(totalWorkMinutes / 60)}h {totalWorkMinutes % 60}m
                </p>
                <p className="text-xs text-muted-foreground">Total Work</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/10 rounded-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-mono text-cyan-400">
                  {totalBreakMinutes}m
                </p>
                <p className="text-xs text-muted-foreground">Break Time</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/10 rounded-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-mono text-amber-400">
                  {blocks.filter(b => b.type === 'task').length}
                </p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-white/10 rounded-xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-mono text-emerald-400">
                  {blocks.length}
                </p>
                <p className="text-xs text-muted-foreground">Blocks</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Energy Levels */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Battery className="w-5 h-5 text-green-400" />
                Energy Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'morning', label: 'Morning', icon: Sun, color: 'text-amber-400' },
                { key: 'afternoon', label: 'Afternoon', icon: Sunset, color: 'text-orange-400' },
                { key: 'evening', label: 'Evening', icon: Moon, color: 'text-violet-400' },
              ].map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                  <Select
                    value={energyLevels[key]}
                    onValueChange={(value) => setEnergyLevels(prev => ({ ...prev, [key]: value }))}
                  >
                    <SelectTrigger className="w-28 h-8 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <BatteryFull className="w-3 h-3 text-green-400" />
                          High
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Battery className="w-3 h-3 text-yellow-400" />
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <BatteryLow className="w-3 h-3 text-red-400" />
                          Low
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Insights
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAISuggestions}
                disabled={isAiLoading}
                className="h-7 rounded-lg"
              >
                {isAiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {aiSuggestions ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{aiSuggestions.analysis}</p>
                  {aiSuggestions.peak_hours?.length > 0 && (
                    <div className="p-3 rounded-xl bg-primary/10">
                      <p className="text-xs font-medium mb-2">Peak Focus Hours:</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions.peak_hours.map((h, i) => (
                          <Badge key={i} variant="secondary" className="rounded-full">
                            {h.hour}:00
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click refresh to get AI-powered scheduling insights
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Tasks ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2 pr-2">
                  {tasks.slice(0, 8).map((task) => (
                    <div
                      key={task.task_id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => {
                        const newBlock = {
                          id: `block_${Date.now()}`,
                          type: 'task',
                          title: task.title,
                          duration: task.estimated_time || 30,
                          priority: task.priority,
                          task_id: task.task_id,
                          start_time: '08:00',
                          end_time: '08:30',
                        };
                        setBlocks(prev => [...prev, newBlock]);
                        toast.success(`Added "${task.title}" to schedule`);
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'urgent' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-amber-500' :
                        task.priority === 'medium' ? 'bg-primary' : 'bg-muted'
                      }`} />
                      <span className="text-sm flex-1 truncate">{task.title}</span>
                      {task.is_overdue && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1">Late</Badge>
                      )}
                      <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending tasks
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Goals */}
          {goals.length > 0 && (
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-violet-400" />
                  Goals ({goals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {goals.slice(0, 4).map((goal) => (
                    <div key={goal.goal_id} className="p-2 rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate pr-2">{goal.title}</span>
                        <span className="text-xs text-muted-foreground">{Math.round(goal.progress || 0)}%</span>
                      </div>
                      <Progress value={goal.progress || 0} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Google Calendar Status */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className={`w-5 h-5 ${calendarStatus.connected ? 'text-green-400' : 'text-muted-foreground'}`} />
                  <span className="text-sm">Google Calendar</span>
                </div>
                <Badge variant={calendarStatus.connected ? 'default' : 'secondary'}>
                  {calendarStatus.connected ? 'Connected' : 'Not connected'}
                </Badge>
              </div>
              {calendarEvents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-muted-foreground mb-2">{calendarEvents.length} events today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Planner;
