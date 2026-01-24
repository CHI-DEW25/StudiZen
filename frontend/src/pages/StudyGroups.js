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
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
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
  Star,
  Hash,
  X,
  ArrowLeft,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const StudyGroups = () => {
  const { user } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [publicGroups, setPublicGroups] = useState([]);
  const [groupLeaderboard, setGroupLeaderboard] = useState([]);
  const [messages, setMessages] = useState([]);
  const [groupGoals, setGroupGoals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [newMessage, setNewMessage] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(10);
  const [newGoalDate, setNewGoalDate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const chatEndRef = useRef(null);
  const messagePollingRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    return () => {
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupData(selectedGroup.group_id);
      setIsFullScreen(true);
      
      messagePollingRef.current = setInterval(() => {
        fetchMessages(selectedGroup.group_id);
      }, 3000);
      
      return () => {
        if (messagePollingRef.current) {
          clearInterval(messagePollingRef.current);
        }
      };
    }
  }, [selectedGroup?.group_id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [myGroupsRes, publicRes, leaderboardRes] = await Promise.all([
        groupsApi.getMyGroups(),
        groupsApi.getAll(),
        leaderboardApi.getGroups('weekly', 10),
      ]);
      
      setMyGroups(myGroupsRes.data || []);
      setPublicGroups(publicRes.data || []);
      setGroupLeaderboard(leaderboardRes.data?.leaderboard || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupData = async (groupId) => {
    try {
      const [detailsRes, messagesRes, goalsRes] = await Promise.all([
        groupsApi.getDetails(groupId),
        groupsApi.getMessages(groupId),
        groupsApi.getGoals(groupId),
      ]);
      
      setGroupDetails(detailsRes.data);
      setMessages(messagesRes.data || []);
      setGroupGoals(goalsRes.data || []);
    } catch (error) {
      console.error('Error fetching group data:', error);
    }
  };

  const fetchMessages = async (groupId) => {
    try {
      const res = await groupsApi.getMessages(groupId);
      setMessages(res.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await groupsApi.create({ name: newGroupName, description: newGroupDesc });
      toast.success('Study group created!');
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchInitialData();
      if (res.data) {
        setSelectedGroup(res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupsApi.join(groupId);
      toast.success('Joined the group!');
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await groupsApi.leave(groupId);
      toast.success('Left the group');
      handleExitGroup();
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to leave group');
    }
  };

  const handleSetPrimary = async (groupId) => {
    try {
      await groupsApi.setPrimary(groupId);
      toast.success('Primary group updated! XP bonuses will apply to this group.');
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to set primary group');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup || isSending) return;
    
    setIsSending(true);
    try {
      await groupsApi.sendMessage(selectedGroup.group_id, newMessage);
      setNewMessage('');
      fetchMessages(selectedGroup.group_id);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim() || !selectedGroup) return;
    try {
      await groupsApi.createGoal(selectedGroup.group_id, {
        title: newGoalTitle,
        description: newGoalDesc,
        target_count: newGoalTarget,
        target_date: newGoalDate || null,
      });
      toast.success('Group goal created!');
      setShowCreateGoal(false);
      setNewGoalTitle('');
      setNewGoalDesc('');
      setNewGoalTarget(10);
      setNewGoalDate('');
      fetchGroupData(selectedGroup.group_id);
    } catch (error) {
      toast.error('Failed to create goal');
    }
  };

  const handleContributeToGoal = async (goalId) => {
    if (!selectedGroup) return;
    try {
      const res = await groupsApi.contributeToGoal(selectedGroup.group_id, goalId);
      toast.success(`Contribution recorded! +${res.data.xp_earned} XP`);
      fetchGroupData(selectedGroup.group_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to contribute');
    }
  };

  const handleExitGroup = () => {
    setIsFullScreen(false);
    setSelectedGroup(null);
    setGroupDetails(null);
    if (messagePollingRef.current) {
      clearInterval(messagePollingRef.current);
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setIsFullScreen(true);
  };

  const filteredPublicGroups = publicGroups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !myGroups.some(mg => mg.group_id === g.group_id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Full Screen Group View
  if (isFullScreen && selectedGroup && groupDetails) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background"
        data-testid="group-fullscreen"
      >
        {/* Header */}
        <div className="h-16 border-b border-white/10 bg-card/80 backdrop-blur-xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExitGroup}
              className="rounded-xl"
              data-testid="exit-group-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-bold flex items-center gap-2">
                  {groupDetails.name}
                  {groupDetails.is_owner && <Crown className="w-4 h-4 text-amber-400" />}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {groupDetails.member_count} members • {groupDetails.weekly_xp} XP this week
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user?.study_group_id !== selectedGroup.group_id ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSetPrimary(selectedGroup.group_id)}
                className="rounded-xl"
                data-testid="set-primary-btn"
              >
                <Star className="w-4 h-4 mr-2" />
                Set Primary
              </Button>
            ) : (
              <Badge variant="secondary" className="rounded-xl px-3 py-1.5">
                <Star className="w-4 h-4 mr-1 text-amber-400" />
                Primary Group
              </Badge>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleLeaveGroup(selectedGroup.group_id)}
              className="rounded-xl"
              data-testid="leave-group-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-[calc(100vh-4rem)] flex">
          {/* Chat/Goals/Members Area */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-card/50 border-b border-white/10 rounded-none p-0 h-12">
                <TabsTrigger 
                  value="chat" 
                  className="rounded-none h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="goals" 
                  className="rounded-none h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Shared Goals
                </TabsTrigger>
                <TabsTrigger 
                  value="members" 
                  className="rounded-none h-full border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Members ({groupDetails.member_count})
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
                <ScrollArea className="flex-1 p-6">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm">Start the conversation with your group!</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.message_id}
                          className={`flex gap-3 ${
                            msg.message_type === 'system' || msg.message_type === 'achievement'
                              ? 'justify-center'
                              : msg.user_id === user?.user_id
                              ? 'flex-row-reverse'
                              : ''
                          }`}
                        >
                          {msg.message_type === 'system' ? (
                            <div className="text-xs text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full">
                              {msg.content}
                            </div>
                          ) : msg.message_type === 'achievement' ? (
                            <div className="text-sm text-amber-400 bg-amber-500/10 px-6 py-3 rounded-2xl border border-amber-500/20">
                              {msg.content}
                            </div>
                          ) : (
                            <>
                              <Avatar className="w-10 h-10 flex-shrink-0">
                                <AvatarImage src={msg.user_picture} />
                                <AvatarFallback className="bg-primary/20">
                                  {msg.user_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`max-w-[60%] ${msg.user_id === user?.user_id ? 'text-right' : ''}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {msg.user_id === user?.user_id ? 'You' : msg.user_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground/60">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className={`px-4 py-3 rounded-2xl ${
                                  msg.user_id === user?.user_id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary/50'
                                }`}>
                                  {msg.content}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <div className="border-t border-white/10 p-4 bg-card/50">
                  <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl h-12"
                        data-testid="chat-input"
                        disabled={isSending}
                      />
                      <Button 
                        type="submit" 
                        className="rounded-xl h-12 px-6" 
                        disabled={isSending || !newMessage.trim()}
                        data-testid="send-message-btn"
                      >
                        {isSending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="flex-1 overflow-auto m-0 p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-heading text-xl font-semibold">Shared Goals</h2>
                    <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
                      <DialogTrigger asChild>
                        <Button className="rounded-xl" data-testid="create-goal-btn">
                          <Plus className="w-4 h-4 mr-2" />
                          New Goal
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="font-heading">Create Shared Goal</DialogTitle>
                          <DialogDescription>
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
                              className="mt-1 rounded-xl"
                            />
                          </div>
                          <div>
                            <Label htmlFor="goal-desc">Description</Label>
                            <Textarea
                              id="goal-desc"
                              value={newGoalDesc}
                              onChange={(e) => setNewGoalDesc(e.target.value)}
                              placeholder="What's this goal about?"
                              className="mt-1 rounded-xl resize-none"
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="goal-target">Target Count</Label>
                              <Input
                                id="goal-target"
                                type="number"
                                value={newGoalTarget}
                                onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 10)}
                                min={1}
                                className="mt-1 rounded-xl"
                              />
                            </div>
                            <div>
                              <Label htmlFor="goal-date">Target Date</Label>
                              <Input
                                id="goal-date"
                                type="date"
                                value={newGoalDate}
                                onChange={(e) => setNewGoalDate(e.target.value)}
                                className="mt-1 rounded-xl"
                              />
                            </div>
                          </div>
                          <Button onClick={handleCreateGoal} className="w-full rounded-xl">
                            Create Goal
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {groupGoals.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Target className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No shared goals yet</p>
                      <p className="text-sm">Create a goal for your team to achieve together!</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {groupGoals.map((goal) => (
                        <Card key={goal.goal_id} className="bg-card/50 border-white/10 rounded-2xl">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{goal.title}</h3>
                                  {goal.completed && <CheckCircle className="w-4 h-4 text-green-400" />}
                                </div>
                                {goal.description && (
                                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                                )}
                              </div>
                              {!goal.completed && (
                                <Button
                                  size="sm"
                                  onClick={() => handleContributeToGoal(goal.goal_id)}
                                  className="rounded-xl bg-primary/20 text-primary hover:bg-primary/30"
                                  data-testid={`contribute-${goal.goal_id}`}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  +1
                                </Button>
                              )}
                            </div>
                            <Progress value={Math.min(goal.progress || 0, 100)} className="h-2 mb-3" />
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{goal.current_count} / {goal.target_count}</span>
                              <span>{goal.contributors?.length || 0} contributions</span>
                            </div>
                            {goal.target_date && (
                              <div className="flex items-center gap-1 text-xs text-amber-400 mt-3">
                                <Calendar className="w-3 h-3" />
                                Due: {new Date(goal.target_date).toLocaleDateString()}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="flex-1 overflow-auto m-0 p-6">
                <div className="max-w-4xl mx-auto">
                  <h2 className="font-heading text-xl font-semibold mb-6">Group Members</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {groupDetails.members?.map((member, index) => (
                      <Card key={member.user_id} className="bg-card/50 border-white/10 rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <span className={`text-lg font-mono font-bold w-8 ${
                              index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-400' : index === 2 ? 'text-orange-500' : 'text-muted-foreground'
                            }`}>
                              #{index + 1}
                            </span>
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={member.picture} />
                              <AvatarFallback className="bg-primary/20 text-lg">
                                {member.name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{member.name}</span>
                                {member.is_owner && <Crown className="w-4 h-4 text-amber-400" />}
                                {member.user_id === user?.user_id && (
                                  <Badge variant="secondary" className="text-xs">You</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{member.weekly_xp || 0} XP this week</span>
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Flame className="w-3 h-3" />
                                  {member.streak || 0}d streak
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Group Stats */}
          <div className="w-80 border-l border-white/10 bg-card/30 p-4 hidden lg:block">
            <Card className="bg-card/50 border-white/10 rounded-2xl mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Group Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total XP</span>
                  <span className="font-mono font-bold text-primary">{groupDetails.total_xp || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Weekly XP</span>
                  <span className="font-mono font-bold text-violet-400">{groupDetails.weekly_xp || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-mono font-bold">{groupDetails.member_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Goals</span>
                  <span className="font-mono font-bold text-amber-400">
                    {groupGoals.filter(g => !g.completed).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupDetails.members?.slice(0, 5).map((member, index) => (
                  <div key={member.user_id} className="flex items-center gap-3">
                    <span className={`font-mono font-bold w-5 ${
                      index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-400' : 'text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.picture} />
                      <AvatarFallback className="bg-primary/20 text-xs">
                        {member.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                    </div>
                    <span className="text-xs font-mono text-amber-400">{member.weekly_xp}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  // Groups List View (Home)
  return (
    <div className="space-y-6" data-testid="study-groups-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Study Groups</h1>
          <p className="text-muted-foreground mt-1">
            {myGroups.length > 0 
              ? `You're in ${myGroups.length} group${myGroups.length > 1 ? 's' : ''}` 
              : 'Join or create a study group to compete together!'}
          </p>
        </div>
        <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
          <DialogTrigger asChild>
            <Button className="rounded-xl glow-primary" data-testid="create-group-btn">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading">Create Study Group</DialogTitle>
              <DialogDescription>
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
                  className="mt-1 rounded-xl"
                  data-testid="group-name-input"
                />
              </div>
              <div>
                <Label htmlFor="group-desc">Description (optional)</Label>
                <Textarea
                  id="group-desc"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="What's your group about?"
                  className="mt-1 rounded-xl resize-none"
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateGroup} className="w-full rounded-xl" data-testid="submit-create-group">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-primary" />
            My Groups
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group) => (
              <motion.div
                key={group.group_id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="bg-card/50 border-white/10 rounded-2xl cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => handleSelectGroup(group)}
                  data-testid={`group-card-${group.group_id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-violet-500/30 flex items-center justify-center">
                        <Users className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{group.name}</h3>
                          {group.is_owner && <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{group.member_count} members</span>
                          <span>•</span>
                          <span>{group.weekly_xp} XP</span>
                        </div>
                        {group.unread_count > 0 && (
                          <Badge variant="destructive" className="mt-2">
                            {group.unread_count} unread
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Discover Groups */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          Discover Groups
        </h2>
        
        <div className="mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search groups..."
            className="rounded-xl max-w-md"
            data-testid="search-groups"
          />
        </div>

        {filteredPublicGroups.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPublicGroups.map((group) => (
              <Card key={group.group_id} className="bg-card/50 border-white/10 rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{group.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {group.member_count} members • {group.total_xp} XP
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinGroup(group.group_id);
                      }}
                      className="rounded-xl"
                      data-testid={`join-${group.group_id}`}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No groups found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Groups Leaderboard */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Top Groups This Week
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupLeaderboard.slice(0, 8).map((group, index) => (
            <Card key={group.group_id} className="bg-card/50 border-white/10 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-mono font-bold w-8 ${
                    index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-400' : index === 2 ? 'text-orange-500' : 'text-muted-foreground'
                  }`}>
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.member_count} members</p>
                  </div>
                  <span className="font-mono text-sm text-amber-400">{group.xp}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;
