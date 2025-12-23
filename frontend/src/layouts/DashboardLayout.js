import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Target,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Zap,
  Bell,
  ChevronRight,
  Sparkles,
  HelpCircle,
  CreditCard,
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mainNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/tasks', icon: CheckSquare, label: 'My Tasks', badge: null },
    { path: '/dashboard/focus', icon: Timer, label: 'Focus Timer' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Insights', badge: '4' },
  ];

  const secondaryNavItems = [
    { path: '/dashboard/goals', icon: Target, label: 'Goals' },
    { path: '/dashboard/ai-coach', icon: Sparkles, label: 'AI Coach' },
  ];

  const bottomNavItems = [
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { path: '/dashboard/help', icon: HelpCircle, label: 'Help & Support' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ item, onClick }) => (
    <Link
      to={item.path}
      onClick={onClick}
      data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive(item.path)
          ? 'bg-gradient-to-r from-violet-600/90 to-purple-600/90 text-white shadow-lg shadow-violet-500/25'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
      <span className="font-medium flex-1">{item.label}</span>
      {item.badge && (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
          isActive(item.path) 
            ? 'bg-white/20 text-white' 
            : 'bg-violet-500/20 text-violet-400'
        }`}>
          {item.badge}
        </span>
      )}
      {isActive(item.path) && (
        <ChevronRight className="w-4 h-4 text-white/70" />
      )}
    </Link>
  );

  return (
    <div className="min-h-screen gradient-bg">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 fixed inset-y-0 z-50 bg-gradient-to-b from-[#0f0a1f] via-[#150d2d] to-[#0d0619] border-r border-white/5">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 -left-20 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 -right-10 w-32 h-32 bg-purple-600/15 rounded-full blur-3xl" />
        
        {/* Logo */}
        <div className="relative p-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 ring-1 ring-white/10">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-heading text-lg font-bold text-white">StudySmart</span>
              <span className="block text-[10px] text-violet-400 font-medium tracking-wider">PRODUCTIVITY</span>
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="relative flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Main Section */}
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Section Divider */}
          <div className="pt-6 pb-2">
            <p className="px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Study Tools</p>
          </div>

          {/* Secondary Section */}
          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Section Divider */}
          <div className="pt-6 pb-2">
            <p className="px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Account</p>
          </div>

          {/* Bottom Section */}
          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </nav>

        {/* Upgrade Card */}
        <div className="relative p-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white text-sm">Go Premium</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Unlock AI coaching & advanced analytics</p>
            <Button 
              size="sm" 
              className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-violet-500/25"
            >
              Upgrade Now
            </Button>
          </div>
        </div>

        {/* User Section */}
        <div className="relative p-4 border-t border-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors"
                data-testid="user-menu-trigger"
              >
                <Avatar className="w-10 h-10 ring-2 ring-violet-500/30">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 rounded-xl bg-[#1a1128] border border-white/10 shadow-xl shadow-black/50"
            >
              <DropdownMenuItem 
                onClick={toggleTheme} 
                className="text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                data-testid="theme-toggle-btn"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">
                <Link to="/dashboard/settings" data-testid="settings-link">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-[#0f0a1f]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            data-testid="mobile-menu-toggle"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-white">StudySmart</span>
          </Link>
          
          <button 
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 relative"
            data-testid="notifications-btn"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#0f0a1f] via-[#150d2d] to-[#0d0619] transform transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 -left-10 w-32 h-32 bg-violet-600/20 rounded-full blur-3xl" />
        
        <div className="p-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-heading text-lg font-bold text-white">StudySmart</span>
              <span className="block text-[10px] text-violet-400 font-medium tracking-wider">PRODUCTIVITY</span>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
          ))}
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Study Tools</p>
          </div>
          
          {secondaryNavItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-72 pt-16 md:pt-0 min-h-screen">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
