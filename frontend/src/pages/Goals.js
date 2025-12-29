import React, { useState, useEffect } from 'react';
import { goalsApi, tasksApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Plus,
  Loader2,
  MoreVertical,
  Trash2,
  Edit,
  Target,
  CheckCircle,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek } from 'date-fns';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [goalsRes, tasksRes] = await Promise.all([
        goalsApi.getAll(),
        tasksApi.getAll(),
      ]);
      setGoals(goalsRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const goalData = {
        ...formData,
        target_tasks: selectedTasks,
        week_start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      };

      if (editingGoal) {
        await goalsApi.update(editingGoal.goal_id, goalData);
        toast.success('Goal updated');
      } else {
        await goalsApi.create(goalData);
        toast.success('Goal created');
      }
      
      fetchData();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save goal');
    }
  };

  const handleToggleComplete = async (goal) => {
    try {
      await goalsApi.update(goal.goal_id, { completed: !goal.completed });
      fetchData();
      toast.success(goal.completed ? 'Goal reopened' : 'Goal completed! 🎉');
    } catch (error) {
      toast.error('Failed to update goal');
    }
  };

  const handleDelete = async (goalId) => {
    try {
      await goalsApi.delete(goalId);
      fetchData();
      toast.success('Goal deleted');
    } catch (error) {
      toast.error('Failed to delete goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
    });
    setSelectedTasks(goal.target_tasks || []);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
    });
    setSelectedTasks([]);
    setEditingGoal(null);
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="goals-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Weekly Goals</h1>
          <p className="text-muted-foreground">Set and track your weekly objectives</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl glow-primary" data-testid="add-goal-btn">
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingGoal ? 'Edit Goal' : 'New Weekly Goal'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete Chapter 5 exercises"
                  className="rounded-xl"
                  required
                  data-testid="goal-title-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more details about this goal..."
                  className="rounded-xl"
                  rows={3}
                  data-testid="goal-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Link Tasks (optional)</Label>
                <div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-xl bg-secondary/30">
                  {tasks.filter(t => t.status !== 'completed').length > 0 ? (
                    tasks
                      .filter(t => t.status !== 'completed')
                      .map((task) => (
                        <div
                          key={task.task_id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer"
                          onClick={() => toggleTaskSelection(task.task_id)}
                        >
                          <Checkbox
                            checked={selectedTasks.includes(task.task_id)}
                            onCheckedChange={() => toggleTaskSelection(task.task_id)}
                          />
                          <span className="text-sm flex-1">{task.title}</span>
                          {task.subject && (
                            <span className="text-xs text-muted-foreground">{task.subject}</span>
                          )}
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending tasks available
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedTasks.length} task(s) selected
                </p>
              </div>

              <Button type="submit" className="w-full rounded-xl" data-testid="save-goal-btn">
                {editingGoal ? 'Update' : 'Create'} Goal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Active Goals ({activeGoals.length})
        </h2>
        
        {activeGoals.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <Card
                key={goal.goal_id}
                className="bg-card/50 border-white/10 rounded-2xl hover:border-primary/30 transition-colors"
                data-testid={`goal-card-${goal.goal_id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-heading text-lg">{goal.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`goal-menu-${goal.goal_id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => handleToggleComplete(goal)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(goal)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(goal.goal_id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(goal.progress)}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                  
                  {goal.target_tasks?.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {goal.target_tasks.length} linked task(s)
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-primary/40 mx-auto mb-4" />
              <h3 className="font-medium mb-1">No active goals</h3>
              <p className="text-sm text-muted-foreground">
                Set a weekly goal to stay focused on what matters
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber" />
            Completed ({completedGoals.length})
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <Card
                key={goal.goal_id}
                className="bg-card/30 border-white/5 rounded-2xl opacity-70"
                data-testid={`completed-goal-${goal.goal_id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium line-through">{goal.title}</h3>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(goal.goal_id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
