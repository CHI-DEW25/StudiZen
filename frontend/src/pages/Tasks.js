import React, { useState, useEffect } from 'react';
import { tasksApi, goalsApi, aiApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Plus,
  Loader2,
  MoreVertical,
  Trash2,
  Edit,
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Tag,
  Filter,
  Sun,
  AlertTriangle,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [aiBreakdown, setAiBreakdown] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    priority: 'medium',
    due_date: null,
    estimated_time: '',
    linked_goal_id: '',
    tags: '',
  });

  useEffect(() => {
    fetchData();
  }, [showTodayOnly]);

  const fetchData = async () => {
    try {
      const [tasksRes, goalsRes] = await Promise.all([
        showTodayOnly ? tasksApi.getToday() : tasksApi.getAll(),
        goalsApi.getAll(),
      ]);
      setTasks(tasksRes.data);
      setGoals(goalsRes.data.filter(g => !g.completed));
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
        estimated_time: formData.estimated_time ? parseInt(formData.estimated_time) : null,
        linked_goal_id: formData.linked_goal_id || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      if (editingTask) {
        await tasksApi.update(editingTask.task_id, taskData);
        toast.success('Task updated');
      } else {
        await tasksApi.create(taskData);
        toast.success('Task created');
      }
      
      fetchData();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await tasksApi.update(task.task_id, { status: newStatus });
      fetchData();
      if (newStatus === 'completed') {
        toast.success('Task completed! +XP earned');
      } else {
        toast.success('Task reopened');
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksApi.update(task.task_id, { status: newStatus });
      fetchData();
      toast.success(`Status changed to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await tasksApi.delete(taskId);
      fetchData();
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      subject: task.subject || '',
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date) : null,
      estimated_time: task.estimated_time?.toString() || '',
      linked_goal_id: task.linked_goal_id || '',
      tags: task.tags?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  const handleAiBreakdown = async () => {
    if (!formData.title) {
      toast.error('Enter a task title first');
      return;
    }
    
    setIsAiLoading(true);
    try {
      const response = await aiApi.breakDownTask({
        task_title: formData.title,
        context: formData.description,
      });
      setAiBreakdown(response.data);
      setIsAiDialogOpen(true);
    } catch (error) {
      toast.error('Failed to get AI breakdown');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddSubtasks = async () => {
    if (!aiBreakdown?.subtasks) return;
    
    try {
      for (const subtask of aiBreakdown.subtasks) {
        await tasksApi.create({
          title: subtask.title,
          estimated_time: subtask.estimated_minutes,
          priority: formData.priority,
          subject: formData.subject,
          linked_goal_id: formData.linked_goal_id || null,
        });
      }
      fetchData();
      setIsAiDialogOpen(false);
      setAiBreakdown(null);
      toast.success('Subtasks added!');
    } catch (error) {
      toast.error('Failed to add subtasks');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: '',
      priority: 'medium',
      due_date: null,
      estimated_time: '',
      linked_goal_id: '',
      tags: '',
    });
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'in-progress') return task.status === 'in-progress';
    if (filter === 'overdue') return task.is_overdue;
    return task.priority === filter;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'medium': return 'text-primary bg-primary/10 border-primary/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/10';
      case 'in-progress': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const getLinkedGoalName = (goalId) => {
    const goal = goals.find(g => g.goal_id === goalId);
    return goal?.title || 'Unknown goal';
  };

  // Stats
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.is_overdue).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tasks-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your study tasks and assignments</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl glow-primary" data-testid="add-task-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingTask ? 'Edit Task' : 'New Task'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="rounded-xl"
                  required
                  data-testid="task-title-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more details..."
                  className="rounded-xl"
                  rows={3}
                  data-testid="task-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Math"
                    className="rounded-xl"
                    data-testid="task-subject-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="rounded-xl" data-testid="task-priority-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start rounded-xl"
                        data-testid="task-due-date-btn"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {formData.due_date ? format(formData.due_date, 'PPP') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => setFormData({ ...formData, due_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimated_time">Est. Time (min)</Label>
                  <Input
                    id="estimated_time"
                    type="number"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                    placeholder="30"
                    className="rounded-xl"
                    data-testid="task-time-input"
                  />
                </div>
              </div>

              {/* Link to Goal */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Link to Goal (optional)
                </Label>
                <Select
                  value={formData.linked_goal_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, linked_goal_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="rounded-xl" data-testid="task-goal-select">
                    <SelectValue placeholder="Select a goal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No goal</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.goal_id} value={goal.goal_id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="homework, exam prep, reading"
                  className="rounded-xl"
                  data-testid="task-tags-input"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAiBreakdown}
                  disabled={isAiLoading || !formData.title}
                  className="rounded-xl"
                  data-testid="ai-breakdown-btn"
                >
                  {isAiLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  AI Breakdown
                </Button>
                <Button type="submit" className="flex-1 rounded-xl" data-testid="save-task-btn">
                  {editingTask ? 'Update' : 'Create'} Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Breakdown Dialog */}
      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Task Breakdown
            </DialogTitle>
          </DialogHeader>
          {aiBreakdown && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Breaking down: <span className="font-medium text-foreground">{aiBreakdown.original_task}</span>
              </p>
              <div className="space-y-2">
                {aiBreakdown.subtasks?.map((subtask, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                  >
                    <span className="text-sm">{subtask.title}</span>
                    <span className="text-xs text-muted-foreground">
                      ~{subtask.estimated_minutes} min
                    </span>
                  </div>
                ))}
              </div>
              <Button onClick={handleAddSubtasks} className="w-full rounded-xl" data-testid="add-subtasks-btn">
                Add All as Tasks
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono">{taskStats.total}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-green-400">{taskStats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-blue-400">{taskStats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-mono text-red-400">{taskStats.overdue}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'in-progress', 'completed', 'overdue'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="rounded-full capitalize"
              data-testid={`filter-${f}-btn`}
            >
              {f === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {f}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button
          variant={showTodayOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowTodayOnly(!showTodayOnly)}
          className="rounded-full"
          data-testid="today-filter-btn"
        >
          <Sun className="w-4 h-4 mr-2" />
          Today's Tasks
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card
              key={task.task_id}
              className={`bg-card/50 border-white/10 rounded-2xl transition-all hover:border-white/20 ${
                task.status === 'completed' ? 'opacity-60' : ''
              } ${task.is_overdue ? 'border-red-500/30' : ''}`}
              data-testid={`task-card-${task.task_id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => handleToggleComplete(task)}
                    className="mt-1 rounded-md"
                    data-testid={`task-checkbox-${task.task_id}`}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-medium ${
                            task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {task.title}
                          </h3>
                          {task.is_overdue && (
                            <Badge variant="destructive" className="h-5 text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`task-menu-${task.task_id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => handleEdit(task)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task, 'pending')}>
                            <Clock className="w-4 h-4 mr-2" />
                            Set Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task, 'in-progress')}>
                            <Loader2 className="w-4 h-4 mr-2" />
                            Set In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(task.task_id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      {task.subject && (
                        <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                          {task.subject}
                        </span>
                      )}
                      {task.linked_goal_id && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-violet-500/10 text-violet-400">
                          <Target className="w-3 h-3" />
                          {getLinkedGoalName(task.linked_goal_id)}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`flex items-center gap-1 text-xs ${task.is_overdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                          <CalendarIcon className="w-3 h-3" />
                          {task.due_date}
                        </span>
                      )}
                      {task.estimated_time && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {task.estimated_time} min
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-primary/40 mx-auto mb-4" />
              <h3 className="font-medium mb-1">No tasks found</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' && !showTodayOnly
                  ? 'Create your first task to get started'
                  : showTodayOnly
                  ? "No tasks scheduled for today"
                  : 'No tasks match this filter'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Tasks;
