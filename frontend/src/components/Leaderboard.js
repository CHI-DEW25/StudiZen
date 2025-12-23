import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Trophy,
  Star,
  Flame,
  Target,
  ChevronRight,
  ChevronLeft,
  Medal,
  Zap,
  Crown,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';

const Leaderboard = ({ currentUser, userStats }) => {
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Mock leaderboard data - in production, this would come from API
  const leaderboardData = [
    {
      rank: 1,
      name: 'Sarah Chen',
      avatar: null,
      studyScore: 96,
      focusHours: 42,
      tasksCompleted: 89,
      streak: 21,
      badges: ['crown', 'flame', 'star'],
      change: '+2.5%',
      isPositive: true,
    },
    {
      rank: 2,
      name: 'Alex Kumar',
      avatar: null,
      studyScore: 94,
      focusHours: 38,
      tasksCompleted: 76,
      streak: 14,
      badges: ['medal', 'flame'],
      change: '+1.8%',
      isPositive: true,
    },
    {
      rank: 3,
      name: 'Emma Wilson',
      avatar: null,
      studyScore: 91,
      focusHours: 35,
      tasksCompleted: 72,
      streak: 18,
      badges: ['star', 'target'],
      change: '-0.5%',
      isPositive: false,
    },
    {
      rank: 4,
      name: currentUser?.name || 'You',
      avatar: currentUser?.picture,
      studyScore: userStats?.productivity_score || 78,
      focusHours: Math.round((userStats?.pomodoro?.total_focus_time_minutes || 0) / 60),
      tasksCompleted: userStats?.tasks?.completed || 12,
      streak: 7,
      badges: ['zap'],
      change: '+5.2%',
      isPositive: true,
      isCurrentUser: true,
    },
    {
      rank: 5,
      name: 'James Park',
      avatar: null,
      studyScore: 76,
      focusHours: 28,
      tasksCompleted: 54,
      streak: 9,
      badges: ['target'],
      change: '+0.8%',
      isPositive: true,
    },
  ];

  const recentAchievements = [
    { name: 'Focus Master', user: 'Sarah C.', progress: 100, reward: '500 XP' },
    { name: 'Task Crusher', user: 'Alex K.', progress: 78, reward: '350 XP' },
    { name: 'Goal Getter', user: 'Emma W.', progress: 54, reward: '200 XP' },
  ];

  const getBadgeIcon = (badge) => {
    const iconMap = {
      crown: <Crown className="w-4 h-4 text-amber" />,
      flame: <Flame className="w-4 h-4 text-orange-500" />,
      star: <Star className="w-4 h-4 text-yellow-400" />,
      medal: <Medal className="w-4 h-4 text-cyan" />,
      target: <Target className="w-4 h-4 text-emerald-500" />,
      zap: <Zap className="w-4 h-4 text-primary" />,
    };
    return iconMap[badge] || null;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-amber';
    return 'text-rose';
  };

  const CircularProgress = ({ value, size = 40 }) => {
    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="3"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={value >= 90 ? '#10b981' : value >= 70 ? 'hsl(var(--primary))' : '#f59e0b'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {value}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="leaderboard-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber" />
            Student Leaderboard
          </h2>
          <p className="text-muted-foreground text-sm">Compete with fellow students</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32 rounded-xl bg-secondary/50" data-testid="time-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="alltime">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Your Score Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/30 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Your Study Score</span>
              <Select value="weekly" onValueChange={() => {}}>
                <SelectTrigger className="w-24 h-7 text-xs rounded-lg bg-background/50 border-white/10">
                  <SelectValue placeholder="Weekly" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 35}
                    strokeDashoffset={2 * Math.PI * 35 * (1 - (userStats?.productivity_score || 78) / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{userStats?.productivity_score || 78}%</span>
                </div>
              </div>
              <div>
                <p className={`text-lg font-semibold ${getScoreColor(userStats?.productivity_score || 78)}`}>
                  {(userStats?.productivity_score || 78) >= 80 ? 'Excellent' : 'Good'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Focus Score: {Math.round((userStats?.pomodoro?.average_daily_sessions || 3) * 25)}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Placeholder */}
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-3">Weekly Progress</p>
            <div className="h-20 flex items-end justify-between gap-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/30 rounded-t"
                    style={{ height: `${[60, 80, 45, 90, 70, 40, 85][i]}%` }}
                  >
                    <div
                      className="w-full bg-primary rounded-t transition-all"
                      style={{ height: `${[40, 60, 30, 70, 50, 20, 65][i]}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{day.charAt(0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="bg-card/50 border-white/10 rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recently Completed</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAchievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  index === 0 ? 'bg-emerald-500/20' : index === 1 ? 'bg-amber/20' : 'bg-cyan/20'
                }`}>
                  {index === 0 ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                   index === 1 ? <Target className="w-4 h-4 text-amber" /> :
                   <Star className="w-4 h-4 text-cyan" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.user}</p>
                </div>
                <span className="text-xs text-emerald-500 font-medium">{achievement.reward}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('all')}
          className="rounded-full"
          data-testid="filter-all"
        >
          <Star className="w-3 h-3 mr-1" />
          Watchlist
        </Button>
        <Select value="global" onValueChange={() => {}}>
          <SelectTrigger className="w-32 h-8 rounded-full bg-secondary/50 border-white/10">
            <SelectValue placeholder="Ecosystem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="school">My School</SelectItem>
            <SelectItem value="friends">Friends</SelectItem>
          </SelectContent>
        </Select>
        <Select value="all" onValueChange={() => {}}>
          <SelectTrigger className="w-28 h-8 rounded-full bg-secondary/50 border-white/10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="science">Science</SelectItem>
            <SelectItem value="math">Math</SelectItem>
            <SelectItem value="arts">Arts</SelectItem>
          </SelectContent>
        </Select>
        <Select value="all" onValueChange={() => {}}>
          <SelectTrigger className="w-32 h-8 rounded-full bg-secondary/50 border-white/10">
            <SelectValue placeholder="Badge & Honor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Badges</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="ml-auto rounded-full">
          •••
        </Button>
      </div>

      {/* Leaderboard Table */}
      <Card className="bg-card/50 border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">#</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Study Score</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Change</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Focus Hours</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Streak</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Badge & Honor</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((user) => (
                <tr
                  key={user.rank}
                  className={`border-b border-white/5 hover:bg-secondary/30 transition-colors ${
                    user.isCurrentUser ? 'bg-primary/5' : ''
                  }`}
                  data-testid={`leaderboard-row-${user.rank}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {user.rank <= 3 ? (
                        <Star className={`w-4 h-4 ${
                          user.rank === 1 ? 'text-amber fill-amber' :
                          user.rank === 2 ? 'text-gray-400 fill-gray-400' :
                          'text-orange-600 fill-orange-600'
                        }`} />
                      ) : null}
                      <span className="font-mono">{user.rank}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className={`text-xs ${
                          user.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                        }`}>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`font-medium ${user.isCurrentUser ? 'text-primary' : ''}`}>
                        {user.name}
                        {user.isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <CircularProgress value={user.studyScore} />
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-medium ${
                      user.isPositive ? 'text-emerald-500' : 'text-rose'
                    }`}>
                      {user.isPositive ? '▲' : '▼'} {user.change}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono">{user.focusHours}h</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-mono">{user.streak} days</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {user.badges.map((badge, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center"
                        >
                          {getBadgeIcon(badge)}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" className="rounded-full w-8 h-8 p-0">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-4">Page 1 of 10</span>
        <Button variant="outline" size="sm" className="rounded-full w-8 h-8 p-0">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Leaderboard;
