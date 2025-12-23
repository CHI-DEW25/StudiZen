import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
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
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const Leaderboard = ({ currentUser, userStats }) => {
  const [timeFilter, setTimeFilter] = useState('weekly');
  
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
    { name: 'Focus Master', user: 'Sarah C.', reward: '500 XP', color: 'emerald' },
    { name: 'Task Crusher', user: 'Alex K.', reward: '350 XP', color: 'violet' },
    { name: 'Goal Getter', user: 'Emma W.', reward: '200 XP', color: 'amber' },
  ];

  const getBadgeIcon = (badge) => {
    const iconMap = {
      crown: <Crown className="w-3.5 h-3.5 text-amber-400" />,
      flame: <Flame className="w-3.5 h-3.5 text-orange-400" />,
      star: <Star className="w-3.5 h-3.5 text-yellow-400" />,
      medal: <Medal className="w-3.5 h-3.5 text-cyan-400" />,
      target: <Target className="w-3.5 h-3.5 text-emerald-400" />,
      zap: <Zap className="w-3.5 h-3.5 text-violet-400" />,
    };
    return iconMap[badge] || null;
  };

  const CircularProgress = ({ value, size = 44 }) => {
    const radius = (size - 6) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const color = value >= 90 ? '#22c55e' : value >= 70 ? '#8b5cf6' : '#f59e0b';
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {value}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="leaderboard-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)' }}>
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">Student Leaderboard</h2>
            <p className="text-sm text-gray-500">Compete with fellow students</p>
          </div>
        </div>
        
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-32 rounded-xl bg-white/5 border-white/10 text-white" data-testid="time-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[hsl(260,35%,10%)] border-white/10 rounded-xl">
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="alltime">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Your Score Card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-[50px]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Your Study Score</span>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> +5%
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - (userStats?.productivity_score || 78) / 100)}
                    style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{userStats?.productivity_score || 78}</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-emerald-400">
                  {(userStats?.productivity_score || 78) >= 80 ? 'Excellent' : 'Good'}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Rank #4 this week
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm text-gray-500 mb-4">Weekly Progress</p>
          <div className="h-20 flex items-end justify-between gap-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
              const heights = [40, 65, 45, 80, 60, 90, 75];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all"
                    style={{ 
                      height: `${heights[i]}%`,
                      boxShadow: heights[i] > 70 ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none'
                    }}
                  />
                  <span className="text-[10px] text-gray-600">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Recently Completed</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
          <div className="space-y-3">
            {recentAchievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  achievement.color === 'emerald' ? 'bg-emerald-500/20' :
                  achievement.color === 'violet' ? 'bg-violet-500/20' : 'bg-amber-500/20'
                }`}>
                  {achievement.color === 'emerald' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                   achievement.color === 'violet' ? <Target className="w-4 h-4 text-violet-400" /> :
                   <Star className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{achievement.name}</p>
                  <p className="text-xs text-gray-600">{achievement.user}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-400">{achievement.reward}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Focus</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Badges</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((user) => (
                <tr
                  key={user.rank}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    user.isCurrentUser ? 'bg-emerald-500/5' : ''
                  }`}
                  data-testid={`leaderboard-row-${user.rank}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {user.rank <= 3 && (
                        <Star className={`w-4 h-4 ${
                          user.rank === 1 ? 'text-amber-400 fill-amber-400' :
                          user.rank === 2 ? 'text-gray-400 fill-gray-400' :
                          'text-orange-500 fill-orange-500'
                        }`} />
                      )}
                      <span className="font-mono font-medium text-white">{user.rank}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 ring-2 ring-white/10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className={`text-xs font-semibold ${
                          user.isCurrentUser 
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' 
                            : 'bg-white/10 text-gray-400'
                        }`}>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className={`font-medium ${user.isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                          {user.name}
                        </span>
                        {user.isCurrentUser && (
                          <span className="ml-2 text-[10px] text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <CircularProgress value={user.studyScore} />
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-medium flex items-center gap-1 ${
                      user.isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {user.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {user.change}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono">{user.focusHours}h</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame className="w-4 h-4" />
                      <span className="font-mono">{user.streak}d</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {user.badges.map((badge, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center border border-white/10"
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0 text-gray-500 hover:text-white hover:bg-white/10">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-500 px-4">Page 1 of 10</span>
        <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0 text-gray-500 hover:text-white hover:bg-white/10">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Leaderboard;
