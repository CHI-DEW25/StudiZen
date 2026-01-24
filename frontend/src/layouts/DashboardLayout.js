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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar,
  Users,
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const mainNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/tasks', icon: CheckSquare, label: 'My Tasks' },
    { path: '/dashboard/focus', icon: Timer, label: 'Focus Timer' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Insights', badge: '4' },
  ];

  const secondaryNavItems = [
    { path: '/dashboard/goals', icon: Target, label: 'Goals' },
    { path: '/dashboard/groups', icon: Users, label: 'Study Groups' },
  ];

  const bottomNavItems = [
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
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

  const NavItem = ({ item, onClick, collapsed = false }) => (
    <Link
      to={item.path}
      onClick={onClick}
      data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        collapsed ? 'justify-center' : ''
      } ${
        isActive(item.path)
          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border border-emerald-500/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
      }`}
    >
      <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-emerald-400' : 'text-muted-foreground-600 group-hover:text-muted-foreground-400'}`} />
      {!collapsed && (
        <>
      <span className="font-medium flex-1">{item.label}</span>
      {item.badge && (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
          isActive(item.path) 
            ? 'bg-emerald-500/30 text-emerald-300' 
            : 'bg-white/10 text-muted-foreground-400'
        }`}>
          {item.badge}
        </span>
      )}
      {isActive(item.path) && (
        <ChevronRight className="w-4 h-4 text-emerald-500/50" />
      )}
        </>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen gradient-bg">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 z-50 sidebar-gradient border-r border-white/5 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      }`}>
        {/* Decorative elements */}
        <div className="absolute top-20 -left-20 w-40 h-40 bg-emerald-600/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-40 -right-10 w-32 h-32 bg-violet-600/10 rounded-full blur-[60px]" />
        
        {/* Logo */}
        <div className="relative p-6 border-b border-border/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg glow-green">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="font-heading text-lg font-bold text-foreground">StudiZen</span>
                <span className="block text-[10px] text-emerald-400 font-medium tracking-wider">PRODUCTIVITY</span>
              </div>
              )}
            </Link>
          </div>

          {/* Collapse Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-secondary border border-border/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors z-10"
          data-testid="collapse-sidebar-btn"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Navigation */}
        <nav className="relative flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
            ))}
          </div>
          
          {!sidebarCollapsed && (
            <div className="pt-6 pb-2">
              <p className="px-4 text-[10px] font-semibold text-muted-foreground-600 uppercase tracking-wider">Study Tools</p>
            </div>
          )}

          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
            ))}
          </div>
          
          {!sidebarCollapsed && (
            <div className="pt-6 pb-2">
              <p className="px-4 text-[10px] font-semibold text-muted-foreground-600 uppercase tracking-wider">Account</p>
            </div>
          )}

          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <NavItem key={item.path} item={item} collapsed={sidebarCollapsed} />
            ))}
          </div>
        </nav>

        {/* Upgrade Card */}
        {!sidebarCollapsed && (
          <div className="relative p-4">
            <div className="glass-card rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/20 rounded-full blur-[40px]" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">Go Premium</span>
                </div>
                <p className="text-xs text-muted-foreground-500 mb-3">Unlock AI coaching & analytics</p>
                <Button 
                  size="sm" 
                  className="w-full btn-primary rounded-lg text-sm"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* User Section */}
        <div className="relative p-4 border-t border-foreground/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={`flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-colors ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                data-testid="user-menu-trigger"
              >
                <Avatar className="w-10 h-10 ring-2 ring-emerald-500/30">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-foreground font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm text-foreground truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground-600 truncate">{user?.email}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  </>
                )}  
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 rounded-xl bg-[hsl(260,35%,8%)] border border-border/10 shadow-xl"
            >
              <DropdownMenuItem 
                onClick={toggleTheme} 
                className="text-gray-400 hover:text-foreground hover:bg-secondary-foreground/5 rounded-lg cursor-pointer"
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
              <DropdownMenuItem asChild className="text-gray-400 hover:text-foreground hover:bg-secondary-foreground/5 rounded-lg">
                <Link to="/dashboard/settings" data-testid="settings-link">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-secondary-foreground/10" />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer"
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
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 glass-strong border-b border-border/5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-secondary-foreground/5"
            data-testid="mobile-menu-toggle"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-foreground">StudySmart</span>
          </Link>
          
          <button 
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-secondary-foreground/5 relative"
            data-testid="notifications-btn"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
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
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 sidebar-gradient border-r border-border/5 transform transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="absolute top-20 -left-10 w-32 h-32 bg-emerald-600/10 rounded-full blur-[60px]" />
        
        <div className="p-6 border-b border-border/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-heading text-lg font-bold text-foreground">StudySmart</span>
              <span className="block text-[10px] text-emerald-400 font-medium tracking-wider">PRODUCTIVITY</span>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
          ))}
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Study Tools</p>
          </div>
          
          {secondaryNavItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/5">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-500 hover:text-white hover:bg-secondary-foreground/5"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 md:pt-0 min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'md:pl-20' : 'md:pl-72'
      }`}>
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;