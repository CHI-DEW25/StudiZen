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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
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
  Star,
  Zap,
  Book,
  Heart,
  Briefcase,
  Folder,
  MessageSquare,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  ChevronRight,
  Circle,
  CheckCircle2,
  PartyPopper,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const CATEGORIES = [
  { value: 'academic', label: 'Academic', icon: Book, color: 'text-blue-500 bg-blue-500/10' },
  { value: 'personal', label: 'Personal', icon: Heart, color: 'text-pink-500 bg-pink-500/10' },
  { value: 'health', label: 'Health', icon: Zap, color: 'text-green-500 bg-green-500/10' },
  { value: 'career', label: 'Career', icon: Briefcase, color: 'text-purple-500 bg-purple-500/10' },
  { value: 'other', label: 'Other', icon: Folder, color: 'text-gray-500 bg-gray-500/10' },
];

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [review, setReview] = useState(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    deadline: '',
    xp_reward: 100,
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
        toast.success('Goal created! 🎯');
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
      const wasCompleted = goal.completed;
      await goalsApi.update(goal.goal_id, { 
        completed: !goal.completed,
        progress: goal.completed ? goal.progress : 100,
      });
      fetchData();
      
      if (!wasCompleted) {
        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('🎉 Goal completed! You earned XP!');
      } else {
        toast.success('Goal reopened');
      }
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
      category: goal.category || 'academic',
      deadline: goal.deadline || '',
      xp_reward: goal.xp_reward || 100,
    });
    setSelectedTasks(goal.target_tasks || []);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'academic',
      deadline: '',
      xp_reward: 100,
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

  const handleGetReview = async (goal) => {
    setIsLoadingReview(true);
    setShowReviewDialog(true);
    try {
      const res = await goalsApi.getReview(goal.goal_id);
      setReview(res.data);
    } catch (error) {
      toast.error('Failed to get review');
      setShowReviewDialog(false);
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleQuickProgress = async (goal, checked) => {
    try {
      if (checked) {
        const newProgress = Math.min((goal.progress || 0) + 25, 100);
        const today = new Date().toISOString().split("T")[0];
        const logs = goal.progress_logs || [];
        const hasLoggedToday = logs.some((l) => l.date === today);
        
        const newLog = {
          date: today,
          minutes: 15,
          note: "Quick progress check-in",
        };
        
        const newStreak = hasLoggedToday ? (goal.streak || 0) : (goal.streak || 0) + 1;
        
        await goalsApi.update(goal.goal_id, {
          progress: newProgress,
          progress_logs: [...logs, newLog],
          streak: newStreak,
          completed: newProgress >= 100,
        });
        
        if (newProgress >= 100) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          toast.success('🎉 Goal completed!');
        } else {
          toast.success(`+25% progress!`);
        }
      } else {
        const newProgress = Math.max((goal.progress || 0) - 25, 0);
        await goalsApi.update(goal.goal_id, {
          progress: newProgress,
          completed: false,
        });
        toast.success('Progress adjusted');
      }
      fetchData();
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const filteredGoals = activeCategory === 'all' 
    ? goals 
    : goals.filter(g => g.category === activeCategory);

  const activeGoals = filteredGoals.filter(g => !g.completed);
  const completedGoals = filteredGoals.filter(g => g.completed);

  // Stats
  const totalXpEarned = goals.reduce((acc, g) => acc + (g.xp_earned || 0), 0);
  const totalMilestones = goals.reduce((acc, g) => acc + (g.milestones?.length || 0), 0);
  const completedMilestones = goals.reduce((acc, g) => 
    acc + (g.milestones?.filter(m => m.completed)?.length || 0), 0);

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
          <h1 className="font-heading text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">Track your progress and earn rewards</p>
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
          <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">
                {editingGoal ? 'Edit Goal' : 'New Goal'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Master Calculus Chapter 5"
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
                  placeholder="Add more details..."
                  className="rounded-xl"
                  rows={2}
                  data-testid="goal-description-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Deadline (optional)</Label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>XP Reward</Label>
                <Select 
                  value={String(formData.xp_reward)} 
                  onValueChange={(val) => setFormData({ ...formData, xp_reward: parseInt(val) })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 XP (Quick goal)</SelectItem>
                    <SelectItem value="100">100 XP (Standard)</SelectItem>
                    <SelectItem value="200">200 XP (Major goal)</SelectItem>
                    <SelectItem value="500">500 XP (Epic goal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Link Tasks (optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Progress will auto-update as you complete linked tasks
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2 p-3 rounded-xl bg-secondary/30">
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
                          <span className={`w-2 h-2 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending tasks
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

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeGoals.length}</p>
                <p className="text-xs text-muted-foreground">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalXpEarned}</p>
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedMilestones}/{totalMilestones}</p>
                <p className="text-xs text-muted-foreground">Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/10 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedGoals.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="bg-secondary/30 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary/20">
            All
          </TabsTrigger>
          {CATEGORIES.map(cat => (
            <TabsTrigger 
              key={cat.value} 
              value={cat.value}
              className="rounded-lg data-[state=active]:bg-primary/20"
            >
              <cat.icon className="w-4 h-4 mr-1" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Active Goals ({activeGoals.length})
        </h2>
        
        {activeGoals.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.goal_id}
                goal={goal}
                tasks={tasks}
                onSelect={() => setSelectedGoal(goal)}
                onEdit={() => handleEdit(goal)}
                onDelete={() => handleDelete(goal.goal_id)}
                onComplete={() => handleToggleComplete(goal)}
                onQuickProgress={handleQuickProgress}
                onReview={() => handleGetReview(goal)}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 text-primary/40 mx-auto mb-4" />
              <h3 className="font-medium mb-1">No active goals</h3>
              <p className="text-sm text-muted-foreground">
                Set a goal to stay focused and earn XP!
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
              <CompletedGoalCard
                key={goal.goal_id}
                goal={goal}
                onDelete={() => handleDelete(goal.goal_id)}
                onReopen={() => handleToggleComplete(goal)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Goal Detail Modal */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedGoal && (
            <GoalDetailModal
              goal={selectedGoal}
              tasks={tasks}
              refresh={fetchData}
              close={() => setSelectedGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Weekly Review
            </DialogTitle>
          </DialogHeader>
          {isLoadingReview ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : review ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-secondary/30">
                  <p className="text-2xl font-bold">{review.stats.progress.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Progress</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30">
                  <p className="text-2xl font-bold">🔥 {review.stats.streak}</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30">
                  <p className="text-2xl font-bold">{review.stats.xp_earned}</p>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm whitespace-pre-wrap">{review.review}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Goal Card Component
const GoalCard = ({ goal, tasks, onSelect, onEdit, onDelete, onComplete, onQuickProgress, onReview }) => {
  const category = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[0];
  const CategoryIcon = category.icon;
  
  const linkedTasks = tasks.filter(t => goal.target_tasks?.includes(t.task_id));
  const completedLinkedTasks = linkedTasks.filter(t => t.status === 'completed').length;
  
  const completedMilestones = goal.milestones?.filter(m => m.completed)?.length || 0;
  const totalMilestones = goal.milestones?.length || 0;
  
  const daysUntilDeadline = goal.deadline 
    ? differenceInDays(new Date(goal.deadline), new Date())
    : null;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="bg-card/50 border-border/10 rounded-2xl hover:border-primary/30 transition-colors cursor-pointer overflow-hidden"
        data-testid={`goal-card-${goal.goal_id}`}
        onClick={onSelect}
      >
        {/* Category Banner */}
        <div className={`h-1 ${category.color.replace('text-', 'bg-').replace('/10', '')}`} />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={goal.progress >= 100}
                onCheckedChange={(checked) => {
                  onQuickProgress(goal, checked);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-5 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                data-testid={`goal-checkbox-${goal.goal_id}`}
              />
              <div>
                <CardTitle className="font-heading text-lg">{goal.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${category.color}`}>
                    <CategoryIcon className="w-3 h-3 inline mr-1" />
                    {category.label}
                  </span>
                  {goal.streak > 0 && (
                    <span className="text-xs text-orange-500">🔥 {goal.streak}</span>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={onReview}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Weekly Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onComplete}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {goal.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
          )}
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(goal.progress || 0)}%</span>
            </div>
            <Progress value={goal.progress || 0} className="h-2" />
          </div>
          
          {/* Milestones Timeline */}
          {goal.milestones && goal.milestones.length > 0 && (
            <div className="flex items-center gap-1">
              {goal.milestones.map((milestone, i) => (
                <div key={milestone.id} className="flex-1 flex items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    milestone.completed ? 'bg-primary' : 'bg-secondary'
                  }`} />
                  {i < goal.milestones.length - 1 && (
                    <div className={`flex-1 h-0.5 ${
                      milestone.completed ? 'bg-primary' : 'bg-secondary'
                    }`} />
                  )}
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {completedMilestones}/{totalMilestones}
              </span>
            </div>
          )}
          
          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {linkedTasks.length > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {completedLinkedTasks}/{linkedTasks.length} tasks
                </span>
              )}
              {goal.xp_earned > 0 && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Star className="w-3 h-3" />
                  {goal.xp_earned} XP
                </span>
              )}
            </div>
            {daysUntilDeadline !== null && (
              <span className={`flex items-center gap-1 ${
                daysUntilDeadline < 0 ? 'text-red-500' :
                daysUntilDeadline <= 3 ? 'text-amber-500' : ''
              }`}>
                <Calendar className="w-3 h-3" />
                {daysUntilDeadline < 0 
                  ? `${Math.abs(daysUntilDeadline)}d overdue`
                  : daysUntilDeadline === 0 
                    ? 'Due today'
                    : `${daysUntilDeadline}d left`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Completed Goal Card
const CompletedGoalCard = ({ goal, onDelete, onReopen }) => {
  const category = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[0];
  
  return (
    <Card className="bg-card/30 border-border/5 rounded-2xl opacity-70">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium line-through">{goal.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`px-2 py-0.5 rounded-full ${category.color}`}>
                {category.label}
              </span>
              <span className="text-amber-500">+{goal.xp_earned || goal.xp_reward} XP</span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReopen}
              className="text-muted-foreground hover:text-foreground"
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Goal Detail Modal
const GoalDetailModal = ({ goal, tasks, refresh, close }) => {
  const [logMinutes, setLogMinutes] = useState("");
  const [logNote, setLogNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(null);

  const category = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[0];
  const CategoryIcon = category.icon;
  const subtasks = goal.subtasks || [];
  const logs = goal.progress_logs || [];
  const linkedTasks = tasks.filter(t => goal.target_tasks?.includes(t.task_id));

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

  const handleCompleteLinkedTask = async (taskId) => {
    setIsCompletingTask(taskId);
    try {
      await goalsApi.completeTask(goal.goal_id, taskId);
      toast.success('Task completed! Progress updated 🎯');
      refresh();
    } catch (error) {
      toast.error('Failed to complete task');
    } finally {
      setIsCompletingTask(null);
    }
  };

  const markComplete = async () => {
    await goalsApi.update(goal.goal_id, {
      completed: !goal.completed,
      progress: goal.completed ? goal.progress : 100,
    });
    
    if (!goal.completed) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    
    refresh();
    close();
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${category.color} flex items-center justify-center`}>
            <CategoryIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-xl">{goal.title}</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${category.color}`}>
                {category.label}
              </span>
              {goal.streak > 0 && (
                <span className="text-sm text-orange-500">🔥 {goal.streak} day streak</span>
              )}
            </div>
          </div>
        </div>
        {goal.description && (
          <p className="text-muted-foreground mt-2">{goal.description}</p>
        )}
      </DialogHeader>

      {/* Progress & XP */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-4 rounded-xl bg-secondary/30">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span className="font-bold">{Math.round(goal.progress ?? 0)}%</span>
          </div>
          <Progress value={goal.progress ?? 0} className="h-3" />
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-lg font-bold text-amber-500">{goal.xp_earned || 0} XP</p>
              <p className="text-xs text-muted-foreground">of {goal.xp_reward} XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones Timeline */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-400" />
            Milestones
          </h4>
          <div className="space-y-3">
            {goal.milestones.map((milestone, i) => (
              <div key={milestone.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  milestone.completed 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {milestone.completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {milestone.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{milestone.percentage}% • +{milestone.xp_reward} XP</p>
                </div>
                {milestone.completed && (
                  <span className="text-xs text-emerald-500">✓ Done</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Tasks */}
      {linkedTasks.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Linked Tasks ({linkedTasks.filter(t => t.status === 'completed').length}/{linkedTasks.length})
          </h4>
          <div className="space-y-2">
            {linkedTasks.map((task) => (
              <div 
                key={task.task_id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  task.status === 'completed' ? 'bg-emerald-500/10' : 'bg-secondary/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <span className={`flex-1 text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </span>
                {task.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCompleteLinkedTask(task.task_id)}
                    disabled={isCompletingTask === task.task_id}
                    className="h-7 px-2"
                  >
                    {isCompletingTask === task.task_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Done
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtasks */}
      <div className="mt-6">
        <h4 className="font-medium mb-3">Steps</h4>
        {subtasks.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">
            No steps yet. Break this goal down 👇
          </p>
        ) : (
          <div className="space-y-2 mb-3">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => toggleSubtask(subtask.id)}
                />
                <span className={subtask.completed ? "line-through text-muted-foreground text-sm" : "text-sm"}>
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

      {/* Daily Log */}
      <div className="mt-6">
        <h4 className="font-medium mb-3">Log Today's Progress</h4>
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

      {/* Log History */}
      {logs.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Recent History</h4>
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

      {/* Actions */}
      <div className="flex justify-between pt-6 mt-6 border-t border-border/10">
        <Button variant="outline" onClick={markComplete} className="rounded-xl">
          {goal.completed ? "Reopen Goal" : "Mark Complete"}
        </Button>
        <Button variant="ghost" onClick={close}>
          Close
        </Button>
      </div>

      {/* Easter egg */}
      {goal.progress === 100 && !goal.completed && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-4 p-4 rounded-xl bg-emerald-500/10"
        >
          <PartyPopper className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-emerald-500 font-medium">
            🎉 Goal fully conquered! Mark it complete to earn your XP!
          </p>
        </motion.div>
      )}
    </>
  );
};

export default Goals;
