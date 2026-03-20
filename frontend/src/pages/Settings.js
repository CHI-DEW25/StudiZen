import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Moon, Sun, User, Mail, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NAV_POSITION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top', label: 'Top (Dock)' },
  { value: 'bottom', label: 'Bottom (Dock)' },
];

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { navPosition, setNavPosition } = useLayout();
  const navigate = useNavigate();

  const navLabel =
    NAV_POSITION_OPTIONS.find((o) => o.value === navPosition)?.label || 'Left';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="settings-page">
      <div>
        <h1 className="font-heading text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-card/50 border-border/10 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.picture} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-lg">{user?.name || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Card */}
      <Card className="bg-card/50 border-border/10 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-amber" />
              )}
              <div>
                <Label htmlFor="theme-toggle" className="font-medium">
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Toggle between light and dark themes
                </p>
              </div>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
              data-testid="theme-switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout Card (Dropdown) */}
      <Card className="bg-card/50 border-border/10 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="font-medium">Navigation Position</Label>
            <p className="text-sm text-muted-foreground">
              Choose where the liquid-glass navigation appears.
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 border border-border/10 bg-secondary/20 hover:bg-secondary/30 transition text-left"
                data-testid="navpos-dropdown-trigger"
                aria-label="Navigation position"
              >
                <span className="text-sm font-medium text-foreground">{navLabel}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-64 rounded-xl bg-popover border border-border shadow-xl"
            >
              {NAV_POSITION_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setNavPosition(opt.value)}
                  className={`rounded-lg cursor-pointer ${
                    navPosition === opt.value
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                  data-testid={`navpos-${opt.value}`}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-card/50 border-destructive/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-destructive">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="rounded-xl"
            data-testid="settings-logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;