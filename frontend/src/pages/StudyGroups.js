import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsApi, leaderboardApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Users,
  Plus,
  Search,
  Trophy,
  MessageCircle,
  Target,
  Crown,
  Zap,
  Send,
  LogOut,
  UserPlus,
  Flame,
  CheckCircle,
  Loader2,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

const StudyGroups = () => {
  const { user } = useAuth();
  const [myGroup, setMyGroup] = useState(null);
  const [publicGroups, setPublicGroups] = useState([]);
  const [groupLeaderboard, setGroupLeaderboard] = useState([]);
  const [messages, setMessages] = useState([]);
  const [groupGoals, setGroupGoals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newMessage, setNewMessage] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (myGroup && activeTab === 'chat') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [myGroup, activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [myGroupRes, publicRes, leaderboardRes] = await Promise.all([
        groupsApi.getMyCurrent(),
        groupsApi.getAll(),
        leaderboardApi.getGroups('weekly', 10),
      ]);
      
      setMyGroup(myGroupRes.data);
      setPublicGroups(publicRes.data);
      setGroupLeaderboard(leaderboardRes.data.leaderboard);

      if (myGroupRes.data) {
        const goalsRes = await groupsApi.getGoals(myGroupRes.data.group_id);
        setGroupGoals(goalsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!myGroup) return;
    try {
      const res = await groupsApi.getMessages(myGroup.group_id);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await groupsApi.create({ name: newGroupName, description: newGroupDesc });
      toast.success('Study group created!');
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupsApi.join(groupId);
      toast.success('Joined the group!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async () => {
    if (!myGroup) return;
    try {
      await groupsApi.leave(myGroup.group_id);
      toast.success('Left the group');
      setMyGroup(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to leave group');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !myGroup) return;
    try {
      await groupsApi.sendMessage(myGroup.group_id, newMessage);
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim() || !myGroup) return;
    try {
      await groupsApi.createGoal(myGroup.group_id, {
        title: newGoalTitle,
        description: newGoalDesc,
        target_date: newGoalDate || null,
      });
      toast.success('Group goal created!');
      setShowCreateGoal(false);
      setNewGoalTitle('');
      setNewGoalDesc('');
      setNewGoalDate('');
      const goalsRes = await groupsApi.getGoals(myGroup.group_id);
      setGroupGoals(goalsRes.data);
    } catch (error) {
      toast.error('Failed to create goal');
    }
  };

  const handleContributeToGoal = async (goalId) => {
    if (!myGroup) return;
    try {
      await groupsApi.contributeToGoal(myGroup.group_id, goalId);
      toast.success('Contribution recorded! +15 XP');
      const goalsRes = await groupsApi.getGoals(myGroup.group_id);
      setGroupGoals(goalsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to contribute');
    }
  };

  const filteredGroups = publicGroups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (!myGroup || g.group_id !== myGroup.group_id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="study-groups-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Study Groups</h1>
          <p className="text-muted-foreground-500 mt-1">
            {myGroup ? `Member of ${myGroup.name}` : 'Join or create a study group to compete together!'}
          </p>
        </div>
        {!myGroup && (
          <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
            <DialogTrigger asChild>
              <Button className="btn-primary rounded-xl" data-testid="create-group-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-secondary border-border/10 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground font-heading">Create Study Group</DialogTitle>
                <DialogDescription className="text-muted-foreground-400">
                  Create a new study group and invite friends to compete together
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., CS Study Squad"
                    className="mt-1 bg-primary/5 border-border/10 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="group-desc">Description (optional)</Label>
                  <Textarea
                    id="group-desc"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="What's your group about?"
                    className="mt-1 bg-primary/5 border-border/10 rounded-xl resize-none"
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateGroup} className="w-full btn-primary rounded-xl">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {myGroup ? (
        /* User has a group - Show group interface */
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Header Card */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-[80px]" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg glow-green">
                    <Users className="w-8 h-8 text-foreground" />
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-foreground">{myGroup.name}</h2>
                    <p className="text-muted-foreground-500 text-sm">{myGroup.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {myGroup.members?.length || 1} members
                      </span>
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {myGroup.weekly_xp || 0} XP this week
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeaveGroup}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                  data-testid="leave-group-btn"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Leave
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/5 rounded-xl p-1">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  <Trophy className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="goals" className="rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  <Target className="w-4 h-4 mr-2" />
                  Goals
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Members */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Members ({myGroup.members?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {myGroup.members?.map((member, index) => (
                      <div key={member.user_id} className="flex items-center justify-between p-3 rounded-xl bg-primary/5">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted-foreground-500 w-6">#{index + 1}</span>
                          <Avatar className="w-10 h-10 ring-2 ring-white/10">
                            <AvatarImage src={member.picture} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-foreground">
                              {member.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{member.name}</span>
                              {member.is_owner && (
                                <Crown className="w-4 h-4 text-amber-400" />
                              )}
                              {member.user_id === user?.user_id && (
                                <span className="text-[10px] text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded-full">You</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground-500">{member.weekly_xp || 0} XP this week</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-orange-400">
                          <Flame className="w-4 h-4" />
                          <span className="font-mono text-sm">{member.streak || 0}d</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-6">
                <div className="glass-card rounded-2xl overflow-hidden">
                  {/* Messages */}
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground-500">
                        <MessageCircle className="w-12 h-12 mb-2 opacity-30" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.message_id}
                          className={`flex items-start gap-3 ${
                            msg.user_id === user?.user_id ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={msg.user_picture} />
                            <AvatarFallback className="bg-secondary/10 text-xs">
                              {msg.user_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[70%] ${
                            msg.user_id === user?.user_id ? 'text-right' : ''
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground-400">{msg.user_name}</span>
                              <span className="text-[10px] text-muted-foreground-600">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl ${
                              msg.user_id === user?.user_id
                                ? 'bg-emerald-500/50 text-emerald-900'
                                : 'bg-zinc-700/5 text-foreground-300'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-border/5">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 border-border/10 rounded-xl"
                        data-testid="chat-input"
                      />
                      <Button type="submit" className="btn-primary rounded-xl" data-testid="send-message-btn">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-heading text-lg font-semibold text-foreground">Shared Goals</h3>
                  <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="btn-primary rounded-xl" data-testid="create-goal-btn">
                        <Plus className="w-4 h-4 mr-1" />
                        New Goal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-secondary border-border/10 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-foreground font-heading">Create Shared Goal</DialogTitle>
                        <DialogDescription className="text-muted-foreground-400">
                          Create a goal for your team to achieve together
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label htmlFor="goal-title">Goal Title</Label>
                          <Input
                            id="goal-title"
                            value={newGoalTitle}
                            onChange={(e) => setNewGoalTitle(e.target.value)}
                            placeholder="e.g., Complete 100 Pomodoros"
                            className="mt-1 bg-white/5 border-border/10 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="goal-desc">Description</Label>
                          <Textarea
                            id="goal-desc"
                            value={newGoalDesc}
                            onChange={(e) => setNewGoalDesc(e.target.value)}
                            placeholder="What's this goal about?"
                            className="mt-1 bg-white/5 border-border/10 rounded-xl resize-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="goal-date">Target Date (optional)</Label>
                          <Input
                            id="goal-date"
                            type="date"
                            value={newGoalDate}
                            onChange={(e) => setNewGoalDate(e.target.value)}
                            className="mt-1 bg-white/5 border-border/10 rounded-xl"
                          />
                        </div>
                        <Button onClick={handleCreateGoal} className="w-full btn-primary rounded-xl">
                          Create Goal
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {groupGoals.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <Target className="w-12 h-12 text-muted-foreground-600 mx-auto mb-3" />
                    <p className="text-muted-foreground-500">No shared goals yet. Create one to get started!</p>
                  </div>
                ) : (
                  groupGoals.map((goal) => (
                    <div key={goal.goal_id} className="glass-card rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{goal.title}</h4>
                            {goal.completed && (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground-500">{goal.description}</p>
                          {goal.target_date && (
                            <div className="flex items-center gap-1 text-xs text-amber-400 mt-2">
                              <Calendar className="w-3 h-3" />
                              Due: {new Date(goal.target_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {!goal.completed && (
                          <Button
                            size="sm"
                            onClick={() => handleContributeToGoal(goal.goal_id)}
                            className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg"
                            data-testid={`contribute-${goal.goal_id}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Contribute
                          </Button>
                        )}
                      </div>
                      <Progress value={Math.min(goal.progress || 0, 100)} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground-500">
                        <span>{goal.progress || 0}% progress</span>
                        <span>{goal.contributors?.length || 0} contributions</span>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Group Stats */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Group Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground-500">Total XP</span>
                  <span className="font-mono font-bold text-emerald-400">{myGroup.total_xp || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground-500">Weekly XP</span>
                  <span className="font-mono font-bold text-violet-400">{myGroup.weekly_xp || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground-500">Members</span>
                  <span className="font-mono font-bold text-white">{myGroup.members?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground-500">Active Goals</span>
                  <span className="font-mono font-bold text-amber-400">
                    {groupGoals.filter(g => !g.completed).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Group Leaderboard */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Top Groups
              </h3>
              <div className="space-y-3">
                {groupLeaderboard.slice(0, 5).map((group, index) => (
                  <div key={group.group_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    <span className={`font-mono font-bold w-6 ${
                      index === 0 ? 'text-amber-400' : index === 1 ? 'text-muted-foreground-400' : index === 2 ? 'text-orange-500' : 'text-muted-foreground-500'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        group.group_id === myGroup.group_id ? 'text-emerald-400' : 'text-foreground'
                      }`}>
                        {group.name}
                        {group.group_id === myGroup.group_id && (
                          <span className="ml-2 text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">You</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground-600">{group.member_count} members</p>
                    </div>
                    <span className="text-xs font-mono text-amber-400">{group.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No group - Show discovery interface */
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Public Groups */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search study groups..."
                className="pl-12 h-12 bg-white/5 border-border/10 rounded-xl"
                data-testid="search-groups"
              />
            </div>

            {/* Groups List */}
            <div className="space-y-4">
              {filteredGroups.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground-600 mx-auto mb-3" />
                  <p className="text-muted-foreground-500">No groups found. Create one to get started!</p>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.group_id} className="glass-card rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 flex items-center justify-center border border-violet-500/20">
                          <Users className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{group.name}</h3>
                          <p className="text-sm text-muted-foreground-500 line-clamp-1">{group.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground-500 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {group.member_count} members
                            </span>
                            <span className="text-xs text-amber-400 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> {group.total_xp || 0} XP
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoinGroup(group.group_id)}
                        className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl"
                        data-testid={`join-${group.group_id}`}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Group Leaderboard Sidebar */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Top Groups This Week
              </h3>
              <div className="space-y-3">
                {groupLeaderboard.map((group, index) => (
                  <div key={group.group_id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <span className={`font-mono font-bold w-6 ${
                      index === 0 ? 'text-amber-400' : index === 1 ? 'text-muted-foreground-400' : index === 2 ? 'text-orange-500' : 'text-muted-foreground-500'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground-600">{group.member_count} members</p>
                    </div>
                    <span className="text-xs font-mono text-amber-400">{group.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Group CTA */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-[50px]" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Start Your Own Group</h3>
                <p className="text-sm text-muted-foreground-500 mb-4">
                  Create a study group and invite friends to compete together for bonus XP!
                </p>
                <Button onClick={() => setShowCreateGroup(true)} className="w-full btn-primary rounded-xl">
                  Create Group
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroups;