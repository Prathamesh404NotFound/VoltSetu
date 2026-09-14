import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Zap,
  BarChart3,
  Settings,
  Menu,
  X,
  Shield,
  Home,
  LogOut,
  Bell,
  HelpCircle,
  ChevronDown,
  Building,
  Search,
  Wallet,
  ShieldCheck,
  ClipboardList,
  Ticket,
  Activity,
  Flag,
  BellRing,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminFooter from './AdminFooter';

const adminNavigation = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'System overview and analytics'
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage user accounts'
  },
  {
    title: 'Charging Spots',
    href: '/admin/spots',
    icon: MapPin,
    description: 'Manage charging locations'
  },
  {
    title: 'Network Stations',
    href: '/admin/network-stations',
    icon: Building,
    description: 'Manage network charging infrastructure'
  },
  {
    title: 'Requests',
    href: '/admin/requests',
    icon: Zap,
    description: 'Handle charging requests'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'View system analytics'
  },
  {
    title: 'Payouts',
    href: '/admin/payouts',
    icon: Wallet,
    description: 'Track host earnings and payouts'
  },
  {
    title: 'Listing Reviews',
    href: '/admin/listing-reviews',
    icon: ClipboardList,
    description: 'Approve or reject new spot listings'
  },
  {
    title: 'Verifications',
    href: '/admin/verifications',
    icon: ShieldCheck,
    description: 'Review host documents & grant trust'
  },
  {
    title: 'Referrals',
    href: '/admin/referrals',
    icon: Ticket,
    description: 'Audit host referral program'
  },
  {
    title: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configure system settings'
  },
  {
    title: 'Demand Heatmap',
    href: '/admin/heatmap',
    icon: Activity,
    description: 'Demand vs supply insights per city'
  },
  {
    title: 'Moderation',
    href: '/admin/moderation',
    icon: Flag,
    description: 'Review reports, mute users, remove content'
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    description: 'Inbox: new flags, pending reviews, verifications'
  },
  {
    title: 'City Waitlist',
    href: '/admin/city-waitlist',
    icon: BellRing,
    description: 'Upcoming-city rider & host signups'
  },
  {
    title: 'Fraud & Anomalies',
    href: '/admin/anomaly',
    icon: ShieldAlert,
    description: 'Automatic scan for suspicious bookings & referrals'
  },
];

interface NavGroup {
  groupTitle: string;
  items: typeof adminNavigation;
}

const navGroups: NavGroup[] = [
  {
    groupTitle: "OVERVIEW",
    items: [
      adminNavigation[0] // Dashboard
    ]
  },
  {
    groupTitle: "NETWORK",
    items: [
      adminNavigation[2], // Spots
      adminNavigation[3], // Network Stations
      adminNavigation[7], // Listing Reviews
      adminNavigation[14], // City Waitlist
    ]
  },
  {
    groupTitle: "PEOPLE",
    items: [
      adminNavigation[1], // Users
      adminNavigation[8], // Verifications
      adminNavigation[12], // Moderation
    ]
  },
  {
    groupTitle: "TRANSACTIONS",
    items: [
      adminNavigation[4], // Requests
      adminNavigation[6], // Payouts
      adminNavigation[9], // Referrals
    ]
  },
  {
    groupTitle: "INSIGHTS",
    items: [
      adminNavigation[5], // Analytics
      adminNavigation[11], // Heatmap
      adminNavigation[15], // Anomaly
    ]
  },
  {
    groupTitle: "COMMUNICATIONS",
    items: [
      adminNavigation[13], // Notifications
    ]
  },
  {
    groupTitle: "SETTINGS",
    items: [
      adminNavigation[10], // Settings
    ]
  }
];

const AdminLayoutPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickFind, setQuickFind] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };
  const activeNavItem = adminNavigation.find((item) => isActiveRoute(item.href));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-base text-foreground block leading-none">
                  ChargePush
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mt-0.5">
                  Operations
                </span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Grouped Navigation */}
          <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <p className="px-3 text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                  {group.groupTitle}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:bg-muted",
                      isActiveRoute(item.href)
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                  >
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="space-y-2 border-t border-border p-4">
            <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Home className="h-4 w-4" />
              <span>View public site</span>
            </Link>
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {user?.displayName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">
                    Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{activeNavItem?.title || 'Operations Center'}</p>
                <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 sm:inline-flex">Live</span>
              </div>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{activeNavItem?.description || 'Monitor and manage the ChargePush network'}</p>
            </div>

            <form
              className="hidden items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 md:flex"
              onSubmit={(event) => {
                event.preventDefault();
                const query = quickFind.trim().toLowerCase();
                const target = adminNavigation.find((item) => item.title.toLowerCase().includes(query));
                if (target) { navigate(target.href); setQuickFind(''); }
              }}
            >
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                value={quickFind}
                onChange={(event) => setQuickFind(event.target.value)}
                placeholder="Quick find…"
                aria-label="Quick find admin section"
                className="w-28 bg-transparent text-xs outline-none placeholder:text-muted-foreground/70 lg:w-36"
              />
              <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline">Enter</kbd>
            </form>

            <Button variant="ghost" size="sm" className="hidden gap-2 text-muted-foreground xl:inline-flex" aria-label="View notifications">
              <Bell className="h-4 w-4" />
              <span className="text-xs">Alerts</span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">
                        Administrator
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    User Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Admin Footer */}
        <AdminFooter />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayoutPage;
