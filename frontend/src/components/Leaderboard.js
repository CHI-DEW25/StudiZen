import React, { useState, useEffect } from 'react';
import { leaderboardApi } from '../lib/api';
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
  Loader2,
} from 'lucide-react';

const Leaderboard = ({ currentUser, userStats }) => {
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const period = timeFilter === 'daily' ? 'weekly' : timeFilter === 'alltime' ? 'alltime' : timeFilter;
      const response = await leaderboardApi.get(period, 20);
      setLeaderboardData(response.data.leaderboard || []);
      setCurrentUserRank(response.data.current_user_rank);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgesForUser = (rank, xp, streak) => {
    const badges = [];
    if (rank === 1) badges.push('crown');
    if (rank <= 3) badges.push('medal');
    if (streak >= 7) badges.push('flame');
    if (xp >= 500) badges.push('star');
    if (xp >= 1000) badges.push('zap');
    return badges.slice(0, 3);
  };

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
    const normalizedValue = Math.min(value, 100);
    const offset = circumference - (normalizedValue / 100) * circumference;
    const color = normalizedValue >= 90 ? '#22c55e' : normalizedValue >= 70 ? '#8b5cf6' : '#f59e0b';
    
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
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
          {Math.round(normalizedValue)}
        </span>
      </div>
    );
  };

  // Paginate leaderboard data
  const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);
  const paginatedData = leaderboardData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate study score based on XP (normalize to 0-100 range)
  const calculateStudyScore = (xp, totalXp) => {
    if (!xp) return 0;
    const maxXpExpected = Math.max(...leaderboardData.map(u => u.xp || 0), 1);
    return Math.min(Math.round((xp / maxXpExpected) * 100), 100);
  };

  // Find current user data
  const currentUserData = leaderboardData.find(u => u.is_current_user);
  const userScore = currentUserData 
    ? calculateStudyScore(currentUserData.xp, currentUserData.total_xp)
    : userStats?.productivity_score || 0;

  const recentAchievements = leaderboardData.slice(0, 3).map((user, index) => ({
    name: index === 0 ? 'Top Performer' : index === 1 ? 'Rising Star' : 'Consistent',
    user: user.name?.split(' ')[0] || 'Student',
    reward: `${user.xp || 0} XP`,
    color: index === 0 ? 'emerald' : index === 1 ? 'violet' : 'amber',
  }));

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="leaderboard-section">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="leaderboard-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)' }}>
            <Trophy className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Student Leaderboard</h2>
            <p className="text-sm text-muted-foreground-500">Compete with fellow students</p>
          </div>
        </div>
        
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-32 rounded-xl bg-card-foreground/5 border-border/10 text-foreground" data-testid="time-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-secondary border-foreground/10 rounded-xl">
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
                    strokeDashoffset={2 * Math.PI * 34 * (1 - userScore / 100)}
                    style={{ filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{userScore}</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-emerald-400">
                  {userScore >= 80 ? 'Excellent' : userScore >= 60 ? 'Good' : 'Keep Going!'}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Rank #{currentUserData?.rank || currentUserRank || '-'} this week
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
                  <span className="text-[10px] text-muted-foreground-600">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground-500">Top Performers</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground-600" />
          </div>
          <div className="space-y-3">
            {recentAchievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  achievement.color === 'emerald' ? 'bg-emerald-500/20' :
                  achievement.color === 'violet' ? 'bg-violet-500/20' : 'bg-amber-500/20'
                }`}>
                  {achievement.color === 'emerald' ? <Crown className="w-4 h-4 text-emerald-400" /> :
                   achievement.color === 'violet' ? <Star className="w-4 h-4 text-violet-400" /> :
                   <Medal className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground-600">{achievement.user}</p>
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
              <tr className="border-b border-norder/5">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">#</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">Student</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">Score</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">XP</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">Focus</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">Streak</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">Badges</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-muted-foreground-500">
                    No leaderboard data yet. Complete tasks and focus sessions to appear here!
                  </td>
                </tr>
              ) : (
                paginatedData.map((user) => {
                  const studyScore = calculateStudyScore(user.xp, user.total_xp);
                  const badges = getBadgesForUser(user.rank, user.xp, user.streak);
                  
                  return (
                    <tr
                      key={user.user_id}
                      className={`border-b border-border/5 hover:bg-white/5 transition-colors ${
                        user.is_current_user ? 'bg-emerald-500/5' : ''
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
                          <span className="font-mono font-medium text-foreground">{user.rank}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 ring-2 ring-foreground/10">
                            <AvatarImage src={user.picture} />
                            <AvatarFallback className={`text-xs font-semibold ${
                              user.is_current_user 
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-foreground' 
                                : 'bg-white/10 text-muted-foreground-400'
                            }`}>
                              {user.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className={`font-medium ${user.is_current_user ? 'text-emerald-400' : 'text-foreground'}`}>
                              {user.name}
                            </span>
                            {user.is_current_user && (
                              <span className="ml-2 text-[10px] text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded-full">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <CircularProgress value={studyScore} />
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-mono font-bold text-amber-400">
                          {user.xp?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground-400">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono">{user.focus_hours || 0}h</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-orange-400">
                          <Flame className="w-4 h-4" />
                          <span className="font-mono">{user.streak || 0}d</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {badges.map((badge, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full bg-foreground/5 flex items-center justify-center border border-foreground/10"
                            >
                              {getBadgeIcon(badge)}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full w-8 h-8 p-0 text-gray-500 hover:text-white hover:bg-white/10"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500 px-4">Page {currentPage} of {totalPages}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full w-8 h-8 p-0 text-gray-500 hover:text-white hover:bg-white/10"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;