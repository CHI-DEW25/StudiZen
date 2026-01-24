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
  Bell,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

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
      
      // Start polling for messages
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

      // Auto-select first group if available
      if (myGroupsRes.data?.length > 0) {
        setSelectedGroup(myGroupsRes.data[0]);
      }
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
      // Select the new group
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
      if (selectedGroup?.group_id === groupId) {
        setSelectedGroup(null);
        setGroupDetails(null);
      }
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

      {/* Main Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Sidebar - Groups List */}
        <div className="lg:col-span-3 space-y-4">
          {/* My Groups */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                My Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {myGroups.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No groups yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {myGroups.map((group) => (
                    <button
                      key={group.group_id}
                      onClick={() => setSelectedGroup(group)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                        selectedGroup?.group_id === group.group_id
                          ? 'bg-primary/20 border border-primary/30'
                          : 'hover:bg-secondary/50'
                      }`}
                      data-testid={`group-${group.group_id}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-violet-500/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{group.name}</span>
                          {group.is_owner && (
                            <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{group.member_count} members</span>
                          {group.unread_count > 0 && (
                            <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                              {group.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Browse Groups */}
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                Discover
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search groups..."
                className="rounded-xl"
                data-testid="search-groups"
              />
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPublicGroups.slice(0, 5).map((group) => (
                  <div
                    key={group.group_id}
                    className="p-3 rounded-xl bg-secondary/30 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.member_count} members • {group.total_xp} XP
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleJoinGroup(group.group_id)}
                      className="h-8 px-3 rounded-lg"
                      data-testid={`join-${group.group_id}`}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {filteredPublicGroups.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No groups found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-6">
          {selectedGroup && groupDetails ? (
            <Card className="bg-card/50 border-white/10 rounded-2xl overflow-hidden h-[600px] flex flex-col">
              {/* Group Header */}
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold flex items-center gap-2">
                        {groupDetails.name}
                        {groupDetails.is_owner && (
                          <Crown className="w-4 h-4 text-amber-400" />
                        )}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {groupDetails.member_count} members • {groupDetails.weekly_xp} XP this week
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.study_group_id !== selectedGroup.group_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetPrimary(selectedGroup.group_id)}
                        className="rounded-lg text-xs"
                        data-testid="set-primary-btn"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Set Primary
                      </Button>
                    )}
                    {user?.study_group_id === selectedGroup.group_id && (
                      <Badge variant="secondary" className="rounded-lg">
                        <Star className="w-3 h-3 mr-1 text-amber-400" />
                        Primary
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleLeaveGroup(selectedGroup.group_id)}
                      className="rounded-lg text-destructive hover:text-destructive"
                      data-testid="leave-group-btn"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-white/10 rounded-none p-0">
                  <TabsTrigger 
                    value="chat" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger 
                    value="goals" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Goals
                  </TabsTrigger>
                  <TabsTrigger 
                    value="members" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Members
                  </TabsTrigger>
                </TabsList>

                {/* Chat Tab */}
                <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                          <MessageCircle className="w-12 h-12 mb-2 opacity-30" />
                          <p className="text-sm">No messages yet. Start the conversation!</p>
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
                              <div className="text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full">
                                {msg.content}
                              </div>
                            ) : msg.message_type === 'achievement' ? (
                              <div className="text-sm text-amber-400 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                                {msg.content}
                              </div>
                            ) : (
                              <>
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                  <AvatarImage src={msg.user_picture} />
                                  <AvatarFallback className="bg-primary/20 text-xs">
                                    {msg.user_name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`max-w-[70%] ${msg.user_id === user?.user_id ? 'text-right' : ''}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {msg.user_id === user?.user_id ? 'You' : msg.user_name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/60">
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className={`px-4 py-2 rounded-2xl text-sm ${
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
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl"
                        data-testid="chat-input"
                        disabled={isSending}
                      />
                      <Button 
                        type="submit" 
                        className="rounded-xl" 
                        disabled={isSending || !newMessage.trim()}
                        data-testid="send-message-btn"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="flex-1 overflow-auto m-0 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-heading font-semibold">Shared Goals</h3>
                    <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="rounded-xl" data-testid="create-goal-btn">
                          <Plus className="w-4 h-4 mr-1" />
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
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No shared goals yet. Create one to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupGoals.map((goal) => (
                        <div key={goal.goal_id} className="p-4 rounded-xl bg-secondary/30 border border-white/5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{goal.title}</h4>
                                {goal.completed && (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                              </div>
                              {goal.description && (
                                <p className="text-sm text-muted-foreground">{goal.description}</p>
                              )}
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
                                className="rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
                                data-testid={`contribute-${goal.goal_id}`}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                +1
                              </Button>
                            )}
                          </div>
                          <Progress value={Math.min(goal.progress || 0, 100)} className="h-2 mb-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{goal.current_count} / {goal.target_count}</span>
                            <span>{goal.contributors?.length || 0} contributions</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="flex-1 overflow-auto m-0 p-4">
                  <div className="space-y-3">
                    {groupDetails.members?.map((member, index) => (
                      <div key={member.user_id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted-foreground w-6">#{index + 1}</span>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.picture} />
                            <AvatarFallback className="bg-primary/20">
                              {member.name?.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              {member.is_owner && (
                                <Crown className="w-4 h-4 text-amber-400" />
                              )}
                              {member.user_id === user?.user_id && (
                                <Badge variant="secondary" className="text-[10px] h-5">You</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{member.weekly_xp || 0} XP this week</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-amber-400">
                          <Flame className="w-4 h-4" />
                          <span className="font-mono text-sm">{member.streak || 0}d</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          ) : (
            <Card className="bg-card/50 border-white/10 rounded-2xl h-[600px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <h3 className="font-heading font-semibold mb-2">Select a Group</h3>
                <p className="text-sm">Choose a group from the sidebar or create a new one</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Leaderboard */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-card/50 border-white/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Top Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupLeaderboard.slice(0, 8).map((group, index) => (
                  <div key={group.group_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                    <span className={`font-mono font-bold w-6 ${
                      index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-400' : index === 2 ? 'text-orange-500' : 'text-muted-foreground'
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        myGroups.some(mg => mg.group_id === group.group_id) ? 'text-primary' : ''
                      }`}>
                        {group.name}
                        {myGroups.some(mg => mg.group_id === group.group_id) && (
                          <span className="ml-2 text-[10px] bg-primary/20 px-2 py-0.5 rounded-full">Yours</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{group.member_count} members</p>
                    </div>
                    <span className="text-xs font-mono text-amber-400">{group.xp}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {selectedGroup && groupDetails && (
            <Card className="bg-card/50 border-white/10 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Group Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total XP</span>
                  <span className="font-mono font-bold text-primary">{groupDetails.total_xp || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Weekly XP</span>
                  <span className="font-mono font-bold text-violet-400">{groupDetails.weekly_xp || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Members</span>
                  <span className="font-mono font-bold">{groupDetails.member_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Active Goals</span>
                  <span className="font-mono font-bold text-amber-400">
                    {groupGoals.filter(g => !g.completed).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;
