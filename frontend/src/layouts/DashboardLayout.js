import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';
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

/**
 * Paste the FULL base64 noise from your snippet (same as dunno/html.html feImage).
 */
const NOISE_B64 = `PASTE_FULL_NOISE_BASE64_HERE`;

/**
 * Liquid glass CSS
 * - LIGHT MODE: matches dunno/css.css glass recipe
 * - DARK MODE: tinted variant that fits your theme
 */
const buildLiquidCss = () => `
  /* ---------- shared liquid surface ---------- */
  .liquidSurface{
    position:relative;
    overflow:hidden;
    border-radius:1.5rem;

    /* EXACT approach from dunno: use svg filter via url(#frosted) */
    backdrop-filter:url(#frosted);
    -webkit-backdrop-filter:url(#frosted);

    border:2px solid transparent;
  }

  /* LIGHT MODE = dunno/css.css glass base */
  .liquidSurface[data-theme="light"]{
    background:rgba(255,255,255,.08);
    box-shadow:
      0 0 0 2px rgba(255,255,255,.6),
      0 16px 32px rgba(0,0,0,.12);
  }

  /* DARK MODE = tinted version (keep your theme) */
  .liquidSurface[data-theme="dark"]{
    background:rgba(8, 20, 14, 0.52);
    border: 1.5px solid rgba(255, 255, 255, 0.13);
    box-shadow:
      0 0 0 1.5px rgba(255,255,255,0.06) inset,
      0 24px 56px rgba(0,0,0,0.38),
      0 0 80px rgba(16,185,129,0.05);
  }

  /* subtle specular + tint layers */
  .liquidSurface::before,
  .liquidSurface::after{
    content:"";
    position:absolute;
    inset:0;
    border-radius:inherit;
    pointer-events:none;
  }

  /* specular highlight */
  .liquidSurface::before{
    background:radial-gradient(120% 80% at 20% 10%,
      rgba(255,255,255,.22) 0%,
      rgba(255,255,255,.08) 35%,
      rgba(255,255,255,0) 70%);
    opacity:.85;
  }

  /* dark tint bloom */
  .liquidSurface[data-theme="dark"]::after{
    background:
      radial-gradient(120% 120% at 85% 15%,
        rgba(16,185,129,.18) 0%,
        rgba(16,185,129,.07) 42%,
        rgba(0,0,0,0) 70%),
      radial-gradient(120% 120% at 25% 90%,
        rgba(59,130,246,.12) 0%,
        rgba(59,130,246,.06) 40%,
        rgba(0,0,0,0) 70%);
    opacity:.80;
  }

  .liquidSurface > *{
    position:relative;
    z-index:1;
  }

  /* ---------- vertical nav (left/right) ---------- */
  .liquidSidebar{
    position:fixed;
    top:1rem; bottom:1rem;
    z-index:50;
    display:flex;
    flex-direction:column;
    transition:width .3s cubic-bezier(.4,0,.2,1);
  }
  .liquidSidebar[data-position="left"]{ left:1rem; right:auto; }
  .liquidSidebar[data-position="right"]{ right:1rem; left:auto; }

  .liquidSidebar.expanded{ width:18rem; }
  .liquidSidebar.collapsed{ width:5rem; }

  .liquidDivider{
    height:1px;
    margin:.75rem 1rem;
    background:linear-gradient(to right, transparent, rgba(255,255,255,.20), transparent);
  }
  .liquidSurface[data-theme="dark"] .liquidDivider{
    background:linear-gradient(to right, transparent, rgba(255,255,255,.12), transparent);
  }

  .liquidToggle{
    position:absolute;
    right:-.75rem;
    top:5rem;
    width:1.65rem;
    height:1.65rem;
    border-radius:9999px;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    z-index:10;
  }

  .liquidSurface[data-theme="light"] .liquidToggle{
    background:rgba(255,255,255,.70);
    box-shadow:0 10px 25px rgba(0,0,0,.14);
    border:1px solid rgba(0,0,0,.08);
    color:rgba(17,24,39,.55);
  }
  .liquidSurface[data-theme="dark"] .liquidToggle{
    background:rgba(8, 20, 14, 0.65);
    border:1px solid rgba(255,255,255,.14);
    color:rgba(255,255,255,.70);
  }

  .liquidLogoRow{
    padding:1.25rem 1.25rem 1rem;
    display:flex;
    align-items:center;
    gap:.85rem;
  }
  .liquidSidebar.collapsed .liquidLogoRow{
    justify-content:center;
    padding:1.25rem .75rem 1rem;
  }
  .liquidSidebar.collapsed .liquidLogoText{ display:none; }

  .liquidNavItem{
    display:flex;
    align-items:center;
    gap:.75rem;
    padding:.75rem 1rem;
    border-radius:.9rem;
    transition:background .2s ease, color .2s ease, border-color .2s ease;
  }
  .liquidSidebar.collapsed .liquidNavItem{
    justify-content:center;
    padding:.75rem;
  }

  .liquidSurface[data-theme="light"] .liquidNavItem{ color:rgba(17,24,39,.70); }
  .liquidSurface[data-theme="light"] .liquidNavItem:hover{
    background:rgba(255,255,255,.35);
    color:rgba(17,24,39,.90);
  }

  .liquidSurface[data-theme="dark"] .liquidNavItem{ color:rgba(255,255,255,.78); }
  .liquidSurface[data-theme="dark"] .liquidNavItem:hover{
    background:rgba(16,185,129,0.10);
    color:rgba(255,255,255,.92);
  }

  .liquidNavItem.active{
    border:1px solid rgba(16,185,129,.24);
    background:linear-gradient(90deg, rgba(16,185,129,.20), rgba(16,185,129,.08));
    color:rgba(52,211,153,.95);
  }

  .liquidNavLabel{
    flex:1;
    min-width:0;
    font-weight:600;
    font-size:.9rem;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .liquidSidebar.collapsed .liquidNavLabel{ display:none; }

  .liquidNavBadge{
    font-size:.7rem;
    font-weight:700;
    padding:.15rem .45rem;
    border-radius:9999px;
  }
  .liquidSidebar.collapsed .liquidNavBadge{ display:none; }

  .liquidSurface[data-theme="light"] .liquidNavBadge{
    background:rgba(255,255,255,.45);
    color:rgba(17,24,39,.70);
  }
  .liquidSurface[data-theme="dark"] .liquidNavBadge{
    background:rgba(255,255,255,.12);
    color:rgba(255,255,255,.70);
  }

  /* ---------- centered dock ---------- */
  .liquidDock{
    position:fixed;
    left:0; right:0;
    z-index:50;
    height:4.75rem;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:0 1rem;
    pointer-events:none;
  }
  .liquidDock[data-position="top"]{ top:1rem; }
  .liquidDock[data-position="bottom"]{ bottom:1rem; }

  .dockPill{
    pointer-events:auto;
    height:4.25rem;
    border-radius:1.75rem;
    display:flex;
    align-items:center;
    gap:.4rem;
    padding:.45rem .55rem;
    width:fit-content;
    max-width:min(780px, calc(100vw - 2rem));
  }

  .dockIcons{
    display:flex;
    align-items:center;
    justify-content:center;
    gap:.25rem;
    padding:.15rem;
    border-radius:1.25rem;
    overflow:auto hidden;
    scrollbar-width:none;
    max-width:100%;
  }
  .dockIcons::-webkit-scrollbar{ height:0; }

  .dockItem{
    position:relative;
    width:3rem;
    height:3rem;
    border-radius:1.2rem;
    display:flex;
    align-items:center;
    justify-content:center;
    transition:transform .12s ease, background .2s ease;
    color:inherit;
    flex:0 0 auto;
  }

  .liquidSurface[data-theme="light"] .dockItem{ color:rgba(17,24,39,.75); }
  .liquidSurface[data-theme="dark"]  .dockItem{ color:rgba(255,255,255,.82); }

  .dockItem:hover{ transform:translateY(-1px); }
  .liquidSurface[data-theme="light"] .dockItem:hover{ background:rgba(255,255,255,.35); }
  .liquidSurface[data-theme="dark"] .dockItem:hover{ background:rgba(16,185,129,0.10); }

  .dockItem.active{
    background:linear-gradient(180deg, rgba(16,185,129,.22), rgba(16,185,129,.10));
    border:1px solid rgba(16,185,129,.28);
    color:rgba(52,211,153,.95);
  }

  .dockTag{
    position:absolute;
    left:50%;
    transform:translateX(-50%);
    bottom:3.45rem;
    padding:.25rem .55rem;
    border-radius:9999px;
    font-size:.72rem;
    font-weight:700;
    white-space:nowrap;
    opacity:0;
    pointer-events:none;
    transition:opacity .12s ease, transform .12s ease;
  }
  .dockItem:hover .dockTag{
    opacity:1;
    transform:translateX(-50%) translateY(-2px);
  }
  .liquidSurface[data-theme="light"] .dockTag{
    background:rgba(255,255,255,.85);
    border:1px solid rgba(0,0,0,.08);
    color:rgba(17,24,39,.85);
    box-shadow:0 10px 24px rgba(0,0,0,.12);
  }
  .liquidSurface[data-theme="dark"] .dockTag{
    background:rgba(0,0,0,.55);
    border:1px solid rgba(255,255,255,.14);
    color:rgba(255,255,255,.90);
    box-shadow:0 12px 28px rgba(0,0,0,.45);
  }

  .dockSep{
    width:1px;
    height:2.25rem;
    border-radius:9999px;
    flex:0 0 auto;
    opacity:.75;
    background:rgba(255,255,255,.18);
  }
  .liquidSurface[data-theme="light"] .dockSep{ background:rgba(0,0,0,.10); }
  .liquidSurface[data-theme="dark"] .dockSep{ background:rgba(255,255,255,.12); }
`;

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { navPosition } = useLayout();

  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const liquidCss = useMemo(() => buildLiquidCss(), []);

  const mainNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/planner', icon: Calendar, label: 'Smart Planner' },
    { path: '/dashboard/tasks', icon: CheckSquare, label: 'My Tasks' },
    { path: '/dashboard/focus', icon: Timer, label: 'Focus Timer' },
    { path: '/dashboard/analytics', icon: BarChart3, label: 'Insights', badge: '4' },
  ];

  const secondaryNavItems = [
    { path: '/dashboard/goals', icon: Target, label: 'Goals' },
    { path: '/dashboard/groups', icon: Users, label: 'Study Groups' },
  ];

  const bottomNavItems = [{ path: '/dashboard/settings', icon: Settings, label: 'Settings' }];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const NavItemVertical = ({ item, onClick, collapsed = false }) => {
    const active = isActive(item.path);

    return (
      <Link
        to={item.path}
        onClick={onClick}
        title={collapsed ? item.label : undefined}
        data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
        className={`liquidNavItem ${active ? 'active' : ''}`}
      >
        <item.icon className="w-5 h-5" />
        <span className="liquidNavLabel">{item.label}</span>
        {item.badge && <span className="liquidNavBadge">{item.badge}</span>}
        {!collapsed && active && <ChevronRight className="w-4 h-4 text-emerald-500/50" />}
      </Link>
    );
  };

  const DockItem = ({ item }) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        className={`dockItem ${active ? 'active' : ''}`}
        data-testid={`dock-${item.label.toLowerCase().replace(' ', '-')}`}
      >
        <span className="dockTag">{item.label}</span>
        <Icon className="w-5 h-5" />
      </Link>
    );
  };

  const dataTheme = theme === 'dark' ? 'dark' : 'light';
  const isDock = navPosition === 'top' || navPosition === 'bottom';
  const isVertical = navPosition === 'left' || navPosition === 'right';

  const sidebarWidthPx = sidebarCollapsed ? 80 : 288;
  const sideGutterPx = 32;
  const dockHeightPx = 76;
  const dockGutterPx = 32;

  const mainStyle = useMemo(() => {
    const s = {};
    if (isVertical) {
      if (navPosition === 'left') s.paddingLeft = `${sidebarWidthPx + sideGutterPx}px`;
      if (navPosition === 'right') s.paddingRight = `${sidebarWidthPx + sideGutterPx}px`;
    }
    if (isDock) {
      if (navPosition === 'top') s.paddingTop = `${dockHeightPx + dockGutterPx}px`;
      if (navPosition === 'bottom') s.paddingBottom = `${dockHeightPx + dockGutterPx}px`;
    }
    return s;
  }, [isVertical, isDock, navPosition, sidebarWidthPx]);

  return (
    <>
      <style>{liquidCss}</style>

      {/* Filter matches dunno/html.html structure */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <filter id="frosted" primitiveUnits="objectBoundingBox">
          <feImage href={`data:image/png;base64,${NOISE_B64}`} x="0" y="0" width="1" height="1" result="map" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur" />
          <feDisplacementMap id="disp" in="blur" in2="map" scale="1" xChannelSelector="R" yChannelSelector="G">
            <animate attributeName="scale" to="1.4" dur="0.3s" begin="glassNav.mouseover" fill="freeze" />
            <animate attributeName="scale" to="1" dur="0.3s" begin="glassNav.mouseout" fill="freeze" />
          </feDisplacementMap>
        </filter>
      </svg>

      <div className="min-h-screen gradient-bg">
        {/* Desktop Nav: Vertical OR Center Dock */}
        {isVertical && (
          <aside
            id="glassNav"
            className={`hidden md:flex liquidSidebar liquidSurface ${sidebarCollapsed ? 'collapsed' : 'expanded'}`}
            data-theme={dataTheme}
            data-position={navPosition}
          >
            <div className="relative">
              <div className="liquidLogoRow">
                <Link to="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="liquidLogoText">
                    <span className="font-heading text-lg font-bold text-foreground">StudiZen</span>
                    <span className="block text-[10px] text-emerald-400 font-medium tracking-wider">PRODUCTIVITY</span>
                  </div>
                </Link>
              </div>

              <button
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="liquidToggle"
                data-testid="collapse-sidebar-btn"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            <div className="liquidDivider" />

            <nav className="flex-1 px-4 pb-3 space-y-1 overflow-y-auto">
              <div className="space-y-1">
                {mainNavItems.map((item) => (
                  <NavItemVertical key={item.path} item={item} collapsed={sidebarCollapsed} />
                ))}
              </div>

              {!sidebarCollapsed && (
                <div className="pt-6 pb-2">
                  <p className="px-2 text-[10px] font-semibold text-muted-foreground-600 uppercase tracking-wider">
                    Study Tools
                  </p>
                </div>
              )}

              <div className="space-y-1">
                {secondaryNavItems.map((item) => (
                  <NavItemVertical key={item.path} item={item} collapsed={sidebarCollapsed} />
                ))}
              </div>

              {!sidebarCollapsed && (
                <div className="pt-6 pb-2">
                  <p className="px-2 text-[10px] font-semibold text-muted-foreground-600 uppercase tracking-wider">
                    Account
                  </p>
                </div>
              )}

              <div className="space-y-1">
                {bottomNavItems.map((item) => (
                  <NavItemVertical key={item.path} item={item} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </nav>

            {!sidebarCollapsed && (
              <div className="relative px-4 pb-4">
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
                    <Button size="sm" className="w-full btn-primary rounded-lg text-sm">
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="relative p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="liquidUserBtn" data-testid="user-menu-trigger">
                    <Avatar className="w-10 h-10 ring-2 ring-emerald-500/30">
                      <AvatarImage src={user?.picture} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-foreground font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="liquidUserInfo flex-1 text-left min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground-600 truncate">{user?.email}</p>
                    </div>

                    {!sidebarCollapsed && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                    )}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 rounded-xl bg-popover border border-border shadow-xl">
                  <DropdownMenuItem
                    onClick={toggleTheme}
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg cursor-pointer"
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

                  <DropdownMenuItem asChild className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg">
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
        )}

        {isDock && (
          <aside id="glassNav" className="hidden md:flex liquidDock" data-position={navPosition}>
            <div className="dockPill liquidSurface" data-theme={dataTheme}>
              <Link to="/" className="dockItem" aria-label="Home">
                <span className="dockTag">Home</span>
                <Zap className="w-5 h-5" />
              </Link>

              <span className="dockSep" aria-hidden="true" />

              <div className="dockIcons">
                {mainNavItems.map((item) => (
                  <DockItem key={item.path} item={item} />
                ))}
                {secondaryNavItems.map((item) => (
                  <DockItem key={item.path} item={item} />
                ))}
                {bottomNavItems.map((item) => (
                  <DockItem key={item.path} item={item} />
                ))}
              </div>

              <span className="dockSep" aria-hidden="true" />

              <button
                onClick={toggleTheme}
                className="dockItem"
                type="button"
                aria-label="Toggle theme"
                data-testid="dock-theme-toggle"
              >
                <span className="dockTag">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="dockItem" data-testid="dock-user-menu" aria-label="User menu">
                    <span className="dockTag">{user?.name || 'User'}</span>
                    <Avatar className="w-8 h-8 ring-2 ring-emerald-500/30">
                      <AvatarImage src={user?.picture} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-foreground font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 rounded-xl bg-popover border border-border shadow-xl">
                  <DropdownMenuItem asChild className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg">
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
        )}

        {/* Mobile Header / Sidebar unchanged from your app */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 glass-strong border-b border-border/5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50"
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

            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 relative" data-testid="notifications-btn">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
          </div>
        </header>

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        <aside
          className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 sidebar-gradient border-r border-border/5 transform transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
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
            {[...mainNavItems, ...secondaryNavItems, ...bottomNavItems].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium flex-1">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/5">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        <main className="pt-16 md:pt-0 min-h-screen transition-all duration-300" style={mainStyle}>
          <div className="p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
};

export default DashboardLayout;