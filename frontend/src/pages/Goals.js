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
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
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
        streak: 0,
        progress_logs: [],
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
      await goalsApi.update(goal.goal_id, { 
        completed: !goal.completed,
        progress: goal.completed ? goal.progress : 100,
      });
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
                className="bg-card/50 border-border/10 rounded-2xl hover:border-primary/30 transition-colors cursor-pointer"
                data-testid={`goal-card-${goal.goal_id}`}
                onClick={() => setSelectedGoal(goal)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="font-heading text-lg">{goal.title}</CardTitle>
                      {goal.streak > 0 && (
                        <span className="text-sm text-orange-500 flex items-center gap-1">
                          🔥 {goal.streak}
                        </span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                      <span className="font-medium">{Math.round(goal.progress || 0)}%</span>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    >
                      <Progress value={goal.progress || 0} className="h-2" />
                    </motion.div>
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
            <Trophy className="w-5 h-5 text-amber-500" />
            Completed ({completedGoals.length})
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <Card
                key={goal.goal_id}
                className="bg-card/30 border-border/5 rounded-2xl opacity-70"
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

      {/* Goal Detail Modal */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedGoal && (
            <GoalModal
              goal={selectedGoal}
              refresh={fetchData}
              close={() => setSelectedGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* --------------------------- MODAL -------------------------------- */
/* ------------------------------------------------------------------ */

function GoalModal({ goal, refresh, close }) {
  const [logMinutes, setLogMinutes] = useState("");
  const [logNote, setLogNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const subtasks = goal.subtasks || [];
  const logs = goal.progress_logs || [];

  const calculateProgress = (subs) => {
    if (!subs.length) return 0;
    const completed = subs.filter((s) => s.completed).length;
    return Math.round((completed / subs.length) * 100);
  };

  const toggleSubtask = async (id) => {
    const updated = subtasks.map((s) =>
      s.id === id ? { ...s, completed: !s.completed } : s
    );

    const progress = calculateProgress(updated);

    await goalsApi.update(goal.goal_id, {
      subtasks: updated,
      progress,
    });

    refresh();
  };

  const generateAISubtasks = async () => {
    setIsGenerating(true);
    try {
      const res = await goalsApi.breakdown(goal.goal_id, {
        goal: goal.title, 
        description: goal.description || "",
        completed: goal.completed,
        subtasks: goal.subtasks || [],
        progress: goal.progress || 0,
        progressLogs: goal.progress_logs || [],
        streak: goal.streak || 0,
        lastProgressDate: new Date().toISOString().split("T")[0]
      });

      const aiSubtasks = res.data.map((t) => ({
        id: crypto.randomUUID(),
        title: t.title,
        completed: false,
      }));

      await goalsApi.update(goal.goal_id, {
        subtasks: aiSubtasks,
        progress: 0,
      });

      toast.success('Goal broken into steps 🧠');
      refresh();
    } catch {
      toast.error('AI failed to generate steps');
    } finally {
      setIsGenerating(false);
    }
  };

  const logProgress = async () => {
    if (!logMinutes) {
      toast.error('Please enter minutes');
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const hasLoggedToday = logs.some((l) => l.date === today);

    const newLog = {
      date: today,
      minutes: Number(logMinutes),
      note: logNote,
    };

    const newStreak = hasLoggedToday ? goal.streak : (goal.streak || 0) + 1;

    await goalsApi.update(goal.goal_id, {
      progress_logs: [...logs, newLog],
      streak: newStreak,
    });

    toast.success('Progress logged 💪');
    setLogMinutes("");
    setLogNote("");
    refresh();
  };

  const markComplete = async () => {
    await goalsApi.update(goal.goal_id, {
      completed: !goal.completed,
      progress: goal.completed ? goal.progress : 100,
    });
    refresh();
    close();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl flex items-center justify-between">
          <span>{goal.title}</span>
          {goal.streak > 0 && (
            <span className="text-lg text-orange-500">🔥 {goal.streak}</span>
          )}
        </DialogTitle>
        {goal.description && (
          <p className="text-muted-foreground">{goal.description}</p>
        )}
      </DialogHeader>

      {/* PROGRESS */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span className="font-medium">{Math.round(goal.progress ?? 0)}%</span>
        </div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.6 }}
        >
          <Progress value={goal.progress ?? 0} className="h-3" />
        </motion.div>
      </div>

      {/* SUBTASKS */}
      <div className="space-y-3">
        <h4 className="font-medium">Steps</h4>

        {subtasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No steps yet. Break this goal down 👇
          </p>
        ) : (
          <div className="space-y-2">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => toggleSubtask(subtask.id)}
                />
                <span
                  className={
                    subtask.completed
                      ? "line-through text-muted-foreground text-sm"
                      : "text-sm"
                  }
                >
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button
          size="sm"
          variant="secondary"
          onClick={generateAISubtasks}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Break goal into steps (AI)
            </>
          )}
        </Button>
      </div>

      {/* DAILY LOG */}
      <div className="space-y-3 pt-2">
        <h4 className="font-medium">Log Today's Progress</h4>
        <div className="space-y-2">
          <Input
            placeholder="Minutes spent"
            type="number"
            value={logMinutes}
            onChange={(e) => setLogMinutes(e.target.value)}
            className="rounded-xl"
          />
          <Textarea
            placeholder="Optional note"
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            rows={2}
            className="rounded-xl"
          />
          <Button onClick={logProgress} className="w-full rounded-xl">
            Log Progress
          </Button>
        </div>
      </div>

      {/* LOG HISTORY */}
      {logs.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="font-medium">Recent History</h4>
          <div className="space-y-1 text-sm text-muted-foreground max-h-32 overflow-y-auto">
            {logs.slice(-5).reverse().map((l, i) => (
              <p key={i} className="p-2 rounded-lg bg-secondary/30">
                <span className="font-medium">{l.date}:</span> {l.minutes} min
                {l.note && ` – ${l.note}`}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={markComplete} className="rounded-xl">
          {goal.completed ? "Reopen Goal" : "Mark Complete"}
        </Button>
        <Button variant="ghost" onClick={close}>
          Close
        </Button>
      </div>

      {/* Easter egg */}
      {goal.progress === 100 && !goal.completed && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-green-500 pt-2"
        >
          🎉 Goal fully conquered. Mark it complete!
        </motion.p>
      )}
    </>
  );
}

export default Goals;
