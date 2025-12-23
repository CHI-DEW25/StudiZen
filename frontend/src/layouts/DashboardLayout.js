import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
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
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/dashboard/focus', icon: Timer, label: 'Focus Timer' },
    { path: '/dashboard/goals', icon: Target, label: 'Goals' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
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

  return (
    <div className="min-h-screen gradient-bg">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-sidebar fixed inset-y-0 z-50">
        {/* Logo */}
        <div className="p-6 border-b border-white/20">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground">StudySmart</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-white/10 hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors" data-testid="user-menu-trigger">
                <Avatar className="w-10 h-10 ring-2 ring-white/50">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm truncate text-foreground">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl glass-card-strong">
              <DropdownMenuItem onClick={toggleTheme} data-testid="theme-toggle-btn">
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
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" data-testid="settings-link">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 glass-card">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10"
            data-testid="mobile-menu-toggle"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold">StudySmart</span>
          </Link>
          
          <button className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10" data-testid="notifications-btn">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 glass-sidebar transform transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-white/20">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold">StudySmart</span>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                  : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-white/10'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
