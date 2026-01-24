import React, { useState, useEffect } from 'react';
import { tasksApi, aiApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [aiBreakdown, setAiBreakdown] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    priority: 'medium',
    due_date: null,
    estimated_time: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await tasksApi.getAll();
      setTasks(response.data);
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
        due_date: formData.due_date ? format(formData.due_date, 'dd-MM-yyyy') : null,
        estimated_time: formData.estimated_time ? parseInt(formData.estimated_time) : null,
      };

      if (editingTask) {
        await tasksApi.update(editingTask.task_id, taskData);
        toast.success('Task updated');
      } else {
        await tasksApi.create(taskData);
        toast.success('Task created');
      }
      
      fetchTasks();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await tasksApi.update(task.task_id, { status: newStatus });
      fetchTasks();
      toast.success(newStatus === 'Completed' ? 'Task completed!' : 'Task reopened');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await tasksApi.delete(taskId);
      fetchTasks();
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
        });
      }
      fetchTasks();
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
    });
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true;
    if (filter === 'Completed') return task.status === 'Completed';
    if (filter === 'Pending') return task.status !== 'Completed';
    return task.priority === filter;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-destructive bg-destructive/10';
      case 'high': return 'text-amber bg-amber/10';
      case 'medium': return 'text-primary bg-primary/10';
      default: return 'text-muted-foreground bg-muted/10';
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
          <DialogContent className="rounded-2xl max-w-md">
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['Pending', 'Completed', 'In Progress', 'All'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="rounded-full capitalize"
            data-testid={`filter-${f}-btn`}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card
              key={task.task_id}
              className={`bg-card/50 border-white/10 rounded-2xl transition-all ${
                task.status === 'Completed' ? 'opacity-60' : ''
              }`}
              data-testid={`task-card-${task.task_id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={task.status === 'Completed'}
                    onCheckedChange={() => handleToggleComplete(task)}
                    className="mt-1 rounded-md"
                    data-testid={`task-checkbox-${task.task_id}`}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-medium ${
                          task.status === 'Completed' ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {task.title}
                        </h3>
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.subject && (
                        <span className="px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                          {task.subject}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.estimated_time && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {task.estimated_time} min
                        </span>
                      )}
                    </div>
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
                {filter === 'all' ? 'Create your first task to get started' : 'No tasks match this filter'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Tasks;